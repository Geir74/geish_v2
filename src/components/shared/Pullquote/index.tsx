/*
 * Pullquote — "ropende" sitat for langtekstsider. To varianter:
 *   - "quiet" (default): sentrert, svart, symmetrisk double-border. Brukes i blog.
 *   - "loud": stempel-rød, venstrejustert, hard venstre-blokk-kant, større tekst.
 *     Brukes i manifest der sitatene skal slå.
 *
 * Begge varianter bruker Archivo Black (--font-display).
 */
import type { ReactNode } from "react";
import styles from "./Pullquote.module.css";

export type PullquoteVariant = "quiet" | "loud";

export interface PullquoteProps {
  children: ReactNode;
  variant?: PullquoteVariant;
}

export function Pullquote({ children, variant = "quiet" }: PullquoteProps) {
  const className = variant === "loud" ? styles.loud : styles.pullquote;
  return <blockquote className={className}>{children}</blockquote>;
}
