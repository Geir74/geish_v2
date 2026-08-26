/*
 * /endringslogg — synlig historikk over brukersynlige endringer på siden.
 * Data fra src/content/changelog.ts (vedlikeholdes manuelt, med
 * `npm run changelog:sync` som utkast-generator). Rendres nyeste først,
 * gruppert per dato, med diskret lenke til PR-en der den finnes.
 *
 * Statisk rute — dataene er compile-time-konstanter.
 */
import type { Metadata } from "next";
import {
  changelog,
  formatDateLong,
  type ChangelogEntry,
} from "@/content/changelog";
import { t } from "@/content/i18n";
import styles from "./page.module.css";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Endringslogg — geish.no",
  description: "Hva som er nytt på geish.no — nyeste øverst.",
};

/** Grupper (allerede sorterte) oppføringer per dato, i innsettingsrekkefølge. */
function groupByDate(
  entries: ReadonlyArray<ChangelogEntry>,
): Array<{ date: string; items: ChangelogEntry[] }> {
  const groups: Array<{ date: string; items: ChangelogEntry[] }> = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (last && last.date === entry.date) {
      last.items.push(entry);
    } else {
      groups.push({ date: entry.date, items: [entry] });
    }
  }
  return groups;
}

export default function EndringsloggPage() {
  const C = t();
  const E = C.endringslogg;
  const groups = groupByDate(changelog);

  return (
    <main className={`${styles.page} paper`}>
      <div className={styles.crumb}>
        <span>{C.brand.name.toUpperCase()}</span>
        <span className={styles.sep}>/</span>
        <span className={styles.current}>{E.crumb}</span>
      </div>

      <div className={styles.wrap}>
        <h1 className={styles.h1}>
          {E.heading.replace(/\.$/, "")}
          <span className={styles.acc}>.</span>
        </h1>
        <p className={styles.deck}>{E.deck}</p>

        {groups.length === 0 ? (
          <p className={styles.empty}>{C.changelog_empty}</p>
        ) : (
          groups.map((group) => (
            <section key={group.date} className={styles.group}>
              <h2 className={styles.date}>{formatDateLong(group.date)}</h2>
              {group.items.map((entry, i) => (
                <article key={i} className={styles.entry}>
                  <h3 className={styles.title}>{entry.title}</h3>
                  <p className={styles.desc}>{entry.description}</p>
                  {entry.prNummer ? (
                    <a
                      className={styles.pr}
                      href={`https://github.com/Geir74/geish_v2/pull/${entry.prNummer}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {E.prLabel}
                      {entry.prNummer}
                    </a>
                  ) : null}
                </article>
              ))}
            </section>
          ))
        )}
      </div>
    </main>
  );
}
