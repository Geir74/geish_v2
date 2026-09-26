/*
 * Stua lese-queries (E6, task 3.2). Server-side via Drizzle. Alle kall skjer bak
 * innloggings-guarden (/stua/layout.tsx), så disse antar autentisert kontekst.
 *
 * Forfatter-visning: gjenbruker displayNameFor (E4). author_id NULL →
 * stormtrooper-fallback. Visningsnavn er IKKE-klikkbart i 1.0 (offentlig
 * profilrute finnes ikke ennå → klikkbart = Stua 1.1).
 *
 * Sortering: nyeste aktivitet (last_activity_at desc), dekket av composite-indeks
 * stua_threads(room_id, last_activity_at desc). Ingen N+1 — forfatter hentes via
 * left join mot profiles.
 */
import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { profiles, stuaPosts, stuaRooms, stuaThreads } from "@/db/schema";
import { displayNameFor } from "@/lib/profile/display-name";

export type RoomListItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

export type ThreadListItem = {
  id: string;
  slug: string;
  title: string;
  authorName: string;
  replyCount: number;
  lastActivityAt: Date;
};

export type ThreadPost = {
  id: string;
  body: string;
  authorName: string;
  createdAt: Date;
  status: "published" | "hidden";
};

export type ThreadDetail = {
  id: string;
  slug: string;
  title: string;
  roomSlug: string;
  status: "published" | "hidden";
  posts: ThreadPost[];
};

/** Forfatter-navn fra (evt. NULL) profil-join. author_id NULL → stormtrooper. */
function authorName(
  authorId: string | null,
  displayName: string | null,
): string {
  if (!authorId) return "stormtrooper";
  return displayNameFor({ id: authorId, displayName });
}

/**
 * Offentlig-trygge Stua-tall for forside-preview (E6 bolk 7). KUN aggregerte
 * antall — ingen titler, ingen navn, ingen brukerdata. Trygt å vise til
 * utloggede. Teller kun PUBLISHED tråder.
 */
export async function getStuaPublicStats(): Promise<{
  roomCount: number;
  threadCount: number;
}> {
  // Forsiden prerendres (static ISR). Uten DB-tilgang under build (CI, preview
  // uten env) SKAL dette degradere pent, ikke felle hele bygget — samme mønster
  // som getPublishedEntries. Null-tall skjuler seksjonen, lekker ingenting.
  try {
    const [rooms] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(stuaRooms);
    const [threads] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(stuaThreads)
      .where(eq(stuaThreads.status, "published"));
    return {
      roomCount: rooms?.n ?? 0,
      threadCount: threads?.n ?? 0,
    };
  } catch (error) {
    console.error(
      "getStuaPublicStats: DB-lesing feilet, faller tilbake til null-tall:",
      error,
    );
    return { roomCount: 0, threadCount: 0 };
  }
}

/**
 * Nyeste published tråder (titler + meta) for forside-preview — KALLES KUN for
 * innloggede lesere (bolk 7). Aldri render til utloggede: titler er innhold bak
 * døra. Nyeste aktivitet øverst.
 */
export async function getStuaRecentThreads(
  limit = 4,
): Promise<{ slug: string; title: string; replyCount: number }[]> {
  const rows = await db
    .select({
      slug: stuaThreads.slug,
      title: stuaThreads.title,
      replyCount: stuaThreads.replyCount,
    })
    .from(stuaThreads)
    .where(eq(stuaThreads.status, "published"))
    .orderBy(desc(stuaThreads.lastActivityAt))
    .limit(limit);
  return rows;
}

/** Alle rom, admin-definert rekkefølge. */
export async function getRooms(): Promise<RoomListItem[]> {
  return db
    .select({
      id: stuaRooms.id,
      slug: stuaRooms.slug,
      name: stuaRooms.name,
      description: stuaRooms.description,
    })
    .from(stuaRooms)
    .orderBy(asc(stuaRooms.sortOrder));
}

