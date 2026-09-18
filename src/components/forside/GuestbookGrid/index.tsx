/*
 * GuestbookGrid — 3 sticky-notes med vekslende rotasjon og varierende paper-
 * bakgrunn. Egen forside-variant fordi mockup-en vil ha layered notes med
 * spesifikke rotasjoner per indeks, ikke en grid av like cards.
 * Viser en pen tomtilstand når gjesteboka er tom.
 *
 * E5: leser ekte PUBLISERTE innlegg fra databasen (getPublishedEntries),
 * ikke lenger det tomme locale-arrayet. Server-component (async).
 */
import Link from "next/link";
import { t } from "@/content/i18n";
import { getPublishedEntries } from "@/lib/guestbook/get-published-entries";
import styles from "./GuestbookGrid.module.css";

function formatNorwegianDate(date: Date): string {
  const months = [
    "jan", "feb", "mars", "apr", "mai", "juni",
    "juli", "aug", "sep", "okt", "nov", "des",
  ];
  return `${date.getDate()}. ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export async function GuestbookGrid(): Promise<React.ReactElement> {
  const C = t();
  const entries = (await getPublishedEntries()).slice(0, 3);

  if (entries.length === 0) {
    return (
      <div className={styles.box}>
        <h3 className={styles.h3}>Gjestebok</h3>
        <div className={styles.note} data-idx={0}>
          {C.guestbook_empty}
        </div>
        <div className={styles.more}>
          <Link href="/gjestebok">→ Skriv noe pent</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.box}>
      <h3 className={styles.h3}>Gjestebok</h3>
      {entries.map((g, i) => (
        <div key={g.id} className={styles.note} data-idx={i}>
          &ldquo;{g.body}&rdquo;
          <div className={styles.who}>
            — {g.authorName}, {formatNorwegianDate(g.createdAt)}
          </div>
        </div>
      ))}
      <div className={styles.more}>
        <Link href="/gjestebok">→ Skriv noe pent</Link>
      </div>
    </div>
  );
}
