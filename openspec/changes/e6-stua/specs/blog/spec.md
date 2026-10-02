# blog Specification

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

Feltet `stua_thread` SHALL IKKE lenger være del av skjemaet. Blogg↔Stua-kobling skjer nå automatisk via bloggpostens slug (`source_slug` på Stua-tråden, E6), ikke via et manuelt frontmatter-felt.

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

#### Scenario: stua_thread-feltet er fjernet
- **WHEN** frontmatter-skjemaet og eksisterende poster (f.eks. `hello-world.mdx`) inspiseres
- **THEN** finnes ikke lenger noe `stua_thread`-felt, og bygget lykkes

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

### Requirement: /blogg/[slug]-enkeltpost rendrer MDX-brødtekst

`src/app/blogg/[slug]/page.tsx` SHALL være en static server component med `generateStaticParams` fra `getAllSlugs()` og `generateMetadata` for OpenGraph. Rendrer:

1. **Brødsmule-strip**: `geish.no / BLOGGEN / [slug]`.
2. **Post-header**: meta-linje (publisert-dato · readtime · tag i stempel-rød), h1 (`post.title`, Newsreader/Display, clamp(36px, 6vw, 64px)), excerpt-deck (Newsreader italic 19px).
3. **MDX-brødtekst**: rendres via `<MDXRemote source={mdxSource} components={mdxComponents} />`. Newsreader 18px line-height 1.6. Drop-cap på første paragraf (`.prose > p:first-of-type::first-letter`). Designsystem-komponenter (`Stamp`, `HalftoneBlock`, `Pullquote`) er tilgjengelige.
4. **Bunn-blokk**: "Diskuter i Stua →"-lenke. Lenken SHALL rute til Stua-diskusjonen for posten via automatisk oppslag på bloggpostens slug (`source_slug` på Stua-tråden), IKKE via et manuelt `stua_thread`-frontmatter-felt. Oppførsel: utlogget → `/logg-inn?next=<sti>`; innlogget med eksisterende tråd → `/stua/t/[slug]`; innlogget uten tråd → «start diskusjonen»-flyten (tråden fødes lazy ved første innlegg, koblet via `source_slug`).

Ugyldig slug → `notFound()`.

Layout: enkel sentrert kolonne (`max-width: 720px`, `margin: 0 auto`). Responsivt fra start — padding krymper ved <480px.

#### Scenario: /blogg/[slug] returnerer 200 for gyldig slug
- **WHEN** en seed-post `elgjakta-2025.mdx` finnes og GET sendes til `/blogg/elgjakta-2025`
- **THEN** responsen er 200, post-header viser title + dato + tag, MDX-brødtekst rendres

#### Scenario: ugyldig slug returnerer 404
- **WHEN** GET sendes til `/blogg/finnes-ikke`
- **THEN** Next.js returnerer 404 via `notFound()`

#### Scenario: Diskuter i Stua ruter via source_slug for innlogget uten tråd
- **WHEN** en innlogget leser klikker "Diskuter i Stua" på en post uten eksisterende tråd
- **THEN** vises «start diskusjonen»-skjemaet forhåndsutfylt med posttittelen, og tråden opprettes først ved innsending (koblet via `source_slug`)

#### Scenario: Diskuter i Stua for innlogget med eksisterende tråd
- **WHEN** en innlogget leser klikker "Diskuter i Stua" på en post som allerede har en tråd
- **THEN** redirectes hun til `/stua/t/[slug]` for den tråden

#### Scenario: Diskuter i Stua for utlogget
- **WHEN** en utlogget leser klikker "Diskuter i Stua"
- **THEN** redirectes hun til `/logg-inn?next=<sti>` uten å se Stua-innhold

#### Scenario: stua-lenke med stua_thread
- **WHEN** en post rendres og bunn-blokken bygger "Diskuter i Stua"-lenken
- **THEN** bygges lenken fra automatisk oppslag på bloggpostens slug
  (`source_slug` på Stua-tråden), IKKE fra et manuelt `stua_thread`-frontmatter-felt
  (feltet er fjernet i E6)

#### Scenario: stua-lenke uten stua_thread defaultes
- **WHEN** en post ikke har noen Stua-tråd ennå og en innlogget leser klikker
  "Diskuter i Stua"
- **THEN** vises «start diskusjonen»-flyten (tråden fødes lazy ved første innlegg)
  i stedet for en død `/stua`-lenke

#### Scenario: generateStaticParams genererer alle non-draft slugs
- **WHEN** Next.js bygger appen
- **THEN** `generateStaticParams` returnerer `Array<{ slug: string }>` for hver non-draft post
