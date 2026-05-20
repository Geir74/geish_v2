/*
 * Stamp — rødt gummistempel-look. `rotate`-prop som tall (grader); skaleres
 * av --chaos i CSS. `size` styrer font-size i px.
 *
 * Mikro-uskarphet (blur 0.2px) er en bevisst trykk-imitasjon — ikke en
 * drop-shadow blur som forbudslisten (§8) gjelder.
 */
import type { CSSProperties, ReactNode } from "react";
import styles from "./Stamp.module.css";

export interface StampProps {
  rotate?: number;
  size?: number;
  children: ReactNode;
}

export function Stamp({ rotate = -4, size = 14, children }: StampProps) {
  const style = {
    "--rotation": rotate,
    "--font-size": `${size}px`,
  } as CSSProperties;
  return (
    <span className={styles.stamp} style={style}>
      {children}
    </span>
  );
}
