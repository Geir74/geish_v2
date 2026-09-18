/*
 * /gjestebok — offentlig gjestebok (E5, task 2.3). Lister PUBLISERTE innlegg
 * (nyest først) + innsendingsskjema. Ingen e-post vises eller lagres (D2).
 *
 * Dynamisk: skjemaets server action + getUser gjør ruten avhengig av request.
 */
import type { Metadata } from "next";
import { t } from "@/content/i18n";
import { getPublishedEntries } from "@/lib/guestbook/get-published-entries";
import { GuestbookForm } from "./GuestbookForm";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gjestebok — geish.no",
  description: "Legg igjen en hilsen. Ingen pålogging kreves.",
};

function formatNorwegianDate(date: Date): string {
  const months = [
    "jan", "feb", "mars", "apr", "mai", "juni",
    "juli", "aug", "sep", "okt", "nov", "des",
  ];
  return `${date.getDate()}. ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export default async function GjestebokPage() {
  const C = t();
  const G = C.gjestebok;
  const entries = await getPublishedEntries();

  return (
    <main className={`${styles.page} paper`}>
      <div className={styles.crumb}>
        <span>{C.brand.name.toUpperCase()}</span>
        <span className={styles.sep}>/</span>
        <span className={styles.current}>GJESTEBOK</span>
      </div>

      <h1 className={styles.h1}>
        {G.title}
        <span className={styles.acc}>.</span>
      </h1>
      <p className={styles.intro}>{G.intro}</p>

      <section className={styles.formWrap}>
        <GuestbookForm />
      </section>

      <section className={styles.entries}>
        {entries.length === 0 ? (
          <p className={styles.empty}>{G.empty}</p>
        ) : (
          <ul className={styles.list}>
            {entries.map((entry) => (
              <li key={entry.id} className={styles.entry}>
                <p className={styles.entryBody}>{entry.body}</p>
                <p className={styles.entryMeta}>
                  <span className={styles.entryName}>{entry.authorName}</span>
                  <span className={styles.entryDot}>·</span>
                  <time dateTime={entry.createdAt.toISOString()}>
                    {formatNorwegianDate(entry.createdAt)}
                  </time>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
