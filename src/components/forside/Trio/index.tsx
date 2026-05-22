/*
 * Trio — TIL / Lab / Endringslogg i 3-kolonners grid.
 * Hver kolonne har data-variant: "warm" (TIL), "default" (Lab), "dark"
 * (Endringslogg). Dark sist gir visuell vekt før footer.
 *
 * Returnerer null hvis alle tre datakilder er tomme.
 */
import type { ReactElement } from "react";
import Link from "next/link";
import { StatusBadge, type Status } from "@/components/shared";
import { t } from "@/content/i18n";
import styles from "./Trio.module.css";

export function Trio(): ReactElement | null {
  const C = t();
  // .slice() dropper readonly-tuple-typen fra `as const` slik at .length blir
  // number (ikke en litteral), så tom-sjekken under er meningsfull for TS.
  const til = C.til.slice(0, 4);
  const lab = C.lab.slice();
  const changelog = C.changelog.slice(0, 6);
  if (til.length === 0 && lab.length === 0 && changelog.length === 0) {
    return null;
  }
  return (
    <div className={styles.wrap}>
      {/* TIL — warm */}
      {til.length > 0 ? (
        <section className={styles.col} data-variant="warm">
          <h4 className={styles.h4}>TIL</h4>
          <div className={styles.kick}>Today I learned · mikroposter</div>
          {til.map((row, i) => (
            <div key={i} className={styles.row}>
              <span className={styles.d}>{row.date}</span>
              {row.text}
            </div>
          ))}
          <div className={styles.more}>
            <Link href="/til">→ alle 38 TIL-poster</Link>
          </div>
        </section>
      ) : null}

      {/* Lab — default */}
      {lab.length > 0 ? (
        <section className={styles.col} data-variant="default">
          <h4 className={styles.h4}>Labben</h4>
          <div className={styles.kick}>Eksperimenter · prototyper</div>
          {lab.map((row, i) => (
            <div key={i} className={styles.row}>
              <div className={styles.labHead}>
                <span className={styles.nm}>{row.name}</span>
                <StatusBadge status={row.status as Status} />
              </div>
              <div className={styles.ds}>{row.desc}</div>
            </div>
          ))}
          <div className={styles.more}>
            <Link href="/lab">→ hele labben</Link>
          </div>
        </section>
      ) : null}

      {/* Endringslogg — dark, sist */}
      {changelog.length > 0 ? (
        <section className={styles.col} data-variant="dark">
          <h4 className={styles.h4}>Endringslogg</h4>
          <div className={styles.kick}>Hva er nytt · site changelog</div>
          {changelog.map((row, i) => (
            <div key={i} className={styles.row}>
              <span className={styles.d}>{row.date}</span>
              {row.what}
            </div>
          ))}
          <div className={styles.more}>
            <Link href="/changelog">→ hele historikken</Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
