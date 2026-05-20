/*
 * AboutRow — 2-kolonners (1.2fr / 1fr). Venstre: bio-boks med kicker, h3,
 * lead, interesse-tags, og lenker-grid. Høyre: 4 foto-placeholders med tape,
 * plassert absolute med spesifikk rotasjon/posisjon per index.
 *
 * Photo-labels kommer fra content (about.photos). Posisjon/rotasjon er
 * designvalg som hører til komponenten — se PHOTO_LAYOUT under.
 */
import type { CSSProperties, ReactElement } from "react";
import { ImagePlaceholder } from "@/components/shared";
import { t } from "@/content/i18n";
import styles from "./AboutRow.module.css";

export interface AboutRowProps {}

interface PhotoSlot {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  width: number;
  height: number;
  rotate: number;
}

// Posisjonene matcher mockup-en. Hvis content har flere photos enn slots
// her, faller resten ut (med dev-advarsel).
const PHOTO_LAYOUT: PhotoSlot[] = [
  { top: 4, left: 0, width: 180, height: 220, rotate: -3.5 },
  { top: 20, right: 8, width: 200, height: 140, rotate: 2.2 },
  { bottom: 8, left: 60, width: 160, height: 110, rotate: 1.5 },
  { bottom: 0, right: 32, width: 130, height: 130, rotate: -2 },
];

export function AboutRow(_props: AboutRowProps = {}): ReactElement {
  const C = t();
  if (
    process.env.NODE_ENV !== "production" &&
    C.about.photos.length > PHOTO_LAYOUT.length
  ) {
    console.warn(
      `AboutRow: ${C.about.photos.length} photos i content men kun ${PHOTO_LAYOUT.length} layout-slots — overskytende droppes.`,
    );
  }
  const photos = C.about.photos.slice(0, PHOTO_LAYOUT.length);
  return (
    <div className={styles.wrap}>
      <div className={styles.bio}>
        <div className={styles.kicker}>{C.about.heading}</div>
        <h3 className={styles.h3}>
          {C.brand.author}.<br />
          OSLO.
        </h3>
        <p className={styles.lead}>{C.about.lead}</p>
        <div className={styles.tags}>
          {C.about.interests.map((tg) => (
            <span key={tg} className={styles.tag}>
              {tg}
            </span>
          ))}
        </div>
        <div className={styles.links}>
          {C.about.links.map((l) => (
            <div key={l.label} className={styles.link}>
              <span className={styles.linkLabel}>{l.label}</span>
              <span>{l.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.photos}>
        {photos.map((p, i) => {
          const slot = PHOTO_LAYOUT[i];
          const posStyle: CSSProperties = {
            position: "absolute",
            top: slot.top,
            bottom: slot.bottom,
            left: slot.left,
            right: slot.right,
          };
          return (
            <div key={p.label} className={styles.photo} style={posStyle}>
              <ImagePlaceholder
                label={p.label}
                w={slot.width}
                h={slot.height}
                tape
                rotate={slot.rotate}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
