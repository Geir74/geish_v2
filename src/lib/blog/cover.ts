/*
 * Cover-hjelpere for blogg-rendringen (openspec e2-cover-images).
 *
 * Konvensjon: hver post med cover har TO forhåndsprosesserte utsnitt under
 * public/blog/<slug>/ — `cover-hero.webp` (16:9, hero + enkeltpost-header)
 * og `cover-card.webp` (1:1, arkiv-kort). Begge er laget i et forsteg
 * utenfor Next-bygget (Munins sharp-pipeline), EXIF/GPS-strippet.
 * `next/image` gjør kun responsive resize av de ferdige masterne.
 */
import type { CoverImage } from "@/lib/blog/schema";

/**
 * focal-nøkkelord → CSS object-position. Brukes når bildecontaineren har
 * et litt annet forhold enn masteret, slik at crop-fokus bevares.
 */
export const focalToPosition: Record<CoverImage["focal"], string> = {
  center: "50% 50%",
  top: "50% 0%",
  bottom: "50% 100%",
  left: "0% 50%",
  right: "100% 50%",
};

/**
 * Utleder 1:1-kortutsnittet fra hero-stien per filnavn-konvensjonen.
 * Faller tilbake til src som den er hvis stien ikke følger konvensjonen
 * (f.eks. gamle string-covers med ett enkelt bilde).
 */
export function coverCardSrc(cover: CoverImage): string {
  return cover.src.replace(/cover-hero\.webp$/, "cover-card.webp");
}
