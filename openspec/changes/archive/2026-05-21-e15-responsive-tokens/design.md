## Context

E1 leverte tokens (`src/styles/tokens.css`), 8 shared-komponenter, 12 forside-komponenter, og en /styleguide. Alle rotasjoner går gjennom `var(--chaos, 1)` — en global multiplikator definert i `globals.css` med default `1`. Forsiden (`src/app/page.module.css`) bruker `repeat(12, 1fr)` med faste `grid-column`-spenn. Ingen breakpoints finnes.

Mandatet E1.5 (`openspec/mandates/e1.5-responsive.md`) er to changes under én epic. Change 1 etablerer responsive *primitiver* i designsystemet; Change 2 anvender dem på forsiden.

**Eksterne premisser:**
- Designhandoffen er desktop-only — ingen mobil-mockup finnes. Mobil-utseendet defineres her, innenfor zine-prinsippene (forbudsliste §8, collage-estetikk).
- Geir foretrekker "roligere, ikke renere" på mobil — demp rotasjon, behold tape/skygger/halftone.
- Desktop (≥768px) skal være pixel-identisk med E1.

**Sentralt teknisk premiss:** CSS-spesifikasjonen tillater ikke `var(--bp-tablet)` inne i `@media (max-width: ...)`-conditions. Custom properties evalueres ikke i den konteksten. Det betyr at *enten* importerer vi en build-step (PostCSS + `postcss-custom-media`) som transformer dem ved compile, *eller* så lever breakpoint-verdiene som en konvensjon med raw px i media queries.

## Goals / Non-Goals

**Goals:**
- Etablere et responsive vokabular i tokens.css som E2+ kan referere til.
- Få mega-typografi til å skalere ned uten å bryte desktop.
- Demp rotasjon globalt via `--chaos`-overrides i media queries.
- Dokumentere mønsteret som en short oppskrift for E2+.
- Bevare desktop pixel-identisk.

**Non-Goals:**
- Forsidens grid-kollaps (Change 2).
- Endre seksjonskomponentene som hardkoder mega-fontstørrelser (Change 2 — der det er forside-spesifikt).
- Pixel-perfekt mobil-design.
- En egen mobil-variant av /styleguide.
- Engelsk locale, mørk modus, theming.

## Decisions

### D1. PostCSS + `@custom-media` vs. dokumentert konvensjon

**Valg:** Dokumentert konvensjon. Vi går ikke re-introdusere PostCSS-pipeline.

**Hvorfor:**
- Native CSS lar ikke `var()` brukes i `@media`-conditions. Det er en spesifikasjons-begrensning, ikke en feil hos oss.
- `@custom-media` er en draft CSS-feature som krever build-time transform (`postcss-custom-media`).
- E1-design-system fjernet PostCSS-pipeline da Tailwind ble fjernet. Re-introdusere den krever:
  - Installere `postcss-custom-media`.
  - Verifisere at Next 16 + Turbopack respekterer custom PostCSS-config — Turbopack har begrenset PostCSS-plugin-støtte sammenliknet med Webpack.
  - Akseptere en ny build-dep og en konfig-fil.
- To breakpoints rettferdiggjør ikke kostnaden. Vi velger:
  - Definere `--bp-tablet: 768px;` og `--bp-mobile: 480px;` i `tokens.css` som CSS-variabler for *dokumentasjon* og bruk i kontekster der `var()` faktisk virker (typisk `clamp()`/`calc()` i CSS-egenskapsverdier).
  - Bruke raw `768px`/`480px` i media query-conditions med en kommentar over hver: `/* matcher --bp-tablet i tokens.css */`.
  - Hvis Geir senere endrer breakpoints, må han søke-erstatte raw-verdiene i media queries. Med kun to breakpoints og et begrenset antall media queries (forventet 5-10 totalt over E1.5 og E2+) er det akseptabelt.

**Alternativer vurdert:**
- Installer `postcss-custom-media` + konfigurer Turbopack: Mer enn 50 linjer config + sjanse for friksjon ved Next-oppgraderinger. Avvist.
- Hardkode verdiene uten å definere konstanter i tokens: Mister referansepunktet for E2+. Avvist.
- Bruk SCSS/Less for variabel-substitusjon: Krever ny build-pipeline. Avvist.

