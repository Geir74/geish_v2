/*
 * Admin-moderering av Stua (E6 bolk 6, design D4).
 *
 * SIKKERHET: isAdmin() FØR hver skriving (E4.5-mønster, fail closed). Domenedata
 * via Drizzle (omgår RLS) — admin-grensen bor HER i server-laget, ikke i RLS.
 * updated_at settes eksplisitt ved hver endring (sporbarhet, Hugin-mønster fra E5).
 *
 * KRITISK (Hugin bolk 2-3 + spec 6.2): reply_count teller PUBLISHED svar utover
 * åpningsinnlegget og er autoritativ for «tom tråd»-sjekken (deleteOwnThread).
 * Derfor MÅ hidePost/showPost/deletePost på et svar (ikke åpningsinnlegget)
 * dekrementere/inkrementere reply_count i takt — ellers kan en eier aldri slette
 * en tråd der alle svar er skjult (falsk «ikke tom»), eller telleren blir negativ.
 *
 * moveThread bytter KUN room_id — rører IKKE last_activity_at (ellers hopper
 * gamle tråder til topp i nytt rom) og IKKE slug/URL (kanonisk, immutabel).
 */
"use server";

import { asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { stuaPosts, stuaRooms, stuaThreads } from "@/db/schema";
import { isAdmin } from "@/lib/admin/is-admin";

export type ModerationResult = { ok: boolean; error?: string };

const idSchema = z.string().uuid();

function revalidateStua(threadSlug?: string, roomSlug?: string) {
  revalidatePath("/admin/stua");
  revalidatePath("/stua");
  if (roomSlug) revalidatePath(`/stua/${roomSlug}`);
  if (threadSlug) revalidatePath(`/stua/t/${threadSlug}`);
}

/** Slug + romslug for revalidering av én tråd. */
async function threadPaths(
  threadId: string,
): Promise<{ slug: string; roomSlug: string } | null> {
  const [row] = await db
    .select({ slug: stuaThreads.slug, roomSlug: stuaRooms.slug })
    .from(stuaThreads)
    .innerJoin(stuaRooms, eq(stuaRooms.id, stuaThreads.roomId))
    .where(eq(stuaThreads.id, threadId))
    .limit(1);
  return row ?? null;
}

/* ── Tråd: skjul / vis ──────────────────────────────────────────────────── */

async function setThreadStatus(
  threadId: string,
  status: "published" | "hidden",
): Promise<ModerationResult> {
  if (!(await isAdmin())) return { ok: false, error: "unauthorized" };
  const parsed = idSchema.safeParse(threadId);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const paths = await threadPaths(parsed.data);
  await db
    .update(stuaThreads)
    .set({ status, updatedAt: new Date() })
    .where(eq(stuaThreads.id, parsed.data));

  revalidateStua(paths?.slug, paths?.roomSlug);
  return { ok: true };
}

export async function hideThread(threadId: string): Promise<ModerationResult> {
  return setThreadStatus(threadId, "hidden");
}

export async function showThread(threadId: string): Promise<ModerationResult> {
  return setThreadStatus(threadId, "published");
}

/* ── Innlegg: skjul / vis (soft) med reply_count-vedlikehold ─────────────── */

/**
 * Skjul/vis et enkeltinnlegg. Hvis innlegget er et SVAR (ikke åpningsinnlegget =
 * eldste post i tråden) OG status faktisk endres for et published↔hidden-svar,
 * justeres trådens reply_count tilsvarende. Åpningsinnlegget teller ikke med i
 * reply_count → røres aldri her.
 */
async function setPostStatus(
  postId: string,
  status: "published" | "hidden",
): Promise<ModerationResult> {
  if (!(await isAdmin())) return { ok: false, error: "unauthorized" };
  const parsed = idSchema.safeParse(postId);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const [post] = await db
    .select({
      id: stuaPosts.id,
      threadId: stuaPosts.threadId,
      status: stuaPosts.status,
    })
    .from(stuaPosts)
    .where(eq(stuaPosts.id, parsed.data))
    .limit(1);
  if (!post) return { ok: false, error: "invalid" };

  // Åpningsinnlegg = eldste post i tråden. Det teller ikke i reply_count.
  const [oldest] = await db
    .select({ id: stuaPosts.id })
    .from(stuaPosts)
    .where(eq(stuaPosts.threadId, post.threadId))
    .orderBy(asc(stuaPosts.createdAt))
    .limit(1);
  const isOpeningPost = oldest?.id === post.id;

  const statusChanged = post.status !== status;

  await db.transaction(async (tx) => {
    await tx
      .update(stuaPosts)
      .set({ status, updatedAt: new Date() })
      .where(eq(stuaPosts.id, parsed.data));

    if (!isOpeningPost && statusChanged) {
      // published → hidden: -1. hidden → published: +1. Klemt til ≥ 0.
      const delta = status === "hidden" ? -1 : 1;
      await tx
        .update(stuaThreads)
        .set({
          replyCount: sql`greatest(${stuaThreads.replyCount} + ${delta}, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(stuaThreads.id, post.threadId));
    }
  });

  const paths = await threadPaths(post.threadId);
  revalidateStua(paths?.slug, paths?.roomSlug);
  return { ok: true };
}

export async function hidePost(postId: string): Promise<ModerationResult> {
  return setPostStatus(postId, "hidden");
}

export async function showPost(postId: string): Promise<ModerationResult> {
  return setPostStatus(postId, "published");
}

/* ── Slett hel tråd (også besvart) ──────────────────────────────────────── */

/** Hard-delete av tråd inkl. alle svar (CASCADE). Admin får slette besvarte. */
export async function deleteThread(
  threadId: string,
): Promise<ModerationResult> {
  if (!(await isAdmin())) return { ok: false, error: "unauthorized" };
  const parsed = idSchema.safeParse(threadId);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const paths = await threadPaths(parsed.data);
  await db.delete(stuaThreads).where(eq(stuaThreads.id, parsed.data));

  revalidateStua(paths?.slug, paths?.roomSlug);
  return { ok: true };
}

/* ── Flytt tråd (kun room_id) ───────────────────────────────────────────── */

/** Flytt tråd til annet rom. Rører IKKE last_activity_at eller slug/URL. */
export async function moveThread(
  threadId: string,
  newRoomSlug: string,
): Promise<ModerationResult> {
  if (!(await isAdmin())) return { ok: false, error: "unauthorized" };
  const parsed = idSchema.safeParse(threadId);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const [room] = await db
    .select({ id: stuaRooms.id })
    .from(stuaRooms)
    .where(eq(stuaRooms.slug, newRoomSlug))
    .limit(1);
  if (!room) return { ok: false, error: "invalid" };

  await db
    .update(stuaThreads)
    .set({ roomId: room.id, updatedAt: new Date() })
    .where(eq(stuaThreads.id, parsed.data));

  const paths = await threadPaths(parsed.data);
  revalidateStua(paths?.slug, newRoomSlug);
  return { ok: true };
}

/* ── Anonymiser innlegg (author_id = NULL → stormtrooper) ────────────────── */

const anonymizeSchema = z.object({
  postId: z.string().uuid(),
  // Valgfri body-rewrite (fjerne sensitiv info). Tom → behold body.
  body: z.string().trim().max(10000).optional(),
});

/**
 * Anonymiser et innlegg: author_id = NULL (→ stormtrooper-fallback i visning),
 * med valgfri body-redigering for å fjerne sensitiv info.
 */
export async function anonymizePost(
  formData: FormData,
): Promise<ModerationResult> {
  if (!(await isAdmin())) return { ok: false, error: "unauthorized" };

  const parsed = anonymizeSchema.safeParse({
    postId: formData.get("post_id"),
    body: (formData.get("body") as string | null)?.trim() || undefined,
  });
  if (!parsed.success) return { ok: false, error: "invalid" };

  const [post] = await db
    .select({ threadId: stuaPosts.threadId })
    .from(stuaPosts)
    .where(eq(stuaPosts.id, parsed.data.postId))
    .limit(1);
  if (!post) return { ok: false, error: "invalid" };

  await db
    .update(stuaPosts)
    .set({
      authorId: null,
      ...(parsed.data.body ? { body: parsed.data.body } : {}),
      updatedAt: new Date(),
    })
    .where(eq(stuaPosts.id, parsed.data.postId));

  const paths = await threadPaths(post.threadId);
  revalidateStua(paths?.slug, paths?.roomSlug);
  return { ok: true };
}

/* ── Rediger tråd-tittel eller innlegg-body ─────────────────────────────── */

const editThreadSchema = z.object({
  threadId: z.string().uuid(),
  title: z.string().trim().min(1).max(160),
});

export async function editThreadTitle(
  formData: FormData,
): Promise<ModerationResult> {
  if (!(await isAdmin())) return { ok: false, error: "unauthorized" };
  const parsed = editThreadSchema.safeParse({
    threadId: formData.get("thread_id"),
    title: formData.get("title"),
  });
  if (!parsed.success) return { ok: false, error: "invalid" };

  await db
    .update(stuaThreads)
    .set({ title: parsed.data.title, updatedAt: new Date() })
    .where(eq(stuaThreads.id, parsed.data.threadId));

  const paths = await threadPaths(parsed.data.threadId);
  revalidateStua(paths?.slug, paths?.roomSlug);
  return { ok: true };
}

const editPostSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().trim().min(1).max(10000),
});

export async function editPost(
  formData: FormData,
): Promise<ModerationResult> {
  if (!(await isAdmin())) return { ok: false, error: "unauthorized" };
  const parsed = editPostSchema.safeParse({
    postId: formData.get("post_id"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { ok: false, error: "invalid" };

  const [post] = await db
    .select({ threadId: stuaPosts.threadId })
    .from(stuaPosts)
    .where(eq(stuaPosts.id, parsed.data.postId))
    .limit(1);
  if (!post) return { ok: false, error: "invalid" };

  await db
    .update(stuaPosts)
    .set({ body: parsed.data.body, updatedAt: new Date() })
    .where(eq(stuaPosts.id, parsed.data.postId));

  const paths = await threadPaths(post.threadId);
  revalidateStua(paths?.slug, paths?.roomSlug);
  return { ok: true };
}
