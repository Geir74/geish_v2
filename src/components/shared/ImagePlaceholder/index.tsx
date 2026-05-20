/*
 * ImagePlaceholder — stripet placeholder med klammeparentes-label, f.eks.
 * [HUND.JPG]. Bruk denne overalt der ekte bilder ikke er klare — det er
 * et eksplisitt designvalg, ikke en mangel.
 */
import type { CSSProperties } from "react";
import styles from "./ImagePlaceholder.module.css";

export interface ImagePlaceholderProps {
  label?: string;
  w?: string | number;
  h?: number;
  tape?: boolean;
  rotate?: number;
}

export function ImagePlaceholder({
  label = "BILDE",
  w = "100%",
  h = 160,
  tape = false,
  rotate = 0,
}: ImagePlaceholderProps) {
  const wrapStyle = { "--rotation": rotate } as CSSProperties;
  const boxStyle: CSSProperties = {
    width: typeof w === "number" ? `${w}px` : w,
    height: `${h}px`,
  };
  return (
    <div className={styles.wrap} style={wrapStyle}>
      {tape ? <span className={styles.tape} aria-hidden /> : null}
      <div className={styles.box} style={boxStyle}>
        [{label}]
      </div>
    </div>
  );
}