### D2. Mobile-first vs. desktop-first media queries

**Valg:** Desktop-first med `max-width`-queries.

**Hvorfor:** Desktop-layouten er allerede ferdig og er den autoritative referansen ("desktop skal være pixel-identisk"). Tokens lever som *desktop-verdier*; media queries *overstyrer ned* ved smal skjerm. Det matcher mental modellen "demp på mobil" bedre enn "bygg opp fra mobil" — sistnevnte ville krevd å re-introdusere alle desktop-verdier inne i en `min-width: 768px`-query.

Konkret:
```css
:root { --chaos: 1; }                                  /* desktop default */
@media (max-width: 767.98px) { :root { --chaos: 0.4; } }
@media (max-width: 479.98px) { :root { --chaos: 0.15; } }
```

`.98px` justeringen er konvensjonen for å unngå overlap når noe annet bruker `min-width: 768px` — den siste cascade-regelen vinner uansett her, så strengt tatt unødvendig, men det er en lesbar konvensjon.

**Alternativer vurdert:**
- Mobile-first med `min-width`: Krever å sette mobile-defaults først og bygge opp. Mer kode, motsatt mental modell. Avvist.
- Container queries (`@container`): Per-komponent-responsivitet. Overkill når vi vil at *hele siden* skal skalere konsistent. Avvist.

### D3. Fluid mega-typografi via `clamp()` i tokens

**Valg:** Konverter `--t-h3`, `--t-h2`, `--t-h1`, `--t-mega` til `clamp(min, vw, max)`-uttrykk der `max` er dagens desktop-verdi. Smalere tokens forblir faste.

```css
/* Foreslåtte verdier (Geir kan finjustere): */
--t-h3:   clamp(20px, 2.5vw, 28px);
--t-h2:   clamp(28px, 4vw,   48px);
--t-h1:   clamp(40px, 7vw,   88px);
--t-mega: clamp(56px, 12vw, 144px);
```

På ≥1280px-bredder vinner `max` (vw-verdien er større enn max → clamp returnerer max). Identisk med før. Smalere skjermer skalerer jevnt ned.

**Hvorfor `clamp()` framfor breakpoint-overrides:**
- Mandatet foretrekker "flytende i stedet for trinnvis".
- Én linje per token vs. fire steder å oppdatere (definisjon + tre media queries).
- Ingen "store i springs" når en skjerm krysser 768px — leseopplevelsen blir mykere.
- Standard CSS, ingen build-magi.

**Hvorfor bare mega-tier:**
- `--t-body: 16px` er allerede en lesestørrelse. `--t-lead: 20px` likeså. Disse skal *ikke* skaleres ned — på mobil vil 14px-tekst gjøre vondt å lese.
- `--t-meta: 11px` er allerede minimum.
- Det er kun heading-skalaen (28–144px) som sprenger på smal skjerm.

**Anmerkning:** Forsiden bruker hovedsakelig *hardkodede* heading-størrelser i Megabox (124px Bungee), PullquoteBand (42px Display), AboutRow.bio.h3 (44px), osv. — ikke `var(--t-h1)`. Denne change endrer kun tokens og /styleguide som faktisk bruker dem. Forside-fontene er Change 2's bord (per mandatet: "Definert i tokens, ikke per komponent" gjelder *tokens*; forsiden-spesifikke fontstørrelser fikses i Change 2 hvor de hører til).

### D4. `--chaos`-verdier på hvert breakpoint

**Valg:**
- Desktop (≥768px): `--chaos: 1` (full collage-energi).
- Tablet (480–767px): `--chaos: 0.4` (rolig — rotasjoner reduseres til ~40%).
- Mobil (<480px): `--chaos: 0.15` (nesten rett, men *ikke* 0 — vi vil at en hilsende rotasjon fortsatt skal være synlig).

**Hvorfor disse tallene:**
- Mandatet ber Code foreslå og Geir finjustere i nettleser. Disse er utgangspunkt.
- 0.4 holder StuaPreview-rotasjonen (-0.8°) på ~-0.32° — knapt merkbar, men ikke flat.
- 0.15 holder en -7° CornerStamp på ~-1°. Synlig som hilsen, ikke som skranke.
- 0 ville gjøre forsiden flat — bryter "behold collage-sjelen".

