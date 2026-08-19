---
project: geish.no v2
feature: e2-cover-images
date: 2026-08-19
type: brownfield
status: locked
---

# Mandat: E2 — Blog cover images

## Mål

Gi bloggposter ekte cover-bilder på en filbasert, personvern-trygg måte. Ett rent, prosessert master-bilde per post (EXIF/GPS strippet, valgfritt vannmerke, standardisert crop) committes til repoet under `public/blog/<slug>/`, og `next/image` genererer responsive størrelser ved byggetid. `coverImage`-frontmatterfeltet utvides fra ren sti til et objekt med `alt` (tilgjengelighet/SEO), valgfritt fokuspunkt og kreditering. HalftoneBlock beholdes som fallback for poster uten cover. Dette lukker den defererte «Ekte cover-bilder»-noten fra `e2-blog-engine`.

## Bakgrunn

E2 (`e2-blog-engine` + `e2-manifest`) ga filbasert MDX-blogg med `/blogg`-liste og `/blogg/[slug]`. `coverImage` er i dag et valgfritt `string`-felt (relativ sti); mangler det, viser både hero (`blogg/page.tsx`) og enkeltpost HalftoneBlock-dekor. Bildehåndtering ble bevisst deferert i E2 («placeholder/HalftoneBlock holder; bildehåndtering er senere»).

Sideordnet har vi (2026-08-19) bygget en `sharp`-basert bildepipeline i Munins workspace (`tools/imgproc/webimg.js`): auto-roter → strip all metadata inkl. GPS → resize (aldri oppskalering) → vannmerke som skalerer med bildet → WebP. Merk: `sharp` i `geish_v2/node_modules` er Windows-bygget og kræsjer i WSL — derfor kjører prosesseringen *utenfor* repoet (Munins Linux-sharp), og bare det ferdige resultatet legges inn.

**Arkitekturvalg (låst):** Bilder er filer, ikke DB/CDN. Prosessering skjer i et forbehandlingssteg (Munins pipeline), ikke i Next-bygget — build-tid gjør kun `next/image`-resize av det ferdige masteret. Git forblir publiseringsmekanismen: prosesser → commit → publisert.

## Scope

### Inn

- **Frontmatter-skjema utvides.** `coverImage` går fra `string` til et objekt (bakoverkompatibelt via zod-union der `string` fortsatt aksepteres og normaliseres):
  - `src` (string, påkrevd i objektet) — relativ sti, typisk `/blog/<slug>/cover-hero.webp`
  - `alt` (string, påkrevd når cover finnes) — alternativ tekst for skjermlesere + `next/image`
  - `focal` (string, valgfritt — f.eks. `"center"`, `"top"`, `"left"`; default `"center"`) — styrer crop-utsnitt
  - `credit` (string, valgfritt) — fotokreditering hvis bildet ikke er Geirs eget
  - Zod-validering ved read (build-time): objekt-cover uten `alt` MUST feile med tydelig melding som navngir filen. Ren `string`-cover normaliseres til `{ src, alt: "" }` med en byggetids-advarsel om manglende alt.
- **To standardiserte utsnitt per post**, generert fra samme master via fokuspunkt:
  - `cover-hero.webp` — **16:9** (hero på `/blogg` + topp av `/blogg/[slug]`)
  - `cover-card.webp` — **1:1** (arkiv-kort/thumbnail i grid + evt. forsidens BlogStrip)
  - Begge under `public/blog/<slug>/`. `next/image` lager responsive bredder av hver.
- **Rendring kobles til de nye feltene:**
  - Hero + enkeltpost bruker `cover-hero.webp` (16:9) med `alt` fra frontmatter.
  - Arkiv-grid (og BlogStrip hvis den viser bilde) bruker `cover-card.webp` (1:1).
  - `next/image` med korrekt `sizes`, `width`/`height` (unngå CLS), `object-fit: cover` og `object-position` fra `focal`.
