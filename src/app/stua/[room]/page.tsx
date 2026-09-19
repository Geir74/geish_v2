/*
 * /stua/[room] — trådliste i ett rom (E6, task 3.5). Bak innloggings-guard.
 * Nyeste aktivitet øverst (composite-indeks stua_threads(room_id, last_activity_at)).
 * Ukjent rom → notFound.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { t } from "@/content/i18n";
import { getRoomBySlug, getThreadsByRoom } from "@/lib/stua/queries";
import styles from "../page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stua — geish.no",
  robots: { index: false, follow: false },
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
  });
}

export default async function StuaRoomPage({
  params,
}: {
  params: Promise<{ room: string }>;
}) {
  const { room: roomSlug } = await params;
  const C = t();
  const S = C.stuaForum;

  const room = await getRoomBySlug(roomSlug);
  if (!room) notFound();

  const threads = await getThreadsByRoom(room.id);

  return (
    <main className={`${styles.page} paper`}>
      <div className={styles.crumb}>
        <Link href="/stua">STUA</Link>
        <span className={styles.sep}>/</span>
        <span className={styles.current}>{room.name.toUpperCase()}</span>
      </div>

      <h1 className={styles.h1}>
        {room.name}
        <span className={styles.acc}>.</span>
      </h1>
      {room.description ? (
        <p className={styles.intro}>{room.description}</p>
      ) : null}

      <div className={styles.roomActions}>
        <Link href={`/stua/${room.slug}/ny`} className={styles.newThreadBtn}>
          {S.newThread}
        </Link>
      </div>

      <section className={styles.threads}>
        {threads.length === 0 ? (
          <p className={styles.empty}>{S.emptyRoom}</p>
        ) : (
          <ul className={styles.threadList}>
            {threads.map((th) => (
              <li key={th.id} className={styles.threadRow}>
                <Link href={`/stua/t/${th.slug}`} className={styles.threadLink}>
                  <span className={styles.threadTitle}>{th.title}</span>
                  <span className={styles.threadMeta}>
                    {th.authorName} · {th.replyCount} {S.replies} ·{" "}
                    {formatDate(th.lastActivityAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
