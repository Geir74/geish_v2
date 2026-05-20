/*
 * GuestbookSnippet — viser N siste gjestebok-innlegg som enten en kompakt
 * liste eller roterte sticky-notes. Komponenten er ren presentasjon — backend
 * for ekte gjestebok kommer i senere mandat. Default-itemene er dummy-tekst.
 */
import type { CSSProperties, ReactElement } from "react";
import styles from "./GuestbookSnippet.module.css";

export interface GuestbookItem {
  who: string;
  when: string;
  msg: string;
}

export interface GuestbookSnippetProps {
  items?: GuestbookItem[];
  style?: "list" | "cards";
  count?: number;
}

const DEFAULT_ITEMS: GuestbookItem[] = [
  {
    who: "anon-stranger",
    when: "2026-05-19",
    msg: "fant siden via webring, fortsett sånn.",
  },
  {
    who: "siri.h",
    when: "2026-05-17",
    msg: "elsker zine-energien. lenge siden sist.",
  },
  {
    who: "no-name-yet",
    when: "2026-05-14",
    msg: "hva er stua?",
  },
];

export function GuestbookSnippet({
  items = DEFAULT_ITEMS,
  style = "list",
  count = 3,
}: GuestbookSnippetProps) {
  const list = items.slice(0, count);

  if (style === "cards") {
    return (
      <div className={styles.cards}>
        {list.map((g, i): ReactElement => {
          // Card-tilt veksler litt; --chaos i CSS multipliserer for global skala.
          const tilt = i % 2 ? "-0.6deg" : "0.5deg";
          const cardStyle = { "--card-tilt": tilt } as CSSProperties;
          return (
            <div key={i} className={styles.card} style={cardStyle}>
              <div className={styles.cardMsg}>&ldquo;{g.msg}&rdquo;</div>
              <div className={styles.cardMeta}>
                — {g.who}, {g.when}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {list.map((g, i) => (
        <li
          key={i}
          className={i === 0 ? styles.listItemFirst : styles.listItem}
        >
          <div className={styles.listHead}>
            <strong className={styles.who}>{g.who}</strong>
            <span className={styles.when}>{g.when}</span>
          </div>
          <div className={styles.listMsg}>&ldquo;{g.msg}&rdquo;</div>
        </li>
      ))}
    </ul>
  );
}
