## MODIFIED Requirements

### Requirement: 12 forside-spesifikke seksjonskomponenter under src/components/forside/

Prosjektet SHALL ha 12 seksjonskomponenter under `src/components/forside/`, hver i sin egen mappe med `index.tsx` og en CSS Module. Komponentene er Megabox, CornerStamp, IntroNote, ManifestCut, StuaPreview, GuestbookGrid, ProjectsRow, PullquoteBand, AboutRow, Trio, BlogStrip, FooterRow. (13. seksjon, copyright-linje, er inline i `page.tsx`.)

Hver komponent MUST:
- Eksportere et navngitt TypeScript-interface for props.
- Bruke CSS Modules for styling.
- Hente all copy fra `t()` — ingen hardkodede strenger som vises til bruker. **Unntak:** `BlogStrip` henter post-data fra `getAllPosts()` (filbasert MDX-pipeline fra `blog`-capability), ikke fra `t()`. Bare `BlogStrip`-headeren ("Fra bloggen", "→ ALLE POSTER") forblir hardkodet eller fra `t()`.
- Bruke `var(--chaos, 1)` på alle rotasjoner.
- Følge forbudslisten i `01-DESIGN-SYSTEM.md` §8.

**Mega-fontstørrelser SHALL ikke være hardkodede px-verdier.** De MUST være enten:
- En `clamp(min, vw, max)`-uttrykk i komponentens CSS Module (lokal, der max = ønsket desktop-verdi).
- En referanse til en `var(--t-XXX)`-token i tokens.css (når seksjonens størrelse matcher token-skalaen eksakt).

Konkrete krav per seksjon:
- `Megabox` `.h1`: `clamp(40px, 10.5vw, 124px)` (Bungee plakat-headline). Min må holde det lengste ubrytelige ordet ("GROUNDED,") innenfor megabox-content-area på ~196px ved 292px viewport — 40px Bungee er ~180px for ordet.
- `ManifestCut` `.h2`: `clamp(24px, 3.2vw, 36px)`.
- `PullquoteBand` `.q`: `clamp(24px, 3.8vw, 42px)`.
- `AboutRow` `.bio` `.h3`: `clamp(28px, 3.9vw, 44px)`.
- `BlogStrip` `.h3`: `clamp(22px, 2.9vw, 32px)`.
- `ProjectsRow` `.h3`: `clamp(20px, 2.6vw, 30px)`.
- `IntroNote` `.hello`: `var(--t-h3)` (matcher token-skalaen eksakt på 28px max).
- Mindre headings (StuaPreview 22px, GuestbookGrid 18px, Trio 22px) MAY forbli som hardkodede px-verdier — de sprenger ikke på 380px viewport.

**AboutRow** SHALL i tillegg rendre sine egne photo-placeholders (`.photo` + `.tape` + `.box`) inline i stedet for å bruke `<ImagePlaceholder>` for bio-kollasjen. Dette gjøres for å la CSS Module være kilden til alle dimensjons- og posisjons-styling (via CSS-variabler), slik at media queries kan overstyre uten `!important` eller descendant-selektorer inn i shared-komponenter. Resten av AboutRows oppskrift (bio-boks med kicker, h3, lead, tags, links) er uendret.

**BlogStrip** SHALL lese post-data via `await getAllPosts()` fra `@/content/posts` (filbasert MDX-pipeline). Den viser de 3 nyeste non-draft postene; hver clip har dato, tittel (Newsreader), og meta-linje (#tag · readTime). Hver clip lenker til `/blogg/[slug]`. "→ ALLE POSTER"-lenken peker til `/blogg`. Tom-fallback (`<UnderConstructionBanner>`) beholdes hvis ingen poster finnes.

#### Scenario: alle 12 seksjonskomponenter finnes
- **WHEN** `ls src/components/forside/` kjøres
- **THEN** mappene Megabox, CornerStamp, IntroNote, ManifestCut, StuaPreview, GuestbookGrid, ProjectsRow, PullquoteBand, AboutRow, Trio, BlogStrip, FooterRow finnes, hver med en `index.tsx` og en `*.module.css`

#### Scenario: AboutRow eier sin egen photo-placeholder-implementasjon
- **WHEN** `src/components/forside/AboutRow/index.tsx` inspiseres
- **THEN** filen importerer ikke `ImagePlaceholder` fra `@/components/shared`; bio-kollasjen rendres via lokale `.photo`/`.tape`/`.box`-elementer i AboutRows egen DOM

#### Scenario: BlogStrip leser fra blog-capability
- **WHEN** `src/components/forside/BlogStrip/index.tsx` inspiseres
- **THEN** komponenten importerer `getAllPosts` fra `@/content/posts` og bruker resultatet for clip-data. Den importerer ikke `blog_posts` fra `t()`.

#### Scenario: BlogStrip-clips lenker til enkeltposter
- **WHEN** forsiden rendres og BlogStrip viser poster
- **THEN** hver clip er en `<Link href="/blogg/<slug>">` som peker på den spesifikke posten

#### Scenario: ingen hardkodet mega-fontstørrelse
- **WHEN** `grep -E "font-size:\s*(124px|42px|44px|36px|32px|30px)" src/components/forside/` kjøres på alle `*.module.css`-filer
- **THEN** treff finnes kun som `max`-argumentet inne i `clamp(...)`-uttrykk, ikke som rene px-verdier

### Requirement: Typed content-modul med t()-mønster

Prosjektet SHALL ha et content-modul i `src/content/` som eksponerer alle copy-strenger gjennom en typed `t()`-funksjon:

- `src/content/i18n.ts` MUST eksportere `t()`, `locales`, `Locale`-typen, `defaultLocale = "no"`, og `Dictionary`-typen som tilsvarer formen til NO-locale-objektet.
- `src/content/locales/no.ts` MUST eksportere `no` som et `as const`-objekt med slicene som forsiden bruker: `brand`, `hero` (inkludert `credo_lines`), `manifest_pullquotes`, `homepage_pullquote`, `projects` (hvert element MUST ha `href: string | null` i tillegg til feltene fra `content.js`), `about` (inkludert `photos`), `til`, `lab`, `changelog`, `guestbook`, `stua.week_question`, `stua.threads`, `meta`, `webring`.
- `t()` SHALL returnere det aktive locale-objektet. Med kun NO-locale i scope, returnerer `t()` alltid `no`.
- TypeScript MUST fange en typo i feltnavn på compile time (`as const` + `Dictionary`-typen).

`blog_posts`-feltet fjernes fra content-modulet siden `BlogStrip` nå leser fra `getAllPosts()` (blog-capability). Innhold porteres ordrett (slice-for-slice) fra `references/content.js` for de andre nevnte slicene. `manifest_excerpt`, `nav`, og andre felt som ikke brukes av forsiden er ikke i scope.

#### Scenario: t() returnerer typed dictionary
- **WHEN** en komponent importerer `import { t } from "@/content/i18n"` og kaller `t().brand.name`
- **THEN** TypeScript-typen er `string` (litteralt: `"geish.no"`), autocomplete fungerer på alle slicene

#### Scenario: blog_posts er ikke i dictionary
- **WHEN** en TS-fil prøver å lese `t().blog_posts`
- **THEN** TypeScript-feilmeldingen identifiserer at `blog_posts` ikke finnes på `Dictionary`

#### Scenario: typo i felt fanges på compile time
- **WHEN** en komponent skriver `t().brnad.name` (typo)
- **THEN** TypeScript-feilmeldingen identifiserer at `brnad` ikke finnes på `Dictionary`
