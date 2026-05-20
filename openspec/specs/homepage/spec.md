# homepage Specification

## Purpose
TBD - created by archiving change e1-forside. Update Purpose after archive.
## Requirements
### Requirement: Typed content-modul med t()-mønster

Prosjektet SHALL ha et content-modul i `src/content/` som eksponerer alle copy-strenger gjennom en typed `t()`-funksjon:

- `src/content/i18n.ts` MUST eksportere `t()`, `locales`, `Locale`-typen, `defaultLocale = "no"`, og `Dictionary`-typen som tilsvarer formen til NO-locale-objektet.
- `src/content/locales/no.ts` MUST eksportere `no` som et `as const`-objekt med alle slicene som forsiden bruker: `brand`, `hero` (inkludert `credo_lines`), `manifest_pullquotes`, `homepage_pullquote`, `projects` (hvert element MUST ha `href: string | null` i tillegg til feltene fra `content.js`), `about` (inkludert `photos`), `til`, `lab`, `changelog`, `guestbook`, `stua.week_question`, `stua.threads`, `blog_posts`, `meta`, `webring`.
- `t()` SHALL returnere det aktive locale-objektet. Med kun NO-locale i scope, returnerer `t()` alltid `no`.
- TypeScript MUST fange en typo i feltnavn på compile time (`as const` + `Dictionary`-typen).

Innhold porteres ordrett (slice-for-slice) fra `references/content.js` for de nevnte feltene. `manifest_excerpt`, `nav`, og andre felt som ikke brukes av forsiden er ikke i scope for dette mandatet, men kan inkluderes hvis det er enklere å porte hele objektet.

#### Scenario: t() returnerer typed dictionary
- **WHEN** en komponent importerer `import { t } from "@/content/i18n"` og kaller `t().brand.name`
- **THEN** TypeScript-typen er `string` (litteralt: `"geish.no"`), autocomplete fungerer på alle slicene

#### Scenario: typo i felt fanges på compile time
- **WHEN** en komponent skriver `t().brnad.name` (typo)
- **THEN** TypeScript-feilmeldingen identifiserer at `brnad` ikke finnes på `Dictionary`

#### Scenario: content matcher kilden
- **WHEN** `src/content/locales/no.ts` sammenlignes med `references/content.js` for de portede slicene
- **THEN** strengverdier er identiske (kun strukturell omforming fra `window.GEISH_CONTENT.no.X` til eksport av `no.X` er tillatt)

### Requirement: Forsiden bygger 13 seksjoner i 12-kolonners zine-grid

`src/app/page.tsx` SHALL rendre en hel forside med 12-kolonners CSS-grid og 13 seksjoner i denne rekkefølgen:

| # | Seksjon | Komponent | Grid-plassering |
|---|---------|-----------|-----------------|
| 1 | Megabox (hero) | `Megabox` | `1 / span 8`, `span 4` |
| 2 | Corner-stamp | `CornerStamp` | `9 / span 4`, `1 / span 2` |
| 3 | Intro-lapp | `IntroNote` | `9 / span 4`, `3 / span 2` |
| 4 | Manifest-utdrag | `ManifestCut` | `1 / span 5`, `span 4` |
| 5 | Stua-preview | `StuaPreview` | `6 / span 4`, `span 4` |
| 6 | Gjestebok | `GuestbookGrid` | `10 / span 3`, `span 4` |
| 7 | Prosjekter | `ProjectsRow` | `1 / span 8`, `span 4` |
| 8 | Pullquote-band | `PullquoteBand` | `1 / span 12`, `span 2` |
| 9 | Om Geir + foto-kollasj | `AboutRow` | `1 / span 12`, `span 5` |
| 10 | TIL + Lab + Endringslogg | `Trio` | `1 / span 12`, `span 5` |
| 11 | Blogg-stripe | `BlogStrip` | `1 / span 12`, `span 3` |
| 12 | Footer-rad | `FooterRow` | `1 / span 12`, auto |
| 13 | Copyright-linje | inline i `page.tsx` | `1 / span 12`, auto |