- **Pipeline-oppskrift dokumentert** (ikke ny kode i repoet): kort README/notat om hvordan et råbilde blir til `cover-hero.webp` + `cover-card.webp` via Munins `webimg.js` (flagg, crop-forhold, output-plassering). Vannmerke **AV som standard** for covers; kan slås på per bilde ved prosessering.
- **Én seed-post får ekte cover** (16:9 + 1:1) så hero, enkeltpost og arkiv-kort kan reviewes med faktisk bilde. Nox-bildet fra 2026-08-18 er en naturlig testkandidat.
- **Fallback bevart:** poster uten `coverImage` viser HalftoneBlock nøyaktig som i dag, i alle tre kontekster (hero, enkeltpost, kort).
- **Mobil-bevisst:** cover-bilder følger RESPONSIVE.md — hero-16:9 og kort-1:1 kollapser pent på 320px+, ingen layout-hopp (reservert høyde via `next/image` width/height eller aspect-ratio-boks).

### Ut

- **Generativ/AI-retusj** (fjerne objekter, bytte bakgrunn) — ikke tilgjengelig, ikke i scope.
- **CDN / ekstern bildehosting** — bilder er filer i `public/`. Vercel serverer dem.
- **DB/`images`-tabell** — ingen. Konsistent med filbasert E2.
- **Automatisk bildeopplasting/UI i nettstedet** — ingen upload-flyt; bilder legges inn via forbehandling + commit.
- **Innebygd byggetids-`sharp` i geish_v2** — bevisst unngått (Windows-build kræsjer i WSL). Prosessering er et eksternt forsteg.
- **Vannmerke som runtime-funksjon** — vannmerke bakes inn i masteret ved prosessering, ikke i Next-rendringen.
- **`--crop`-flagg som fast del av `webimg.js`** — kan komme senere (egen forbedring i imgproc-verktøyet); her holder ad-hoc `extract` + de to faste forholdene.
- **Rå-originaler i git** — holdes utenfor repoet (bærer GPS/EXIF). Kun prosesserte WebP committes.

## Delta-type

**Type:** brownfield

Berører `blog`-capability (MODIFIED): frontmatter-skjema (`coverImage` string → objekt) + rendring i `/blogg`, `/blogg/[slug]` og evt. forsidens BlogStrip. Ingen ny capability. Bygger på E1-design-system + RESPONSIVE.md.

## Suksesskriterier

- [ ] `coverImage` aksepterer objekt `{ src, alt, focal?, credit? }`; ren `string` normaliseres bakoverkompatibelt.
- [ ] Objekt-cover uten `alt` feiler ved byggetid med tydelig, fil-navngitt melding.
- [ ] En seed-post med ekte cover viser `cover-hero.webp` (16:9) i hero + enkeltpost, og `cover-card.webp` (1:1) i arkiv-kort.
- [ ] `alt`-teksten havner faktisk på `next/image` (verifiserbart i DOM/tilgjengelighetstre).
- [ ] `focal` styrer `object-position` slik at crop-fokus flyttes (minst `center` vs. `top` verifisert).
- [ ] Poster uten cover viser HalftoneBlock i alle tre kontekster — uendret fra i dag.
- [ ] Cover-bilder er responsive 320px+ per RESPONSIVE.md; ingen synlig layout-hopp (CLS) ved last.
- [ ] De committede WebP-ene er strippet for EXIF/GPS (verifiserbart med metadata-sjekk).
- [ ] `npx tsc --noEmit` rent; `npm run build` grønt; `/blogg` og `/blogg/[slug]` returnerer 200.
- [ ] Ingen DB-tilkobling, ingen CDN, ingen upload-UI introdusert.

## Constraints

