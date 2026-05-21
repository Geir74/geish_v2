## Why

`e15-responsive-tokens` etablerte primitivene — fluid heading-tokens via `clamp()`, `--chaos`-skalering i media queries, breakpoint-konstanter, og `RESPONSIVE.md`-oppskriften. Forsiden bruker dem ennå *ikke*: hardkodede mega-fontstørrelser sprenger på smal skjerm (Megabox 124px, PullquoteBand 42px, AboutRow.bio.h3 44px osv.), 12-kolonners gridet har ingen breakpoints, og AboutRows absolute-posisjonerte foto-kollasj klumper når containeren krymper.

Change 2 av E1.5-epicen anvender mønsteret på forsiden: bytt hardkodede sizes til clamp() (lokalt der det matcher seksjonens egen skala, token der det er gjenbruk), kollaps gridet 12 → 2 → 1, og fiks foto-kollasjens absolutt-positionering så den ikke knekker på 380px. Når denne lander er forsiden lesbar fra 320px og opp uten å miste collage-sjelen.

## What Changes

- **Konverter hardkodede mega-fontstørrelser i forside-seksjonene til `clamp()`-uttrykk** (eller token der seksjonen ikke trenger egen skala). Mønster: `clamp(<min lesbar på 380px>, <vw så max kicker in på ~1280px>, <dagens desktop-verdi som max>)`. Konkret per seksjon:
  - `Megabox` h1: `124px` → `clamp(56px, 10.5vw, 124px)` (Bungee plakat-headline)
  - `ManifestCut` h2: `36px` → `clamp(24px, 3.2vw, 36px)` (Display)
  - `PullquoteBand` q: `42px` → `clamp(24px, 3.8vw, 42px)` (Display)
  - `AboutRow` .bio h3: `44px` → `clamp(28px, 3.9vw, 44px)` (Display)
  - `BlogStrip` h3: `32px` → `clamp(22px, 2.9vw, 32px)` (Bungee)
  - `ProjectsRow` h3: `30px` → `clamp(20px, 2.6vw, 30px)` (Display)
  - `IntroNote` .hello: `28px` → `var(--t-h3)` (verdien matcher token-skalaen eksakt)
  - Mindre headings (`StuaPreview` 22px, `GuestbookGrid` 18px, `Trio` h4 22px) forblir uendret — de sprenger ikke på mobil.
- **Kollapse 12-kolonners gridet i `src/app/page.module.css`** ved to breakpoints. DOM-rekkefølgen i `page.tsx` (1–13) er allerede leserekkefølge; vi flytter ikke noe.
  - **≥ 768px (desktop, uendret):** dagens 12-kolonners layout.
  - **480–767px (tablet/nettbrett):** `grid-template-columns: repeat(2, 1fr)`. Naturlige pairings: Megabox full bredde; CornerStamp + IntroNote i én rad; ManifestCut full bredde; StuaPreview + GuestbookGrid i én rad; ProjectsRow / PullquoteBand / AboutRow / Trio / BlogStrip / FooterRow / Copyright full bredde.
  - **< 480px (mobil):** `grid-template-columns: 1fr`. Alle seksjoner stables.
- **Internal grids i seksjoner kollapser** der mockup-en hadde mange kolonner: `ProjectsRow.grid5` (5 → 3 → 2), `Trio` (3 → 2+1 → 1), `BlogStrip.grid3` (3 → 2 → 1), `AboutRow` (1.2fr/1fr → stacked 1fr), `FooterRow` (3-col → stacked column). Kun via media queries i seksjonenes egne CSS Modules — ingen TS-endringer.
- **Fiks `AboutRow` foto-kollasj for smal container.** Desktop beholdes pixel-identisk (absolute-positionering med PHOTO_LAYOUT-tabellen). Ved <768px: media queries i `AboutRow.module.css` overstyrer absolute-positionering med `!important` (siden inline-styles er kilden) og bytter `.photos` til en `grid 2-col`-layout der photos flyter naturlig. Ved <480px: 1-kol stack. Inner `ImagePlaceholder` `.box` får override på width/height via `> div > div`-selektor. Rotasjon bevart via `--chaos` (allerede dempet av tokens-change).
- **Verifiser at ingen seksjon forårsaker horisontal scroll på 380px viewport.** Megabox/PullquoteBand har allerede `overflow: hidden` for halftone-dekor som stikker ut. ManifestCut-tape og StuaPreview-tape er relativ til wrapper og scroller med. Sjekkliste i task 5.

## Capabilities

### Modified Capabilities
- `homepage`: Forsidens 12-kolonners grid blir responsivt (kollaps 12 → 2 → 1). Forside-seksjonene bruker fluid heading-størrelser i stedet for hardkodede px. AboutRows photo-kollasj fungerer på smal skjerm uten å klumpe.

## Impact

- **Avhengigheter (ingen nye)**: alt bygger på `e15-responsive-tokens` som allerede er landet.
- **Filsystem (modifisert)**: 
  - `src/app/page.module.css` (grid-kollaps).
  - `src/components/forside/Megabox/Megabox.module.css` (clamp på h1).
  - `src/components/forside/ManifestCut/ManifestCut.module.css` (clamp på h2).
  - `src/components/forside/PullquoteBand/PullquoteBand.module.css` (clamp på q).
  - `src/components/forside/AboutRow/AboutRow.module.css` (clamp på h3 + photo-kollasj-overrides ved breakpoints).
  - `src/components/forside/BlogStrip/BlogStrip.module.css` (clamp på h3 + internal grid 3→2→1).
  - `src/components/forside/ProjectsRow/ProjectsRow.module.css` (clamp på h3 + internal grid 5→3→2).
  - `src/components/forside/IntroNote/IntroNote.module.css` (bytte 28px → `var(--t-h3)`).
  - `src/components/forside/Trio/Trio.module.css` (internal grid 3→2+1→1).
  - `src/components/forside/FooterRow/FooterRow.module.css` (3-col stack på narrow).
- **Røres ikke**: TS-koden (ingen `useMediaQuery` eller andre client-side hooks — alt løses via CSS Modules + media queries), content-modulet, shared-komponenter, tokens.css, globals.css, DB/Supabase, smoke- og styleguide-rutene.
- **Eksterne systemer**: ingen.
- **Ut av scope**: undersider, ekte mobil-mockup-perfeksjonering, ny capability for responsive (mønsteret ligger i `design-system` per Change 1), endringer i `Megabox` JSX-strukturen (font-størrelser endres kun i CSS), nye photo-labels eller content-felt.

**Suksesskriterium:** `/` er lesbar og ikke "sprengt" på 320, 380, 600 og 768px. Grid kollapser 12 → 2 → 1. Ingen horisontal scroll. Collage-sjelen bevart (tape, skygger, dempet rotasjon). Desktop ≥768px pixel-identisk med dagens E1.
