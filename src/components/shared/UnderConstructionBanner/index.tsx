/*
 * UnderConstructionBanner — det klassiske blinkende UC-banneret.
 * "Under Construction er en livsstil, ikke en feilmelding" (§1.9).
 * Tonen er stolt, ikke unnskyldende. `.blink`-klassen er global fra tokens.css.
 */
import styles from "./UnderConstructionBanner.module.css";

export interface UnderConstructionBannerProps {
  compact?: boolean;
  text?: string;
}

const DEFAULT_TEXT = "UNDER KONSTRUKSJON — KOMMER SNART";

export function UnderConstructionBanner({
  compact = false,
  text = DEFAULT_TEXT,
}: UnderConstructionBannerProps) {
  const Glyph = compact ? "▲" : "⚠";
  const className = compact ? styles.compact : styles.full;
  return (
    <div className={className} data-compact={compact ? "true" : "false"}>
      <span className={`blink ${styles.glyph}`}>{Glyph}</span>
      <span>{text}</span>
      <span className={`blink ${styles.glyph}`}>{Glyph}</span>
    </div>
  );
}
