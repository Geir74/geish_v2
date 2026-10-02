/*
 * /admin/stua — moderering av Stua (E6 bolk 6, task 6.1).
 *
 * Guard arves fra /admin/layout.tsx (isAdmin, fail closed, 404 for ikke-admin).
 * Leser ALT via Drizzle (server-connection omgår RLS) — også skjulte tråder/svar,
 * som er poenget: admin må se det vanlige brukere ikke ser for å kunne moderere.
 *
 * Struktur: rom → tråder (skjulte fremhevet), hver tråd med sine innlegg. Ingen
 * N+1 på forfatter (left join profiles), men listen henter alle poster flatt og
 * grupperer i minne — admin-panel, lav trafikk, enkelhet > mikrooptimalisering.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, stuaPosts, stuaRooms, stuaThreads } from "@/db/schema";
import { t } from "@/content/i18n";
import { displayNameFor } from "@/lib/profile/display-name";
import { AdminThreadRow } from "./AdminThreadRow";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stua — Admin — geish.no",
  description: "Moderering.",
  robots: { index: false, follow: false },
};

function authorName(
  authorId: string | null,
  displayName: string | null,
): string {
  if (!authorId) return "stormtrooper";
  return displayNameFor({ id: authorId, displayName });
}

export default async function AdminStuaPage() {
  const A = t().admin;
  const M = A.stua;

  const rooms = await db
    .select({ id: stuaRooms.id, slug: stuaRooms.slug, name: stuaRooms.name })
    .from(stuaRooms)
    .orderBy(asc(stuaRooms.sortOrder));

  const threads = await db
    .select({
      id: stuaThreads.id,
      roomId: stuaThreads.roomId,
      slug: stuaThreads.slug,
      title: stuaThreads.title,
      status: stuaThreads.status,
      replyCount: stuaThreads.replyCount,
      authorId: stuaThreads.authorId,
      displayName: profiles.displayName,
    })
    .from(stuaThreads)
    .leftJoin(profiles, eq(profiles.id, stuaThreads.authorId))
    .orderBy(asc(stuaThreads.lastActivityAt));

  const posts = await db
    .select({
      id: stuaPosts.id,
      threadId: stuaPosts.threadId,
      body: stuaPosts.body,
      status: stuaPosts.status,
      createdAt: stuaPosts.createdAt,
      authorId: stuaPosts.authorId,
      displayName: profiles.displayName,
    })
    .from(stuaPosts)
    .leftJoin(profiles, eq(profiles.id, stuaPosts.authorId))
    .orderBy(asc(stuaPosts.createdAt));

  const roomOptions = rooms.map((r) => ({ slug: r.slug, name: r.name }));

  return (
    <main className={styles.page}>
      <nav className={styles.crumb} aria-label="Sti">
        <Link href="/">geish.no</Link>
        <span className={styles.sep}>/</span>
        <Link href="/admin">{A.crumb}</Link>
        <span className={styles.sep}>/</span>
        <span className={styles.current}>{M.crumb}</span>
      </nav>

      <h1 className={styles.h1}>{M.heading}</h1>
      <p className={styles.lede}>{M.lede}</p>

      {rooms.map((room) => {
        const roomThreads = threads.filter((th) => th.roomId === room.id);
        return (
          <section key={room.id} className={styles.room}>
            <h2 className={styles.roomName}>
              {room.name}
              <span className={styles.roomCount}>{roomThreads.length}</span>
            </h2>
            {roomThreads.length === 0 ? (
              <p className={styles.empty}>{M.emptyRoom}</p>
            ) : (
              <ul className={styles.threads}>
                {roomThreads.map((th) => (
                  <AdminThreadRow
                    key={th.id}
                    thread={{
                      id: th.id,
                      slug: th.slug,
                      title: th.title,
                      status: th.status as "published" | "hidden",
                      replyCount: th.replyCount,
                      authorName: authorName(th.authorId, th.displayName),
                    }}
                    posts={posts
                      .filter((p) => p.threadId === th.id)
                      .map((p) => ({
                        id: p.id,
                        body: p.body,
                        status: p.status as "published" | "hidden",
                        authorName: authorName(p.authorId, p.displayName),
                      }))}
                    roomOptions={roomOptions}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </main>
  );
}
