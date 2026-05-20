/*
 * GuestbookGrid — 3 sticky-notes med vekslende rotasjon og varierende paper-
 * bakgrunn. Egen forside-variant fordi mockup-en vil ha layered notes med
 * spesifikke rotasjoner per indeks, ikke en grid av like cards.
 * Returnerer null hvis gjesteboka er tom.
 */
import Link from "next/link";
import { t } from "@/content/i18n";
import styles from "./GuestbookGrid.module.css";

export interface GuestbookGridProps {}

export function GuestbookGrid(_props: GuestbookGridProps = {}): React.ReactElement | null {
  const C = t();
  const items = C.guestbook.slice(0, 3);
  if (items.length === 0) return null;
  return (
    <div className={styles.box}>
      <h3 className={styles.h3}>Gjestebok</h3>
      {items.map((g, i) => (
        <div key={i} className={styles.note} data-idx={i}>
          &ldquo;{g.msg}&rdquo;
          <div className={styles.who}>
            — {g.who}, {g.when}
          </div>
        </div>
      ))}
      <div className={styles.more}>
        <Link href="/gjestebok">→ Skriv noe pent</Link>
      </div>
    </div>
  );
}
