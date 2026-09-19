/*
 * Stua skrive-server-actions (E6, bolk 3). Alle krever innlogging (getUser).
 * Domenedata via Drizzle (omgår RLS). last_activity_at + reply_count vedlikeholdes
 * transaksjonelt. Validering gir pen t()-feil FØR DB-CHECK smeller (Hugin bolk1).
 *
 * reply_count teller PUBLISHED svar utover åpningsinnlegget (autoritativ for
 * «tom tråd»-sjekk). Bumpes i createReply, dekrementeres ved admin hide/delete
 * (se admin-actions, bolk 6).
 */
"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { stuaPosts, stuaRooms, stuaThreads } from "@/db/schema";
import { t } from "@/content/i18n";
import { baseThreadSlug, uniqueThreadSlug } from "@/lib/stua/slugify";
import { createClient } from "@/lib/supabase/server";

export type StuaActionResult =
  | { ok: true; slug?: string }
  | { ok: false; message: string };

const titleSchema = z.string().trim().min(1, "titleRequired").max(160, "titleTooLong");
const bodySchema = z.string().trim().min(1, "bodyRequired").max(10000, "bodyTooLong");

async function currentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

/** Opprett tråd (åpningsinnlegg = første post) i et rom. */
export async function createThread(
  formData: FormData,
): Promise<StuaActionResult> {
  const S = t().stuaForum;
  const userId = await currentUserId();
  if (!userId) return { ok: false, message: S.errors.notLoggedIn };

  const roomSlug = String(formData.get("room_slug") ?? "");
  const titleP = titleSchema.safeParse(formData.get("title") ?? "");
  if (!titleP.success) {
    const k = titleP.error.issues[0]?.message as keyof typeof S.errors;
    return { ok: false, message: S.errors[k] ?? S.errors.generic };
  }
  const bodyP = bodySchema.safeParse(formData.get("body") ?? "");
  if (!bodyP.success) {
    const k = bodyP.error.issues[0]?.message as keyof typeof S.errors;
    return { ok: false, message: S.errors[k] ?? S.errors.generic };
  }

  const [room] = await db
    .select({ id: stuaRooms.id })
    .from(stuaRooms)
    .where(eq(stuaRooms.slug, roomSlug))
    .limit(1);
  if (!room) return { ok: false, message: S.errors.generic };

  const base = baseThreadSlug(titleP.data);
  const slug = await uniqueThreadSlug(base, async (candidate) => {
    const [hit] = await db
      .select({ id: stuaThreads.id })
      .from(stuaThreads)
      .where(eq(stuaThreads.slug, candidate))
      .limit(1);
    return Boolean(hit);
  });

  try {
    await db.transaction(async (tx) => {
      const [thread] = await tx
        .insert(stuaThreads)
        .values({
          roomId: room.id,
          authorId: userId,
          title: titleP.data,
          slug,
        })
        .returning({ id: stuaThreads.id });
      await tx.insert(stuaPosts).values({
        threadId: thread.id,
        authorId: userId,
        body: bodyP.data,
      });
    });
  } catch {
    return { ok: false, message: S.errors.generic };
  }

  revalidatePath(`/stua/${roomSlug}`);
  return { ok: true, slug };
}

/** Svar i en tråd. Bump last_activity_at + reply_count. */
export async function createReply(
  threadId: string,
  formData: FormData,
): Promise<StuaActionResult> {
  const S = t().stuaForum;
  const userId = await currentUserId();
  if (!userId) return { ok: false, message: S.errors.notLoggedIn };

  const bodyP = bodySchema.safeParse(formData.get("body") ?? "");
  if (!bodyP.success) {
    const k = bodyP.error.issues[0]?.message as keyof typeof S.errors;
    return { ok: false, message: S.errors[k] ?? S.errors.generic };
  }

  const [thread] = await db
    .select({ id: stuaThreads.id, slug: stuaThreads.slug, status: stuaThreads.status })
    .from(stuaThreads)
    .where(eq(stuaThreads.id, threadId))
    .limit(1);
  if (!thread || thread.status !== "published") {
    return { ok: false, message: S.errors.generic };
  }

  try {
    await db.transaction(async (tx) => {
      await tx.insert(stuaPosts).values({
        threadId,
        authorId: userId,
        body: bodyP.data,
      });
      await tx
        .update(stuaThreads)
        .set({
          lastActivityAt: new Date(),
          replyCount: sql`${stuaThreads.replyCount} + 1`,
        })
        .where(eq(stuaThreads.id, threadId));
    });
  } catch {
    return { ok: false, message: S.errors.generic };
  }

  revalidatePath(`/stua/t/${thread.slug}`);
  return { ok: true, slug: thread.slug };
}

/** Rediger eget innlegg (eier-avgrenset). Rører ikke status. */
export async function editOwnPost(
  postId: string,
  formData: FormData,
): Promise<StuaActionResult> {
  const S = t().stuaForum;
  const userId = await currentUserId();
  if (!userId) return { ok: false, message: S.errors.notLoggedIn };

  const bodyP = bodySchema.safeParse(formData.get("body") ?? "");
  if (!bodyP.success) {
    const k = bodyP.error.issues[0]?.message as keyof typeof S.errors;
    return { ok: false, message: S.errors[k] ?? S.errors.generic };
  }

  await db
    .update(stuaPosts)
    .set({ body: bodyP.data, updatedAt: new Date() })
    .where(and(eq(stuaPosts.id, postId), eq(stuaPosts.authorId, userId)));

  return { ok: true };
}

/** Flytt egen tråd til annet rom. Rører IKKE last_activity_at eller slug. */
export async function moveOwnThread(
  threadId: string,
  newRoomSlug: string,
): Promise<StuaActionResult> {
  const S = t().stuaForum;
  const userId = await currentUserId();
  if (!userId) return { ok: false, message: S.errors.notLoggedIn };

  const [room] = await db
    .select({ id: stuaRooms.id })
    .from(stuaRooms)
    .where(eq(stuaRooms.slug, newRoomSlug))
    .limit(1);
  if (!room) return { ok: false, message: S.errors.generic };

  await db
    .update(stuaThreads)
    .set({ roomId: room.id })
    .where(and(eq(stuaThreads.id, threadId), eq(stuaThreads.authorId, userId)));

  return { ok: true };
}

/** Slett egen tråd KUN mens den er tom (reply_count = 0). */
export async function deleteOwnThread(
  threadId: string,
): Promise<StuaActionResult> {
  const S = t().stuaForum;
  const userId = await currentUserId();
  if (!userId) return { ok: false, message: S.errors.notLoggedIn };

  const [thread] = await db
    .select({ replyCount: stuaThreads.replyCount, authorId: stuaThreads.authorId })
    .from(stuaThreads)
    .where(eq(stuaThreads.id, threadId))
    .limit(1);
  if (!thread || thread.authorId !== userId) {
    return { ok: false, message: S.errors.generic };
  }
  if (thread.replyCount > 0) {
    return { ok: false, message: S.errors.generic };
  }

  // Tom tråd: hard-delete (CASCADE rydder åpningsinnlegget).
  await db
    .delete(stuaThreads)
    .where(and(eq(stuaThreads.id, threadId), eq(stuaThreads.authorId, userId)));

  return { ok: true };
}
