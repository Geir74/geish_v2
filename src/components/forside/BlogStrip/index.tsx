/*
 * BlogStrip — full-bredde sort boks med 3 hvite "klippede" artikler.
 * Leser ekte poster fra MDX-pipelinen (src/content/posts/*.mdx) via
 * getAllPosts(). Hvis ingen poster (eller alle drafts i prod), faller
 * den tilbake til UnderConstructionBanner per 02-PAGES tom-tilstand.
 */
import Link from "next/link";
import { UnderConstructionBanner } from "@/components/shared";
import { getAllPosts } from "@/content/posts";
import styles from "./BlogStrip.module.css";

export interface BlogStripProps {}

function formatNorwegianDate(iso: string): string {
  const months = ["jan", "feb", "mars", "apr", "mai", "juni", "juli", "aug", "sep", "okt", "nov", "des"];
  const [year, month, day] = iso.split("-");
  return `${Number(day)}. ${months[Number(month) - 1]} ${year}`;
}

export async function BlogStrip(_props: BlogStripProps = {}) {
  const allPosts = await getAllPosts();
  const posts = allPosts.slice(0, 3);
  return (
    <div className={styles.box}>
      <div className={styles.head}>
        <h3 className={styles.h3}>Fra bloggen</h3>
        <span className={styles.sub}>
          {allPosts.length} {allPosts.length === 1 ? "post" : "poster"}
        </span>
      </div>

      {posts.length === 0 ? (
        <div className={styles.fallback}>
          <UnderConstructionBanner />
        </div>
      ) : (
        <>
          <div className={styles.grid3}>
            {posts.map((p) => (
              <Link key={p.slug} href={`/blogg/${p.slug}`} className={styles.clip}>
                <div className={styles.d}>{formatNorwegianDate(p.published)}</div>
                <div className={styles.ti}>{p.title}</div>
                <div className={styles.meta}>
                  #{p.tag} · {p.readTimeMin} min
                </div>
              </Link>
            ))}
          </div>
          <div className={styles.more}>
            <Link href="/blogg">→ ALLE POSTER</Link>
          </div>
        </>
      )}
    </div>
  );
}
