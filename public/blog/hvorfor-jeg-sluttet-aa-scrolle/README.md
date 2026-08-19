# Cover-prosessering (sidecar-notat)

Prosessert 2026-08-19 i Munins workspace (`tools/imgproc/`, Linux-sharp) —
IKKE i dette repoet (sharp holdes bevisst utenfor bygget, se openspec
`e2-cover-images` D5).

- **Kilde:** Nox-bildet 2026-08-18 (720×1280 portrett, JPEG). Rå-originalen
  committes aldri (bærer EXIF/GPS) og ligger utenfor repoet.
- **cover-hero.webp** — 16:9, 720×405: `sharp(raw).rotate().extract({ left: 0, top: 430, width: 720, height: 405 }).webp({ quality: 82 })`
- **cover-card.webp** — 1:1, 600×600: `sharp(raw).rotate().extract({ left: 15, top: 380, width: 600, height: 600 }).webp({ quality: 82 })`
- **Vannmerke:** AV (default for covers).
- **Metadata:** verifisert fri for EXIF/ICC/XMP/GPS via `sharp(fil).metadata()`.
