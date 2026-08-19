## 1. Frontmatter-skjema + type

- [x] 1.1 Utvid `src/lib/blog/schema.ts`: `coverImage` → zod-union `string | { src, alt, focal?, credit? }`. `alt` påkrevd i objekt-formen; `focal` enum med default `"center"`.
- [x] 1.2 Eksporter `CoverImage`-type (normalisert form: `{ src, alt, focal, credit? }`).
- [x] 1.3 `npx tsc --noEmit` rent etter schema-endring.

## 2. Normalisering i content-API

- [x] 2.1 `src/content/posts.ts`: normaliser `coverImage` etter `safeParse` — string → `{ src, alt: "", focal: "center" }` med `console.warn` (fil + manglende alt).
- [x] 2.2 `Post`-typen bærer `coverImage?: CoverImage` (normalisert, aldri unionen).
- [x] 2.3 Verifiser: objekt-cover uten `alt` kaster build-time med fil-navngitt melding; string-cover gir advarsel, ikke feil.

## 3. Rendring — hero + arkiv-grid (/blogg)

- [x] 3.1 `src/app/blogg/page.tsx`: hero bruker `next/image` med `cover-hero.webp` (16:9), `alt` + `object-position` fra `focal`, `priority`. HalftoneBlock-fallback beholdt når `coverImage` mangler.
- [x] 3.2 Arkiv-grid: hvert kort bruker `next/image` med `cover-card.webp` (1:1), lazy, `alt`/`focal`. HalftoneBlock-fallback ved manglende cover.
- [x] 3.3 `page.module.css`: aspect-ratio-bokser (16:9 hero, 1:1 kort) uten CLS; responsiv kollaps per RESPONSIVE.md.
- [x] 3.4 `sizes` satt per kontekst (hero ~60vw desktop / 100vw mobil; kort ~50vw / 100vw).

## 4. Rendring — enkeltpost-header (/blogg/[slug])

- [x] 4.1 `src/app/blogg/[slug]/page.tsx`: header viser `cover-hero.webp` (16:9) med `alt`/`focal`, `priority` (LCP). HalftoneBlock-fallback uendret.
- [x] 4.2 `page.module.css`: header-cover aspect-ratio-boks, responsiv.
- [x] 4.3 `generateMetadata`: OpenGraph-bilde peker til `cover-hero.webp` når cover finnes.

## 5. Bildeprosessering (forsteg) + seed

- [x] 5.1 Prosesser Nox-bildet (2026-08-18) i Munins workspace: `cover-hero.webp` (16:9) + `cover-card.webp` (1:1) via `webimg.js` + `extract`, vannmerke av, EXIF/GPS strippet.
- [x] 5.2 Legg begge i `public/blog/<slug>/` (slug = valgt seed-post).
- [x] 5.3 Gi seed-posten et `coverImage`-objekt `{ src, alt, focal }` i frontmatter.
- [x] 5.4 (Valgfritt) `public/blog/<slug>/README.md` med prosesseringsvalg (kilde, forhold, vannmerke).

## 6. Personvern-verifisering

- [x] 6.1 Bekreft at committede WebP er metadata-frie (ingen EXIF/GPS) via metadata-sjekk.
- [x] 6.2 Bekreft at rå-originalen IKKE er committet (utenfor repoet / i .gitignore hvis den ligger i workspace-nærhet).

## 7. Verifisering

- [x] 7.1 `npx tsc --noEmit` rent.
- [x] 7.2 `npm run build` grønt (build-time frontmatter-validering passerer).
- [x] 7.3 `/blogg` 200: hero viser 16:9-cover med alt; arkiv-kort viser 1:1-cover; poster uten cover viser HalftoneBlock.
- [x] 7.4 `/blogg/[slug]` (seed med cover) 200: header viser 16:9-cover med alt.
- [x] 7.5 `alt`-teksten er faktisk på `next/image` (verifiserbart i DOM/a11y-tre).
- [x] 7.6 `focal` styrer `object-position` (minst `center` vs. `top` verifisert).
- [x] 7.7 Ingen synlig layout-hopp (CLS) ved bildelast.
- [x] 7.8 Poster uten cover uendret fra før (HalftoneBlock i hero, enkeltpost, kort).
- [ ] 7.9 Visuell sammenligning på flere bredder — utføres av Geir i nettleser.

## 8. Forbudsliste + sanity

- [x] 8.1 Ingen ny npm-avhengighet i geish_v2 (`sharp` forblir utenfor bygget).
- [x] 8.2 Ingen DB/Supabase-import introdusert.
- [x] 8.3 Ingen `border-radius > 0`, blur-skygger, `linear-gradient` i ny CSS.
- [x] 8.4 Ingen emoji-ikoner.
- [x] 8.5 Ingen rå-original (med EXIF/GPS) committet.
