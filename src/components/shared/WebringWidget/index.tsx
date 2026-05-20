/*
 * WebringWidget — webring-navigasjon i tre varianter.
 *   - bar:   sober horisontal stripe, default
 *   - card:  utklippet kort med tape (zine-stil)
 *   - stamp: rektangulær stempel-aktig
 *
 * Merknad: Mockup-en bruker 🔗-emoji som ikon, men forbudslisten (§8)
 * forbyr emoji-ikoner. Vi bruker tegn-glyfen "◉" som ring-symbol i stedet.
 * Symbolet kan overstyres via `ringSymbol`-prop hvis Geir vil bytte.
 */
import styles from "./WebringWidget.module.css";

export type WebringVariant = "bar" | "card" | "stamp";

export interface WebringWidgetProps {
  variant?: WebringVariant;
  prevLabel?: string;
  nextLabel?: string;
  title?: string;
  subtitle?: string;
  members?: string;
  joinLabel?: string;
  ringSymbol?: string;
}

export function WebringWidget({
  variant = "bar",
  prevLabel = "← FORRIGE",
  nextLabel = "NESTE →",
  title = "NORDIC RING",
  subtitle = "smågjenger som lager noe rart sammen",
  members = "12 medlemmer",
  joinLabel = "bli med",
  ringSymbol = "◉",
}: WebringWidgetProps) {
  if (variant === "card") {
    return (
      <div className={styles.card} data-variant="card">
        <div className={styles.cardTitle}>{title}</div>
        <div className={styles.cardSub}>{subtitle}</div>
        <div className={styles.cardLinks}>
          <a href="#prev">{prevLabel}</a>
          <span className={styles.dot}>·</span>
          <a href="#ring">{ringSymbol} ring</a>
          <span className={styles.dot}>·</span>
          <a href="#next">{nextLabel}</a>
        </div>
        <div className={styles.cardMeta}>
          {members.toUpperCase()} · <a href="#join">{joinLabel.toUpperCase()}</a>
        </div>
      </div>
    );
  }

  if (variant === "stamp") {
    return (
      <div className={styles.stamp} data-variant="stamp">
        <a href="#prev">{prevLabel}</a>
        <span>·</span>
        <span className={styles.stampTitle}>{title}</span>
        <span>·</span>
        <a href="#next">{nextLabel}</a>
      </div>
    );
  }

  return (
    <div className={styles.bar} data-variant="bar">
      <a href="#prev">{prevLabel}</a>
      <span className={styles.dot}>·</span>
      <span className={styles.barTitle}>
        {ringSymbol} {title}
      </span>
      <span className={styles.dot}>·</span>
      <a href="#next">{nextLabel}</a>
      <span className={styles.barMembers}>{members}</span>
    </div>
  );
}
