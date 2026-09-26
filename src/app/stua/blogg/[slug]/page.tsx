/*
 * /stua/blogg/[slug] — resolver for «Diskuter i Stua»-lenken fra en bloggpost
 * (E6 bolk 5, design D6). Lazy + race-sikret trådfødsel.
 *
 * [slug] = bloggpostens slug (= source_slug på Stua-tråden). Flyt:
 *  - utlogget       → redirect(/logg-inn?next=<denne stien>) (guard i /stua/layout
 *                     tar dette, men vi speiler det eksplisitt for tydelighet)
 *  - eksisterende   → redirect(/stua/t/[trådslug])
 *  - ingen tråd     → «start diskusjonen»-skjema, forhåndsutfylt med posttittel
 *
 * Ukjent bloggpost → notFound. force-dynamic: auth + DB-oppslag pr. request.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { t } from "@/content/i18n";
import { getPostBySlug } from "@/content/posts";
import { getThreadBySourceSlug } from "@/lib/stua/queries";
import { BlogThreadForm } from "./BlogThreadForm";
import styles from "../../page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Diskuter i Stua — geish.no",
  robots: { index: false, follow: false },
};

export default async function BloggDiskusjonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: bloggSlug } = await params;
  const C = t();
  const S = C.stuaForum;

  // Bloggposten må finnes — ellers ingen legitim diskusjon å starte.
  const result = await getPostBySlug(bloggSlug);
  if (!result) notFound();

  // Finnes tråden allerede (published)? → rett dit.
  const existing = await getThreadBySourceSlug(bloggSlug);
  if (existing) redirect(`/stua/t/${existing.slug}`);

  // Ingen tråd ennå → forhåndsutfylt «start diskusjonen»-skjema.
  const prefillTitle = result.post.title;

  return (
    <main className={`${styles.page} paper`}>
      <div className={styles.crumb}>
        <Link href="/stua">STUA</Link>
        <span className={styles.sep}>/</span>
        <Link href="/stua/blogg">BLOGG</Link>
        <span className={styles.sep}>/</span>
        <span className={styles.current}>{S.blogThread.crumb.toUpperCase()}</span>
      </div>

      <h1 className={styles.h1}>
        {S.blogThread.heading}
        <span className={styles.acc}>.</span>
      </h1>
      <p className={styles.intro}>{S.blogThread.intro}</p>

      <BlogThreadForm bloggSlug={bloggSlug} prefillTitle={prefillTitle} />
    </main>
  );
}
