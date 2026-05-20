/*
 * BlogStrip — full-bredde sort boks med 3 hvite "klippede" artikler.
 * Hvis blog_posts er tom, faller den tilbake til UnderConstructionBanner
 * (per 02-PAGES tom-tilstand-regel).
 */
import type { ReactElement } from "react";
import Link from "next/link";
import { UnderConstructionBanner } from "@/components/shared";
import { t } from "@/content/i18n";
import styles from "./BlogStrip.module.css";

export interface BlogStripProps {}

export function BlogStrip(_props: BlogStripProps = {}): ReactElement {
  const C = t();
  const posts = C.blog_posts.slice(0, 3);
  return (
    <div className={styles.box}>
      <div className={styles.head}>
        <h3 className={styles.h3}>Fra bloggen</h3>
        <span className={styles.sub}>
          {C.blog_posts.length} poster · 6 utkast
        </span>
      </div>

      {posts.length === 0 ? (
        <div className={styles.fallback}>
          <UnderConstructionBanner />
        </div>
      ) : (
        <>
          <div className={styles.grid3}>
            {posts.map((p, i) => (
              <Link key={i} href="/blogg" className={styles.clip}>
                <div className={styles.d}>{p.date}</div>
                <div className={styles.ti}>{p.title}</div>
                <div className={styles.meta}>
                  #{p.tag} · {p.read}
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
