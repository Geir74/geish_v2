/*
 * HalftoneBlock — SVG-prikkmønster med varierende prikkstørrelse, brukt som
 * dekor/tekstur. "Halftone er dekorasjon, ikke innhold" (§1.8).
 */
import type { ReactElement } from "react";
import styles from "./HalftoneBlock.module.css";

export interface HalftoneBlockProps {
  w?: number;
  h?: number;
  density?: number;
}

export function HalftoneBlock({
  w = 120,
  h = 120,
  density = 0.5,
}: HalftoneBlockProps) {
  const dots: ReactElement[] = [];
  for (let y = 0; y < 14; y++) {
    for (let x = 0; x < 14; x++) {
      const r = (Math.sin(x * 0.7 + y * 0.9) + 1) * 1.4 * density + 0.4;
      dots.push(
        <circle key={`${x}-${y}`} cx={x * 9 + 4} cy={y * 9 + 4} r={r} />,
      );
    }
  }
  return (
    <svg width={w} height={h} viewBox="0 0 128 128" className={styles.svg}>
      {dots}
    </svg>
  );
}