Disse vinner uansett over fall-back-en `var(--chaos, 1)` i komponentene. Default `1` kommer fortsatt fra `:root` i globals; media queries overstyrer på samme selektor.

### D5. Hvor lever responsive overrides — tokens.css eller globals.css?

**Valg:**
- **Breakpoint-konstanter + clamp-tokens** i `tokens.css` (de er definisjoner, hører til tokens).
- **`--chaos`-media-queries** i `globals.css` (de er kaskade-overrides, hører til den globale stylesheet-en som allerede setter `--chaos` initialt).

**Hvorfor splitten:** `tokens.css` skal være redigerbar av Geir uten å snakke om kaskade-orden. Media queries i tokens ville blandet "verdier" med "betingelser". `globals.css` har allerede `--chaos: 1` og er det stedet hvor cascade-regler hører hjemme. Holder grensen ryddig.

### D6. RESPONSIVE.md — innhold og lokasjon

**Valg:** Lages som `src/styles/RESPONSIVE.md`, ved siden av `tokens.css`. Korte seksjoner:

1. **Breakpoints** — tabell med navn, px-verdi, hva som skjer der.
2. **`--chaos`-skalaen** — verdiene per breakpoint og forklaring av forplantning.
3. **Typografi-strategi** — `clamp()` for mega-tier, faste verdier for body-tier, hvorfor.
4. **Grid-kollaps-prinsipp** — 12 → 2 → 1, med en referanse til Change 2 som anvender det på forsiden.
5. **Hvordan E2+ følger oppskriften** — sjekkliste: bruk tokens, ikke hardkod heading-fontstørrelser i px, ikke innfør parallell rotasjons-styring, ikke bruk DOM-`order`-hacks for stabling.

**Hvorfor `src/styles/`:** Adjacent til `tokens.css` slik at en utvikler som åpner tokens for å redigere ser dokumentet. `01-DESIGN-SYSTEM.md` ligger i GRIM (utenfor repoet) og bruker handoff-tonen — vi vil ha en repo-lokal, oppdaterbar versjon.

### D7. Shared-komponent-inspeksjon

**Valg:** Inspeksjon, ikke proaktiv refaktorering. Hver komponent åpnes og sjekkes for:
- Hardkodede `width`/`max-width` i px som ikke krymper.
- Fixed `font-size` over 24px (potensielt sprengning på mobil).
- Manglende `flex-wrap` på flex-rader.

**Forventet utfall (preliminær):** Ingen fix nødvendig. Shared-komponentene bruker padding/inline-flex/grid med `auto-fit`/`minmax()` allerede. Hvis inspeksjonen avdekker noe, dokumenteres minimale fix.

Konkret sjekk-liste:
- `VisitorCounter` — inline-flex med padding. ✓
- `UnderConstructionBanner` — full bruker flex med gap; vurder `flex-wrap: wrap` hvis bannerinnholdet på 380px overflower (lite sannsynlig — det er korte segmenter).
- `WebringWidget` bar — flex med `margin-left: auto`. På 380px kan radens innhold knekkes — vurder `flex-wrap: wrap` eller media-query-skjul av members-tellingen.
- `WebringWidget` card — max-width ikke satt, men padding er moderat. Lenkene under (FORRIGE/ring/NESTE) er korte. Forventet OK.
- `WebringWidget` stamp — inline-flex, korte segmenter. ✓
- `GuestbookSnippet` cards — `repeat(auto-fit, minmax(180px, 1fr))`. Allerede responsivt. ✓
- `StatusBadge` — liten badge. ✓
- `Stamp` — inline-block med padding. ✓
- `ImagePlaceholder` — width/height styrt av prop. På forsiden brukes med fixed px (AboutRow). Det er forside-side-effekt; placeholderen selv er fleksibel. ✓
- `HalftoneBlock` — SVG med fixed prop-dim. Brukes som dekor. På smal skjerm kan det stikke ut av container. Forsiden kan klippe via `overflow: hidden`. ✓ (placement-problem er forside-bord)