Grid-containeren MUST bruke `grid-template-columns: repeat(12, 1fr)`, `grid-auto-rows: minmax(40px, auto)`, `gap: 14px`, padding `32px 28px 48px`.

Grid-plasseringen MUST defineres i `src/app/page.module.css`, ikke i seksjonskomponentenes egne moduler.

#### Scenario: forsiden rendrer alle 13 grid-celler
- **WHEN** `npm run dev` kjøres og GET sendes til `/`
- **THEN** responsen returnerer 200 og inneholder bevis på alle 13 seksjoner (h1/h2/h3-tekst eller karakteristiske dataverdier)

#### Scenario: grid-layout matcher 02-PAGES
- **WHEN** `src/app/page.module.css` inspiseres
- **THEN** `repeat(12, 1fr)`, `gap: 14px`, og `padding: 32px 28px 48px` finnes på `.grid`-selektoren, og hver seksjon har en CSS-regel med `grid-column` og `grid-row` som matcher tabellen over

### Requirement: 12 forside-spesifikke seksjonskomponenter under src/components/forside/

Prosjektet SHALL ha 12 seksjonskomponenter under `src/components/forside/`, hver i sin egen mappe med `index.tsx` (TypeScript med eksplisitt props-interface) og en CSS Module (`*.module.css`):

