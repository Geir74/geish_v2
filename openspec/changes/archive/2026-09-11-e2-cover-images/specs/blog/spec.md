## MODIFIED Requirements

### Requirement: Frontmatter-skjema og build-time validering

Hver post SHALL ha YAML-frontmatter som matcher schema:

| Felt | Type | Påkrevd | Beskrivelse |
|------|------|---------|-------------|
| `title` | string | ja | Postens tittel |
| `tag` | string | ja | Én tag (f.eks. `"manifest"`, `"tech"`, `"liv"`) |
| `excerpt` | string | ja | Kort sammendrag, vises i liste og meta |
| `published` | string | ja | ISO date `YYYY-MM-DD` |
| `draft` | boolean | nei (default `false`) | Hvis `true`, skjules i prod-lista |
| `readTimeMin` | number | nei (auto-utledes) | Lese-tid i minutter; default = `ceil(ord / 200)` |
| `coverImage` | string \| objekt | nei | Cover-bilde; fall til HalftoneBlock-dekor når utelatt |
| `stua_thread` | string | nei | Slug for spesifikk Stua-tråd; fall til `/stua` |

`coverImage` SHALL aksepteres i to former:
- **Ren string** (bakoverkompat) — en relativ sti. Normaliseres internt til `{ src, alt: "", focal: "center" }` med en byggetids-**advarsel** om manglende `alt`.
- **Objekt** med feltene:
  - `src` (string, påkrevd) — relativ sti, typisk `/blog/<slug>/cover-hero.webp`.
  - `alt` (string, **påkrevd**) — alternativ tekst for skjermlesere og `next/image`.
  - `focal` (enum `center|top|bottom|left|right`, valgfritt, default `center`) — crop-fokus / `object-position`.
  - `credit` (string, valgfritt) — fotokreditering.

Validering MUST utføres ved første read av posten (build-time via `getAllPosts()` eller `getPostBySlug()`). Et objekt-`coverImage` uten `alt` MUST kaste en feil med tydelig melding som identifiserer filnavnet og feltet. Ugyldig eller manglende annet påkrevd felt MUST fortsatt kaste (uendret). Feilen SHALL ikke bli stille.

Slug utledes fra filnavnet (`hvorfor-jeg-sluttet-aa-scrolle.mdx` → `hvorfor-jeg-sluttet-aa-scrolle`). Filnavn MUST være ASCII-only (konvensjon: `æ → ae`, `ø → oe`, `å → aa`). Ingen `slug`-felt i frontmatter.

#### Scenario: gyldig frontmatter passerer validering
- **WHEN** en `.mdx`-fil med komplett frontmatter (`title`, `tag`, `excerpt`, `published`) leses
- **THEN** `getAllPosts()` returnerer en `Post`-instans med korrekt typede felt

#### Scenario: ugyldig frontmatter feiler build-time
- **WHEN** en `.mdx`-fil mangler `tag`-feltet eller har `published: "ikke-en-dato"`
- **THEN** `getAllPosts()` kaster en `Error` med melding som inkluderer filnavnet og hvilket felt som er ugyldig

#### Scenario: slug utledes fra filnavn
- **WHEN** fila `src/content/posts/elgjakta-2025.mdx` parses
- **THEN** `post.slug === "elgjakta-2025"`

#### Scenario: draft-poster skjules i produksjon
- **WHEN** en post har `draft: true` og `NODE_ENV === "production"`
- **THEN** `getAllPosts()` inkluderer ikke posten i resultatet

#### Scenario: draft-poster vises i dev
- **WHEN** en post har `draft: true` og `NODE_ENV !== "production"`
- **THEN** `getAllPosts()` inkluderer posten (slik at Geir kan preview)

#### Scenario: coverImage som objekt valideres
- **WHEN** en post har `coverImage: { src: "/blog/nox/cover-hero.webp", alt: "Nox i morgensol", focal: "top" }`
- **THEN** `getAllPosts()` returnerer en `Post` med normalisert `coverImage` av typen `CoverImage`

#### Scenario: coverImage-objekt uten alt feiler build-time
- **WHEN** en post har `coverImage: { src: "/blog/nox/cover-hero.webp" }` uten `alt`
- **THEN** `getAllPosts()` kaster en `Error` med melding som inkluderer filnavnet og at `coverImage.alt` er påkrevd

#### Scenario: coverImage som ren string er bakoverkompatibel
- **WHEN** en post har `coverImage: "/blog/nox/cover-hero.webp"` (string)
- **THEN** `getAllPosts()` normaliserer til `{ src: "/blog/nox/cover-hero.webp", alt: "", focal: "center" }` og logger en advarsel om manglende alt (kaster ikke)

#### Scenario: manglende coverImage gir HalftoneBlock-fallback
- **WHEN** en post ikke har `coverImage`-feltet
- **THEN** hero, enkeltpost-header og arkiv-kort viser HalftoneBlock-dekor (uendret oppførsel)

## ADDED Requirements

### Requirement: Cover-bilder som to standardiserte utsnitt via next/image

Poster med `coverImage` SHALL rendre ekte bilder via `next/image` i to standardiserte utsnitt, forhåndsprosessert utenfor Next-bygget og lagret under `public/blog/<slug>/`:
- `cover-hero.webp` — **16:9** — brukt i hero på `/blogg` og i header på `/blogg/[slug]`.
- `cover-card.webp` — **1:1** — brukt i arkiv-kort på `/blogg`.

Rendringen MUST:
- Sette `next/image` `alt` fra `coverImage.alt`.
- Sette `object-position` avledet fra `coverImage.focal`.
- Bruke eksplisitt `width`/`height` eller aspect-ratio-boks for å unngå CLS.
- Sette `priority` på LCP-kandidater (hero på `/blogg`, header på `/blogg/[slug]`) og lazy-laste arkiv-kort.

Cover-bildene MUST være strippet for EXIF/GPS-metadata før commit. Rå-originaler SHALL ikke committes. Ingen byggetids-`sharp`-avhengighet SHALL introduseres i geish_v2 — prosessering er et forsteg (Munins `tools/imgproc/webimg.js`).

#### Scenario: hero viser 16:9-cover
- **WHEN** en post med `coverImage`-objekt vises på `/blogg` som hero
- **THEN** `next/image` laster `/blog/<slug>/cover-hero.webp` med korrekt `alt` og `object-position` fra `focal`

#### Scenario: arkiv-kort viser 1:1-cover
- **WHEN** en post med `coverImage` vises i arkiv-grid på `/blogg`
- **THEN** kortet laster `/blog/<slug>/cover-card.webp` (1:1) via `next/image`, lazy

#### Scenario: enkeltpost-header viser cover med alt
- **WHEN** en post med `coverImage` åpnes på `/blogg/[slug]`
- **THEN** header viser `cover-hero.webp` med `alt`-teksten tilgjengelig i DOM/a11y-treet, `priority` satt

#### Scenario: cover er metadata-fritt
- **WHEN** en committet `cover-hero.webp` eller `cover-card.webp` inspiseres
- **THEN** finnes ingen EXIF- eller GPS-metadata i filen

#### Scenario: focal styrer object-position
- **WHEN** en post har `coverImage.focal: "top"`
- **THEN** cover-bildet rendres med `object-position` som prioriterer toppen av bildet (mot `center` som default)
