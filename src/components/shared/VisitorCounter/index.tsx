/*
 * VisitorCounter — klassisk retro-besøksteller. Sort boks, oransje LED-siffer
 * i monospace. Bruker mono-font så sifrene står stille når tallet teller opp.
 * Brukes typisk i footer.
 */
import styles from "./VisitorCounter.module.css";

export type VisitorCounterSize = "sm" | "md" | "lg";

export interface VisitorCounterProps {
  count: string;
  label?: string;
  size?: VisitorCounterSize;
}

export function VisitorCounter({
  count,
  label,
  size = "md",
}: VisitorCounterProps) {
  return (
    <div className={styles.root}>
      <div className={styles.display} data-size={size}>
        {count}
      </div>
      {label ? <div className={styles.label}>{label}</div> : null}
    </div>
  );
}
