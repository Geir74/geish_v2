/*
 * Pullquote — stort sitat inne i blog-brødtekst.
 * Mønstret etter manifest-pullquote i 02-PAGES.md: Archivo Black, stempel-rød
 * double-border, sentrert. Lokal til blogg — ikke gjenbrukt utenfor MDX-posts ennå.
 */
import type { ReactNode } from "react";
import styles from "./Pullquote.module.css";

export interface PullquoteProps {
  children: ReactNode;
}

export function Pullquote({ children }: PullquoteProps) {
  return <blockquote className={styles.pullquote}>{children}</blockquote>;
}
