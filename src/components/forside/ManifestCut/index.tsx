/*
 * ManifestCut — klippet-ut boks med to photo-tape-strimler på toppen.
 * Tre sitater fra manifestet i Newsreader italic. Lenke til hele manifestet.
 * Returnerer null hvis content ikke har pullquotes.
 */
import Link from "next/link";
import { t } from "@/content/i18n";
import styles from "./ManifestCut.module.css";

export function ManifestCut(): React.ReactElement | null {
  const C = t();
  const quotes = C.manifest_pullquotes.slice(0, 3);
  if (quotes.length === 0) return null;
  return (
    <div className={styles.cut}>
      <span className={`${styles.tape} ${styles.tapeLeft}`} aria-hidden />
      <span className={`${styles.tape} ${styles.tapeRight}`} aria-hidden />
      <div className={styles.kicker}>Manifest · Akt 1</div>
      <h2 className={styles.h2}>Stay Grounded, and Create Shit.</h2>
      <div className={styles.ex}>
        {quotes.map((q, i) => (
          <p key={i}>&ldquo;{q}&rdquo;</p>
        ))}
      </div>
      <div className={styles.more}>
        → <Link href="/manifest">Hele manifestet, syv akter</Link>
      </div>
    </div>
  );
}