Eneste sannsynlige fix: `WebringWidget` bar-variant trenger `flex-wrap: wrap` for å unngå overflow på smal skjerm. Inkluderes i task 4 med kommentar.

### D8. Verifikasjon via /styleguide

**Valg:** /styleguide er allerede vår review-flate. Etter Change 1:
- Tokens-seksjonens type-skala-sample (som bruker `var(--t-h1)` osv. via inline `style={{ fontSize: "var(--t-mega)" }}`) skal skalere flytende ved å endre browser-bredde.
- Komponent-seksjonens roterte demoer (Stamp, GuestbookSnippet cards) skal dempes hvis du krymper viewporten under 768px.

Ingen ny styleguide-seksjon kreves. Dette er additivt: eksisterende demoer reagerer automatisk via tokens + `--chaos`.

## Risks / Trade-offs

- **[Risk] `clamp()` på heading-tokens kan endre desktop-rendering hvis viewport-bredden faktisk er mindre enn 1280px (f.eks. på en laptop med 1366px viewport-bredde — 7vw der = 95.6px → clamp returnerer 88px max, så uendret; men 7vw på 1200px = 84px < 88px → clamp returnerer 84px, ikke 88px)** → Mitigation: Justere vw-verdiene slik at de "klikker" til max ved en realistisk laptop-bredde (~1200px). For `--t-h1`: `7vw * 1200 = 84` — under 88. Endrer `7vw` til `7.5vw` (= 90 på 1200 → max). Eller bare aksepter at små headinger på 1200px-laptops blir litt mindre — det er "ner skalerer som forventet", ikke en feil. Dokumentert i RESPONSIVE.md.
- **[Risk] Forside-fontene (Megabox 124px) er hardkodet og påvirkes IKKE av token-clamp** → Mitigation: Dette er bevisst i Change 1. Megabox' 124px sprenger på mobil — det er Change 2 sitt bord. Inntil da: forside-mobil ser fortsatt halvbroken ut for hero, men resten dempes via `--chaos`. Akseptert mellom-tilstand.
- **[Risk] WebringWidget bar med `flex-wrap: wrap` kan se rart ut på dempet tablet-bredde (380–768)** → Mitigation: Wrap er greit fallback; den blir litt høyere men ikke sprengt. Geir kan finjustere i Change 2 hvis fotmen vil ha mer kontroll.
- **[Risk] `0.98px` i max-width-verdier kan introdusere en 1px-overlapp på enheter med half-pixel device-pixel-ratios** → Mitigation: Bruker både `max-width: 767.98px` og er forberedt på at sub-pixel-rendering kan gi mikrooverlapp. I praksis ingen feil.
- **[Risk] Tokens-modifikasjonen bryter "ordrett kopi fra handoff"-kravet** → Mitigation: MODIFIED det requirement i design-system-spec: kravet om at variabelnavn er låst beholdes; verdiene tillates å være clamp()-uttrykk for heading-tier. RESPONSIVE.md dokumenterer avviket.

## Migration Plan

Brownfield. Roll-back er `git revert` av implementeringscommit. Ingen data, ingen DB-effekt. Sekvens:

1. Oppdater `tokens.css`: add breakpoint-konstanter + konverter heading-tokens.
2. Oppdater `globals.css`: legg til `--chaos`-media queries.
3. Inspeksjon av shared-komponenter; minimal fix (forventet kun WebringWidget bar) hvis trengs.
4. Skriv `src/styles/RESPONSIVE.md`.
5. Verifisering: /styleguide rendrer riktig på desktop og leser fortsatt på 480px og 380px (Chrome DevTools-resize).

## Open Questions

- **Eksakte clamp-vw-verdier**: Forslagene (`2.5vw`, `4vw`, `7vw`, `12vw`) er utgangspunkt. Geir bør finjustere i nettleser etter visuell vurdering — kan oppdateres uten å bryte spec-kontrakten.
- **`WebringWidget` bar `flex-wrap`** — gjøres som forventet fix, men kan rulles tilbake hvis Geir foretrekker noe annet (f.eks. skjule members-tellingen under 480px).
- **Trenger /styleguide en eksplisitt "responsive demo"-seksjon?** Forslag: nei, eksisterende demoer skalerer automatisk. Kan legges til i et senere mandat hvis behovet vokser.
