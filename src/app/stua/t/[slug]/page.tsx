/*
 * /stua/t/[slug] — tråddetalj (E6, task 3.6). Global, room-agnostisk rute
 * (trådflytting brekker aldri lenken). Bak innloggings-guard.
 *
 * Skjult tråd (status='hidden'): notFound for vanlig bruker; admin ser den med
 * «skjult»-badge (Hugin bolk1/artefakt-review). Skjulte enkeltinnlegg vises som
 * «[skjult]» for vanlig, fullt for admin.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { t } from "@/content/i18n";
import { isAdmin } from "@/lib/admin/is-admin";
import { getThreadBySlug } from "@/lib/stua/queries";
import { ReplyForm } from "./ReplyForm";
import styles from "../../page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stua — geish.no",
  robots: { index: false, follow: false },
};

function formatDateTime(date: Date): string {
  return date.toLocaleString("nb-NO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function StuaThreadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const C = t();
  const S = C.stuaForum;

  const admin = await isAdmin();
  const thread = await getThreadBySlug(slug, admin);
  if (!thread) notFound();

  return (
    <main className={`${styles.page} paper`}>
      <div className={styles.crumb}>
        <Link href="/stua">STUA</Link>
        <span className={styles.sep}>/</span>
        <Link href={`/stua/${thread.roomSlug}`}>
          {thread.roomSlug.toUpperCase()}
        </Link>
        <span className={styles.sep}>/</span>
        <span className={styles.current}>TRÅD</span>
      </div>

      <h1 className={styles.h1}>
        {thread.title}
        {thread.status === "hidden" ? (
          <span className={styles.hiddenBadge}> {S.hiddenBadge}</span>
        ) : null}
      </h1>

      <section className={styles.posts}>
        <ul className={styles.postList}>
          {thread.posts.map((post) => (
            <li
              key={post.id}
              className={`${styles.post} ${post.status === "hidden" ? styles.postHidden : ""}`}
            >
              <p className={styles.postBody}>
                {post.status === "hidden" && !admin ? S.hiddenPost : post.body}
              </p>
              <p className={styles.postMeta}>
                <span className={styles.postAuthor}>{post.authorName}</span>
                <span className={styles.postDot}>·</span>
                <time dateTime={post.createdAt.toISOString()}>
                  {formatDateTime(post.createdAt)}
                </time>
                {post.status === "hidden" && admin ? (
                  <span className={styles.hiddenBadge}> {S.hiddenBadge}</span>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <ReplyForm threadId={thread.id} />
    </main>
  );
}
