/*
 * PullquoteBand — full-bredde gul stripe med stort sitat i Bungee/Display.
 * HalftoneBlock-dekor i begge hjørner stikker bevisst ut (overflow: hidden
 * klipper). Halftone har dempet ink-farge slik at gul bakgrunn ikke drukner.
 */
import { HalftoneBlock } from "@/components/shared";
import { t } from "@/content/i18n";
import styles from "./PullquoteBand.module.css";

export interface PullquoteBandProps {}

export function PullquoteBand(_props: PullquoteBandProps = {}) {
  const C = t();
  return (
    <div className={styles.band}>
      <div className={`${styles.deco} ${styles.decoL}`} aria-hidden>
        <HalftoneBlock w={140} h={140} density={0.5} color="oklch(45% 0.04 75)" />
      </div>
      <div className={`${styles.deco} ${styles.decoR}`} aria-hidden>
        <HalftoneBlock w={160} h={160} density={0.5} color="oklch(45% 0.04 75)" />
      </div>
      <q className={styles.q}>{C.homepage_pullquote}</q>
      <cite className={styles.cite}>— fra manifestet, akt 7</cite>
    </div>
  );
}
