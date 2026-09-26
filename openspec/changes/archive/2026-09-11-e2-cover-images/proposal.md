## Why

E2 (`e2-blog-engine` + `e2-manifest`) ga filbasert MDX-blogg, men lot cover-bilder ligge: `coverImage` er i dag et valgfritt `string`-felt, og mangler det, viser både hero og enkeltpost HalftoneBlock-dekor. «Ekte cover-bilder» ble bevisst deferert («placeholder/HalftoneBlock holder; bildehåndtering er senere»).

Denne changen lukker den noten på en filbasert, personvern-trygg måte. Nøkkelinnsikten: prosessering skjer i et **forsteg utenfor Next-bygget** (Munins Linux-`sharp`-pipeline — fordi `sharp` i `geish_v2/node_modules` er Windows-bygget og kræsjer i WSL), og bare ett rent, croppet, EXIF/GPS-strippet WebP-master committes per utsnitt. `next/image` genererer responsive størrelser ved byggetid. Git forblir publiseringsmekanismen: prosesser → commit → publisert.

Dette er en oppfølgings-change til epic E2. Den berører `blog`-capability (frontmatter-skjema + rendring), ikke en ny capability.

## What Changes

- **Frontmatter-skjema utvides.** `coverImage` går fra `string` til et objekt, bakoverkompatibelt via zod-union (`string | object`):
  - `src: string` (påkrevd i objektet) — relativ sti, typisk `/blog/<slug>/cover-hero.webp`.
  - `alt: string` (påkrevd når cover er et objekt) — alternativ tekst for skjermlesere + `next/image`.
  - `focal: string` (valgfritt, default `"center"`) — nøkkelord (`center/top/bottom/left/right`) mappet til `object-position`.
  - `credit: string` (valgfritt) — fotokreditering hvis bildet ikke er Geirs eget.
  - Ren `string`-cover normaliseres til `{ src, alt: "" }` med en byggetids-**advarsel** om manglende alt (ikke feil, for bakoverkompat). Objekt-cover uten `alt` **feiler** byggetid med fil-navngitt melding.
- **To standardiserte utsnitt per post**, generert i forsteget fra samme master via fokuspunkt:
  - `cover-hero.webp` — **16:9** (hero på `/blogg` + topp av `/blogg/[slug]`).
  - `cover-card.webp` — **1:1** (arkiv-kort/thumbnail i grid).
  - Begge under `public/blog/<slug>/`. `next/image` lager responsive bredder av hver.
- **Rendring kobles til de nye feltene:**
  - Hero (`blogg/page.tsx`) + enkeltpost-header (`blogg/[slug]/page.tsx`) bruker `cover-hero.webp` (16:9) med `alt` fra frontmatter og `object-position` fra `focal`.
  - Arkiv-grid bruker `cover-card.webp` (1:1) med samme `alt`/`focal`.
  - `next/image` med eksplisitt `width`/`height` (eller aspect-ratio-boks) for å hindre CLS, og kontekst-riktig `sizes`.
- **HalftoneBlock-fallback bevart** i alle tre kontekster (hero, enkeltpost, kort) for poster uten `coverImage` — uendret oppførsel.
- **Én seed-post får ekte cover** (16:9 + 1:1) så hero, enkeltpost og arkiv-kort kan reviewes med faktisk bilde. Nox-bildet (2026-08-18) er testkandidat.
- **Pipeline-oppskrift dokumentert** (ikke ny kode i repoet): kort notat/README om hvordan råbilde → `cover-hero.webp` + `cover-card.webp` via Munins `webimg.js` (flagg, crop-forhold, output-plassering, vannmerke av som default for covers).

## Capabilities

### Modified Capabilities
- `blog`: Frontmatter-skjemaet endres — `coverImage` går fra `string` til `string | { src, alt, focal?, credit? }` med build-time validering av `alt`. Rendring i `/blogg` (hero + arkiv-grid) og `/blogg/[slug]` (header) bruker to standardiserte cover-utsnitt (16:9 + 1:1) via `next/image`, med HalftoneBlock som uendret fallback.

## Impact

- **Avhengigheter:** ingen nye npm-pakker i repoet. `next/image` er allerede tilgjengelig. `sharp`-prosesseringen skjer i Munins workspace-verktøy (`tools/imgproc/webimg.js`), ikke som geish_v2-avhengighet.
- **Filsystem (nytt):**
  - `public/blog/<slug>/cover-hero.webp` + `cover-card.webp` (per post med cover — starter med én seed-post).
  - Evt. `public/blog/<slug>/README.md` (liten sidecar med prosesseringsvalg) hvis vi vil spore provenens.
- **Filsystem (modifisert):**
  - `src/lib/blog/schema.ts` (zod: `coverImage` string → union + `CoverImage`-type).
  - `src/content/posts.ts` (normalisering av string-cover + advarsel).
  - `src/app/blogg/page.tsx` (hero + arkiv-grid: `next/image` med to utsnitt) + `page.module.css`.
  - `src/app/blogg/[slug]/page.tsx` (header-cover) + `page.module.css`.
  - Én eksisterende seed-`.mdx` (legger til `coverImage`-objekt).
- **Røres ikke:** MDX-pipeline, content-API-signaturer (utover cover-normalisering), tokens, shared-komponenter (HalftoneBlock brukes uendret), DB/Supabase-laget, forsidens BlogStrip (holdes utenfor denne changen), RSS/tag-filtrering.
- **Eksterne systemer:** ingen — alt er fil-IO + statiske assets. Bildeprosessering er et manuelt/Munin-drevet forsteg.
- **Ut av scope:**
  - Generativ/AI-retusj — ikke tilgjengelig.
  - CDN / ekstern bildehosting — bilder er filer i `public/`.
  - DB/`images`-tabell — ingen.
  - Upload-UI i nettstedet — ingen upload-flyt.
  - Innebygd byggetids-`sharp` i geish_v2 — bevisst unngått (Windows-build kræsjer i WSL).
  - Vannmerke som runtime-funksjon — bakes inn ved prosessering.
  - `--crop`-flagg som fast del av `webimg.js` — mulig senere imgproc-forbedring.
  - Rå-originaler i git — holdes utenfor (bærer GPS/EXIF).
  - BlogStrip på forsiden — holdes uendret; scope til `/blogg`-flatene.