- **Filbasert, ikke DB/CDN.** Cover-bilder er WebP-filer i `public/blog/<slug>/`. Git publiserer.
- **Personvern:** all EXIF/GPS MUST være strippet før commit. Rå-originaler committes aldri.
- **Prosessering utenfor bygget:** ikke introduser `sharp` som byggetids-avhengighet i geish_v2 (Windows-build kræsjer i WSL). `next/image` gjør resten av resize-jobben.
- Bygg på `e1-design-system` (tokens, shared-komponenter, HalftoneBlock) + følg `RESPONSIVE.md`. Ingen Tailwind/shadcn; CSS-variabler + CSS Modules.
- Avis-estetikken i 02-PAGES er autoritativ (Side 4: Bloggen). Cover-bilder skal kle newsprint-uttrykket, ikke bryte det.
- Forbudslisten §8 gjelder.
- Rause norske kommentarer.

## Kontekst for Code

- **Repo:** `C:\Users\geirh\Kodebaser\geish_v2` (WSL: `/mnt/c/Users/geirh/Kodebaser/geish_v2`). Default branch `master`. CI-gate (`npm ci → lint → build`) må være grønn; branch protection på `master`.
- **Berørte filer (forventet):** `src/content/posts.ts` (zod-skjema + normalisering), `src/app/blogg/page.tsx` (hero + arkiv-grid), `src/app/blogg/[slug]/page.tsx` (enkeltpost-header), evt. `src/components/forside/*` (BlogStrip om den viser bilde), en seed-`.mdx` under `src/content/posts/`, og bilder under `public/blog/<slug>/`.
- **Dagens tilstand:** `coverImage` er `string`; HalftoneBlock-fallback ligger i `blogg/page.tsx` (hero) — samme mønster skal gjelde de nye kontekstene. MDX via `next-mdx-remote/rsc`, frontmatter via `gray-matter`, validering via `zod`.
- **Autoritativ design:** `C:\Users\geirh\GRIM\03 Projects\geish 2.0\design_handoff_geish\` — `02-PAGES.md` Side 4 (Bloggen: hero-split, arkiv-grid, kort-estetikk), `references/pages.jsx` `PageBlogg`.
- **Bildepipeline (forsteg, ikke repo-kode):** Munins `tools/imgproc/webimg.js` (Node + Linux-`sharp`). Produserer 16:9 + 1:1 via `sharp().extract()` (fokuspunkt) + WebP. Vannmerke av som standard for covers.
- **`next/image`:** bruk eksplisitt `width`/`height` (eller aspect-ratio-boks) for å hindre CLS. `sizes` settes per kontekst (hero full bredde, kort ~1/2–1/3). `object-position` fra `focal`.

## Åpne spørsmål

<!-- Code avklarer i proposal/design. -->

- **Zod-migrering:** union `string | object` med normalisering, eller hard overgang til objekt (og oppdater seed-poster)? Forslag: union for bakoverkompat, med byggetids-advarsel ved ren `string`/manglende `alt`.
- **Filnavn-konvensjon:** `cover-hero.webp` + `cover-card.webp` i `public/blog/<slug>/`, eller ett master + `object-position`-styrt CSS uten separat 1:1-fil? Forslag: to faste filer (skarpere crop, mindre kort-nedlasting), men Code vurderer om ett master + CSS er nok for kortene.
- **`focal`-verdier:** fritt sett av nøkkelord (`center/top/bottom/left/right`) mappet til `object-position`, eller også prosent (`"50% 30%"`)? Forslag: nøkkelord nå, prosent som mulig utvidelse.
- **BlogStrip på forsiden:** skal den vise `cover-card.webp` nå, eller forblir den tekst/HalftoneBlock til en senere forside-runde? Forslag: hold forsiden uendret i denne changen; scope til `/blogg`-flatene.
- **Vannmerke-provenens:** skal `cover`-objektet bære et `watermark: true`-flagg for sporbarhet/regenerering, selv om vannmerket bakes inn ved prosessering? Forslag: utelat fra runtime-frontmatter; dokumenter prosesseringsvalg i en liten sidecar/README per slug hvis nødvendig.