/** Ett rom via slug (for /stua/[room]). */
export async function getRoomBySlug(
  slug: string,
): Promise<RoomListItem | null> {
  const [room] = await db
    .select({
      id: stuaRooms.id,
      slug: stuaRooms.slug,
      name: stuaRooms.name,
      description: stuaRooms.description,
    })
    .from(stuaRooms)
    .where(eq(stuaRooms.slug, slug))
    .limit(1);
  return room ?? null;
}

/** Published tråder i et rom, nyeste aktivitet øverst. Forfatter via left join. */
export async function getThreadsByRoom(
  roomId: string,
): Promise<ThreadListItem[]> {
  const rows = await db
    .select({
      id: stuaThreads.id,
      slug: stuaThreads.slug,
      title: stuaThreads.title,
      replyCount: stuaThreads.replyCount,
      lastActivityAt: stuaThreads.lastActivityAt,
      authorId: stuaThreads.authorId,
      displayName: profiles.displayName,
    })
    .from(stuaThreads)
    .leftJoin(profiles, eq(profiles.id, stuaThreads.authorId))
    .where(
      and(eq(stuaThreads.roomId, roomId), eq(stuaThreads.status, "published")),
    )
    .orderBy(desc(stuaThreads.lastActivityAt));

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    replyCount: r.replyCount,
    lastActivityAt: r.lastActivityAt,
    authorName: authorName(r.authorId, r.displayName),
  }));
}

/**
 * Én tråd via global slug (room-agnostisk) + dens innlegg kronologisk.
 * `includeHidden` = admin-gren (ser skjult tråd/innlegg med badge). Vanlig bruker:
 * skjult tråd → null (ruten gir notFound); skjulte enkeltinnlegg filtreres.
 */
export async function getThreadBySlug(
  slug: string,
  includeHidden = false,
): Promise<ThreadDetail | null> {
  const [thread] = await db
    .select({
      id: stuaThreads.id,
      slug: stuaThreads.slug,
      title: stuaThreads.title,
      status: stuaThreads.status,
      roomSlug: stuaRooms.slug,
    })
    .from(stuaThreads)
    .innerJoin(stuaRooms, eq(stuaRooms.id, stuaThreads.roomId))
    .where(eq(stuaThreads.slug, slug))
    .limit(1);

  if (!thread) return null;
  if (thread.status === "hidden" && !includeHidden) return null;

  const postRows = await db
    .select({
      id: stuaPosts.id,
      body: stuaPosts.body,
      status: stuaPosts.status,
      createdAt: stuaPosts.createdAt,
      authorId: stuaPosts.authorId,
      displayName: profiles.displayName,
    })
    .from(stuaPosts)
    .leftJoin(profiles, eq(profiles.id, stuaPosts.authorId))
    .where(eq(stuaPosts.threadId, thread.id))
    .orderBy(asc(stuaPosts.createdAt));

  const posts: ThreadPost[] = postRows
    .filter((p) => includeHidden || p.status === "published")
    .map((p) => ({
      id: p.id,
      body: p.body,
      status: p.status as "published" | "hidden",
      createdAt: p.createdAt,
      authorName: authorName(p.authorId, p.displayName),
    }));

  return {
    id: thread.id,
    slug: thread.slug,
    title: thread.title,
    roomSlug: thread.roomSlug,
    status: thread.status as "published" | "hidden",
    posts,
  };
}

/**
 * Lazy blogg-tråd-oppslag via source_slug (for «Diskuter i Stua»-flyten).
 * Kun PUBLISHED tråder returneres (Hugin bolk 2-3): en skjult/moderert blogg-
 * tråd skal ikke lenkes til fra bloggen — da faller flyten tilbake til «start
 * diskusjonen»-skjemaet i stedet for å peke mot en notFound.
 */
export async function getThreadBySourceSlug(
  sourceSlug: string,
): Promise<{ slug: string } | null> {
  const [thread] = await db
    .select({ slug: stuaThreads.slug })
    .from(stuaThreads)
    .where(
      and(
        eq(stuaThreads.sourceSlug, sourceSlug),
        eq(stuaThreads.status, "published"),
      ),
    )
    .limit(1);
  return thread ?? null;
}