1. **`Megabox`** — sort boks med plakat-headline ("STAY / GROUNDED, / CREATE SHIT." der "CREATE" i aksentfarge), super-linje (brand·estd·location), sub-tekst (intro_short), og `<HalftoneBlock>` som dekor som stikker ut av kanten. Hentes fra `t().brand`, `t().hero.credo_lines`, `t().hero.intro_short`.
2. **`CornerStamp`** — stort rødt stempel via `<Stamp>` med "Privat·Eid" + sub-tekst "no ads · no algorithm · no tracking", rotert -7°.
3. **`IntroNote`** — gul "lapp" med Geirs intro, rotert +1.2°, med box-shadow. Innhold fra `t().hero.intro_long` (eller utvidet `intro_short`) + lenke til `/manifest`.
4. **`ManifestCut`** — klippet-ut boks med to photo-tape-strimler på toppen, kicker "Manifest · Akt 1", h2 "Stay Grounded, and Create Shit.", de 3 første sitatene fra `t().manifest_pullquotes` i Newsreader italic, og lenke til hele manifestet.
5. **`StuaPreview`** — rotert -0.8°, med tape sentrert på toppen, tittel "Stua → akkurat nå", gul ukens-spørsmål-kort (`t().stua.week_question`), 4 første tråder fra `t().stua.threads` med tittel + meta-linje, og "→ Logg inn"-lenke til `/stua`.
6. **`GuestbookGrid`** — 3 sticky-notes (vekslende rotasjon ulike grader, varierende paper-bakgrunn) som rendrer `t().guestbook.slice(0, 3)`, med "→ Skriv noe pent"-lenke til `/gjestebok`.
7. **`ProjectsRow`** — boks med `box-shadow: 5px 5px 0 var(--ink)`, header "Prosjekter" + sub "Subdomener · *.geish.no", og 5-kolonners inner-grid med project-cards. Hver card har navn (mono fet), beskrivelse (typewriter), tag (mono) og `<StatusBadge>`. Cards roteres vekslende ±0.6° med `var(--chaos)`.
8. **`PullquoteBand`** — full-bredde gul stripe med 3px solid border top/bottom, `<HalftoneBlock>`-dekor i begge hjørner (med `color`-prop satt til lys variant), stort sitat fra `t().homepage_pullquote` i Archivo Black 42px med custom quotes `«»`, og citat-attribusjon "— fra manifestet, akt 7" i mono.
9. **`AboutRow`** — 2-kolonners (1.2fr / 1fr) inner-grid. Venstre: bio-boks med kicker, h3 (`Geir.<br/>{brand.location}.`), lead (`t().about.lead`), interesse-tags fra `t().about.interests`, og lenker-grid fra `t().about.links`. Høyre: 4 `<ImagePlaceholder>` med tape og rotasjon, plassert absolute i et `position: relative` photo-område.
10. **`Trio`** — 3-kolonners grid med TIL, Lab, og Endringslogg. TIL (`data-variant="warm"`) viser 4 første fra `t().til`. Lab (`data-variant="default"`) viser alle 3 fra `t().lab` med `<StatusBadge>`. Endringslogg (`data-variant="dark"`, cream tekst på ink) viser 6 første fra `t().changelog`.
11. **`BlogStrip`** — full-bredde sort boks. Header "Fra bloggen" i Bungee 32px. 3 hvite "klippede" artikler i 3-kolonners inner-grid med dato, tittel (Newsreader), og meta-linje (#tag · read time i stamp-farge). "→ ALLE POSTER"-lenke høyrejustert.
12. **`FooterRow`** — 3-kolonners inner-grid (`auto 1fr auto`): `<VisitorCounter count={t().meta.visitors} label="..." size="sm">` venstre, `<WebringWidget variant="card">` sentrert, `<UnderConstructionBanner>` høyre.

En barrel-eksport `src/components/forside/index.ts` MUST re-eksportere alle 12 komponenter.

Hver komponent MUST:
- Eksportere et navngitt TypeScript-interface for props (selv om props bare er `Record<string, never>`).
- Bruke CSS Modules for styling (ingen inline `style` utenom CSS-variabel-settere).
- Hente all copy fra `t()` — ingen hardkodede strenger som vises til bruker.
- Bruke `var(--chaos, 1)` på alle rotasjoner.
- Følge forbudslisten i `01-DESIGN-SYSTEM.md` §8.

#### Scenario: alle 12 seksjonskomponenter finnes
- **WHEN** `ls src/components/forside/` kjøres
- **THEN** mappene Megabox, CornerStamp, IntroNote, ManifestCut, StuaPreview, GuestbookGrid, ProjectsRow, PullquoteBand, AboutRow, Trio, BlogStrip, FooterRow finnes, hver med en `index.tsx` og en `*.module.css`

#### Scenario: barrel-eksport fungerer
- **WHEN** `src/app/page.tsx` importerer alle 12 via `import { Megabox, CornerStamp, ... } from "@/components/forside"`
- **THEN** TypeScript kompilerer uten feil

#### Scenario: ingen hardkodet copy
- **WHEN** `grep -rE "\"[A-ZÆØÅa-zæøå][^\"]{15,}\"" src/components/forside/*/index.tsx` kjøres (lange strenger som ikke ser ut som CSS-verdier)
- **THEN** treff er kun navn på CSS-klasser, data-attributter, eller URL-er — ingen menneskelig tekst

### Requirement: Forsiden gjenbruker shared-komponenter fra design-system

Forsiden SHALL bruke følgende shared-komponenter (fra `e1-design-system`):

- `HalftoneBlock` — i Megabox (med `color`-prop) og PullquoteBand (med `color`-prop)
- `Stamp` — i CornerStamp
- `StatusBadge` — i ProjectsRow (per prosjekt-card) og Trio's Lab-kolonne
- `ImagePlaceholder` — i AboutRow (4 stk)
- `VisitorCounter` — i FooterRow
- `WebringWidget` (`variant="card"`) — i FooterRow
- `UnderConstructionBanner` — i FooterRow, og som tom-tilstand-fallback i BlogStrip

Forsiden SHALL ikke installere nye npm-pakker — alt bygger på det `e1-design-system` allerede leverte.

#### Scenario: shared-komponenter importeres
- **WHEN** seksjonskomponentene inspiseres
- **THEN** importene over kommer fra `@/components/shared` (barrel-eksporten)

#### Scenario: ingen nye deps
- **WHEN** `package.json` sammenlignes mellom før og etter dette mandatet
- **THEN** kun `src/`-filer og openspec-filer endrer seg; `dependencies` og `devDependencies` er identiske

### Requirement: Tom-tilstand-håndtering per seksjon

Hver seksjonskomponent SHALL håndtere tom-tilstand som spesifisert:

- `ManifestCut`, `StuaPreview`, `GuestbookGrid`, `ProjectsRow` SHALL returnere `null` hvis deres primære datakilde er tom.
- `Trio` SHALL returnere `null` hvis alle tre kolonnenes datakilder er tomme.
- `BlogStrip` SHALL rendre en `<UnderConstructionBanner>` i stedet for artikkel-grid hvis `t().blog_posts.length === 0`. Header og "ALLE POSTER"-lenke forblir.
- `Megabox`, `CornerStamp`, `IntroNote`, `PullquoteBand`, `AboutRow`, `FooterRow` SHALL alltid rendre (deres copy er garantert i content).

CSS Grid håndterer tomme celler automatisk — en seksjon som returnerer null etterlater et hull, og resten av layouten ligger på plass.

#### Scenario: seksjon med tom data returnerer null
- **WHEN** `t().guestbook` er en tom array
- **THEN** `<GuestbookGrid>` rendrer `null` (ingen DOM-noder) og grid-cellen står tom

#### Scenario: blogg-fallback til UC-banner
- **WHEN** `t().blog_posts` er en tom array
- **THEN** `<BlogStrip>` rendrer header + `<UnderConstructionBanner>` i stedet for 3-kolonners grid

### Requirement: Lenker peker på riktige URL-er uten stub-ruter

Forsiden SHALL ha lenker som peker på riktige (eventuelle) URL-er per 02-PAGES interactions:

| Lenke | Mål-URL |
|-------|---------|
| Manifest-lenke fra Megabox/IntroNote/ManifestCut | `/manifest` |
| Stua "Logg inn"-lenke | `/stua` |
| Stua tråd-klikk (hvis implementert som lenke) | `/stua/[id]` eller `#` |
| Gjestebok "Skriv noe pent" | `/gjestebok` |
| Prosjekt-cards | `t().projects[i].href` (kan være null — da ikke lenke) |
| Blog-clip-lenker | `/blogg/[slug]` eller `/blogg` for listen |
| "ALLE POSTER" | `/blogg` |

Interne lenker MUST bruke `<Link>` fra `next/link`. Eksterne (subdomener) MUST bruke `<a href>`. Ingen lenke skal peke til en stub-rute som vi oppretter bare for å unngå 404 — rutene 404-er til epicene lander.

#### Scenario: interne lenker bruker Link
- **WHEN** `grep -rE "href=\"/" src/components/forside/` kjøres
- **THEN** treff er bare i `next/link`-import-statements eller i `<Link href="...">` JSX

#### Scenario: project-cards bruker eksplisitt href fra content
- **WHEN** ProjectsRow rendres
- **THEN** hver card med `href` startende med `http` wrappes i `<a href={href}>` (ekstern); hver card med intern `href` wrappes i `<Link>`; hver card med `href: null` rendres som `<div>` uten lenke. Ingen card lenker til en automatisk-konstruert URL som ikke er i content.

### Requirement: HalftoneBlock med color-prop brukes på sort bakgrunn

Megabox og PullquoteBand SHALL bruke `<HalftoneBlock>` med en `color`-prop satt til lys variant for å rendre på sort/gul bakgrunn:

- Megabox: `<HalftoneBlock w={220} h={220} density={0.55} color="oklch(85% 0.08 80)" />` — lys cream-tone for prikker på sort bakgrunn.
- PullquoteBand: `<HalftoneBlock w={140} h={140} density={0.5} color="oklch(45% 0.04 75)" />` — dempet ink for prikker på gul bakgrunn (lavere kontrast for å være dekorativ, ikke dominerende).

#### Scenario: Megabox halftone er lys
- **WHEN** Megabox-komponenten rendres
- **THEN** halftone-prikkene er ikke `var(--ink)` (default) — de er lys cream som spesifisert

