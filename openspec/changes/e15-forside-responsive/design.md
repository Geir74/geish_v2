## Context

`e15-responsive-tokens` etablerte primitivene i `src/styles/tokens.css` (clamp på heading-tokens, breakpoint-konstanter), `src/app/globals.css` (`--chaos`-overrides ved 768 og 480px), og `RESPONSIVE.md`-oppskriften. Geir bekreftet at /styleguide ser riktig ut og at mega-tekst skalerer. Forsiden er fortsatt på "Change 1's mellom-tilstand": hardkodede mega-fontstørrelser og 12-kolonners grid uten breakpoints.

Konkrete pain points fra Geirs visuelle review:
- **Megabox** har `font-size: 124px` (Bungee). På 380px viewport flyter teksten ut.
- **AboutRow** photo-kollasj er absolute-positionert med px-koordinater fra `PHOTO_LAYOUT`-tabellen. På smal container klumper photos oppå hverandre.
- 12-kolonners gridet i `page.module.css` har faste `grid-column`-spenn (`1 / span 8`, `9 / span 4` osv.) som ikke har media-query-overrides.

Andre hardkodede mega-sizes i forside-seksjonene (PullquoteBand 42, AboutRow.bio.h3 44, BlogStrip 32, ProjectsRow 30, ManifestCut 36, IntroNote 28) har samme problem på smal skjerm — bare mindre dramatisk enn Megabox.

**Premisser:**
- `RESPONSIVE.md` er autoritativ: breakpoints (768, 480px), `--chaos`-skalaen, "grid-kollaps 12 → 2 → 1", DOM-rekkefølge = leserekkefølge (ingen `order`-hacks).
- Desktop ≥768px skal være pixel-identisk med dagens E1. Endringer er additive overrides ved smalere widths.
- Minimal TS-endring kun i `AboutRow/index.tsx` (bytte fra inline positions+dimensions til CSS-variabler). Ingen andre forside-komponenter endrer TS. Ingen client-side breakpoint-deteksjon.
- Forbudslisten §8 gjelder på alle breakpoints.

## Goals / Non-Goals

**Goals:**
- Forsiden er lesbar fra 320px og opp.
- Mega-fonter skalerer flytende uten "store i springs" — `clamp()` over `font-size:Xpx + media query overrides`.
- 12-kolonners gridet kollapser i to trinn med fornuftige pairings ved mid-breakpoint.
- AboutRow foto-kollasj fungerer på narrow uten å klumpe — collage-essensen bevart.
- Desktop helt uendret.

**Non-Goals:**
- Endringer i shared-komponenters API (ImagePlaceholder, HalftoneBlock osv.). AboutRow får en isolert TS-endring (CSS-vars + egen photo-render), men shared-laget røres ikke.
- `useMediaQuery` eller client-side breakpoint-deteksjon.
- Endringer i `tokens.css`, `globals.css`, shared-komponenter, content-modulet.
- En egen mobil-mockup-perfeksjonering — sikt på "lesbar og collage-aktig", ikke pixel-perfekt mot et bilde som ikke finnes.
- Justere `--chaos`-verdier (Change 1's bord).

## Decisions

### D1. Font-strategi per seksjon: lokal `clamp()` over `var(--t-XXX)`

**Valg:** De fleste forside-headings får sin egen `clamp(min, vw, max)` i sin egen `.module.css`. Token brukes der seksjonens ønskede max-verdi matcher token-skalaen eksakt.

| Seksjon | Property | Før (desktop) | Etter |
|---------|----------|---------------|-------|
| Megabox | `.h1 font-size` | `124px` | `clamp(56px, 10.5vw, 124px)` |
| ManifestCut | `.h2 font-size` | `36px` | `clamp(24px, 3.2vw, 36px)` |
| PullquoteBand | `.q font-size` | `42px` | `clamp(24px, 3.8vw, 42px)` |
| AboutRow | `.h3 font-size` | `44px` | `clamp(28px, 3.9vw, 44px)` |
| BlogStrip | `.h3 font-size` | `32px` | `clamp(22px, 2.9vw, 32px)` |
| ProjectsRow | `.h3 font-size` | `30px` | `clamp(20px, 2.6vw, 30px)` |
| IntroNote | `.hello font-size` | `28px` | `var(--t-h3)` |
| StuaPreview | `.h3 font-size` | `22px` | uendret |
| GuestbookGrid | `.h3 font-size` | `18px` | uendret |
| Trio | `.h4 font-size` | `22px` | uendret |

**Hvorfor lokal clamp framfor token:**
- `--t-mega` har max 144px; Megabox vil ha max 124px. Å bruke tokenet ville endret desktop. Lokal clamp beholder 124.
- Samme for ManifestCut 36 (mellom `--t-h3` 28 og `--t-h2` 48), AboutRow 44 (mellom `--t-h2` 48 og `--t-h3` 28), osv. Hver seksjon har en bevisst desktop-størrelse som ikke matcher token-skalaen — det er per-seksjon-tuning, ikke en feil.
- IntroNote .hello er eksakt 28px = `--t-h3`. Token-bruk her holder oss DRY og dokumenterer at "denne størrelsen er fra skalaen".

**Hvorfor klem til samme `(min, vw, max)`-mønster:**
- Konsistent vw-koeffisient-strategi: max kicker in ved ~1280px (vw% × 12.8 ≥ max). 
- Min er valgt for å være lesbar på 380px viewport (40+ px for h1-tier, 24+ for h2-tier, 20+ for h3-tier).
- Holder oppførselen forutsigbar og dokumentert i RESPONSIVE.md-sjekklisten.

**Alternativer vurdert:**
- Definere flere tokens (`--t-megabox`, `--t-pullquote`): Skalerer dårlig — hver seksjon ville hatt en token. Avvist.
- Skifte ut hardkodede sizes med `font-size: var(--font-size-mega-headline)` osv. og definere variablene per seksjon-modul: Bare omskriving. Avvist.
- Override font-size i media queries i stedet for clamp: Trinnvise sprang, mindre myk lesing. Avvist (mandatet foretrekker flytende).

### D2. Grid-kollaps: 12 → 2 → 1 med eksplisitte pairings ved mid

**Valg:** `src/app/page.module.css` får to media queries som overskriver `grid-template-columns` og hver seksjons `grid-column`/`grid-row`-plassering:

```css
/* Desktop, ≥ 768px — uendret. */
.grid { grid-template-columns: repeat(12, 1fr); ... }
.grid > .megabox { grid-column: 1 / span 8; grid-row: span 4; }
/* ... osv. for alle 13 seksjoner ... */

/* Tablet 480-767px: 2 kolonner med naturlige pairings. */
@media (max-width: 767.98px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: auto;  /* lar seksjonen ha sin egen høyde */
  }
  .grid > .megabox       { grid-column: 1 / span 2; grid-row: auto; }
  .grid > .cornerStamp   { grid-column: span 1;     grid-row: auto; }
  .grid > .introNote     { grid-column: span 1;     grid-row: auto; }
  .grid > .manifestCut   { grid-column: 1 / span 2; grid-row: auto; }
  .grid > .stuaPreview   { grid-column: span 1;     grid-row: auto; }
  .grid > .guestbookGrid { grid-column: span 1;     grid-row: auto; }
  .grid > .projectsRow,
  .grid > .pullquoteBand,
  .grid > .aboutRow,
  .grid > .trio,
  .grid > .blogStrip,
  .grid > .footerRow,
  .grid > .copyright     { grid-column: 1 / span 2; grid-row: auto; }
}

/* Mobil < 480px: 1 kolonne, alt stables. */
@media (max-width: 479.98px) {
  .grid { grid-template-columns: 1fr; }
  .grid > * { grid-column: 1; grid-row: auto; }  /* unngå span 2 → fall til 1 */
}
```

**Pairings ved mid:**
- Megabox: full bredde (hero).
- CornerStamp + IntroNote: 1+1 i én rad (begge små).
- ManifestCut: full bredde (text-heavy, breathes better wider).
- StuaPreview + GuestbookGrid: 1+1 per mandatet "Stua + gjestebok side om side".
- Alle andre (ProjectsRow, PullquoteBand, AboutRow, Trio, BlogStrip, FooterRow, Copyright): full bredde.

**Hvorfor `grid-auto-rows: auto` i media-query:** Desktop bruker `grid-auto-rows: minmax(40px, auto)` for å holde minst-størrelse på celler — det er nyttig for collage-overlapps på desktop. På smal skjerm vil vi at hver seksjon skal være så høy som innholdet krever, så `auto` er bedre.

**Hvorfor `grid-row: auto` overrider på alle:** Desktop har `grid-row: span N` på seksjonene for høyde-pairings. På mid breakpoint vil vi at hver seksjon skal stå alene (eller paret horisontalt) uten span-N. Setting `auto` overstyrer det.

**Alternativer vurdert:**
- Bruke `order`-CSS-property for stabling: Bryter mandatets "DOM-rekkefølge = leserekkefølge". Avvist.
- Bare ett kollaps-trinn (1 col under 768px): Mister mellomtrinnet. Mandatet vil ha 12 → 2 → 1. Avvist.
- `grid-template-areas` med navngitte cellr: Mer verbost, ikke verdt det for 13 seksjoner. Avvist.

### D3. Internal grid-kollaps i seksjoner

**Valg:** Hver seksjon med intern multi-col-grid får media query-overrides i sin egen `*.module.css`. Konkret:

- **ProjectsRow** `.grid5: repeat(5, 1fr)`:
  - ≥768px: 5 kolonner.
  - 480–767px: `repeat(3, 1fr)` — 5 cards i 3 kolonner = 3+2.
  - <480px: `repeat(2, 1fr)` — 5 cards i 2 kolonner = 2+2+1.
- **Trio** `.wrap: repeat(3, 1fr)`:
  - ≥768px: 3 kolonner.
  - 480–767px: `repeat(2, 1fr)` — TIL + Lab i én rad, Endringslogg på neste (wrapper).
  - <480px: `1fr` — alle stablet.
- **BlogStrip** `.grid3: repeat(3, 1fr)`:
  - ≥768px: 3 kolonner.
  - 480–767px: `repeat(2, 1fr)`.
  - <480px: `1fr`.
- **AboutRow** `.wrap: 1.2fr / 1fr` (bio | photos):
  - ≥768px: uendret.
  - <768px: `1fr` (stablet). Photos under bio.
- **FooterRow** `.row: auto 1fr auto`:
  - ≥768px: 3-col som nå.
  - <768px: `1fr`, items stablet vertikalt med `gap: var(--sp-5)`. Justeringer (justify-self) overstyres til center.

**Hvorfor i seksjonens egen modul:** Inner grid er en del av seksjonens komposisjon, ikke forsidens layout. Holder ansvaret riktig fordelt.

### D4. AboutRow photo-kollasj — CSS-variabler + AboutRow-eid photo-placeholder

**Valg:** AboutRow slutter å bruke `<ImagePlaceholder>` for bio-kollasjen og rendrer sine egne photo-placeholders inline. CSS Module er da kilden til all styling (posisjon, dimensjoner, tape, stripe-pattern, label) uten å konkurrere med inline-styles eller `!important`.

**Begrunnelse:** Med inline-styles fra `<ImagePlaceholder>` ville en CSS Module override krevd `!important` eller en descendant-selektor som teller DOM-nivåer inn i delkomponenten — begge er fragile koblinger. Ved å eie photo-placeholderen lokalt slipper AboutRow ut av denne avhengigheten. Cost: ~20 linjer duplikert CSS (stripe + tape + label) i AboutRow.module.css. Akseptabelt — kollasje-layouten er forside-spesifikk i utgangspunktet og deler ikke API-overflate med andre placeholders (styleguide bruker fortsatt `<ImagePlaceholder>` slik den er).

**TS-endringer i `AboutRow/index.tsx`:**
- Stopp å rendre `<ImagePlaceholder>` per photo. Render i stedet AboutRows egne elementer:
  ```tsx
  <div key={p.label} className={styles.photo} style={photoStyle}>
    <span className={styles.tape} aria-hidden />
    <div className={styles.box}>[{p.label}]</div>
  </div>
  ```
- Setter alle dimensjons- og posisjons-felt som CSS-variabler på `.photo`-wrapperen via `style`:
  ```ts
  const photoStyle = {
    "--photo-top": slot.top !== undefined ? `${slot.top}px` : "auto",
    "--photo-left": slot.left !== undefined ? `${slot.left}px` : "auto",
    "--photo-right": slot.right !== undefined ? `${slot.right}px` : "auto",
    "--photo-bottom": slot.bottom !== undefined ? `${slot.bottom}px` : "auto",
    "--photo-w": `${slot.width}px`,
    "--photo-h": `${slot.height}px`,
    "--rotation": slot.rotate,
  } as CSSProperties;
  ```
- ImagePlaceholder-importen kan beholdes (brukes ikke lenger i AboutRow, men ingen lint-feil siden vi bare fjerner bruken). Fjern importen for renslighet.

**CSS-endringer i `AboutRow.module.css`:**

Desktop (uendret oppførsel, ny implementering):
```css
.photos {
  position: relative;
  height: 100%; /* slik som før, så absolute-children kan plasseres */
}

.photo {
  position: absolute;
  top: var(--photo-top);
  left: var(--photo-left);
  right: var(--photo-right);
  bottom: var(--photo-bottom);
  width: var(--photo-w);
  height: var(--photo-h);
  /* --rotation lagres som tall, multipliseres med --chaos. */
  transform: rotate(calc(var(--rotation, 0) * 1deg * var(--chaos, 1)));
  border: 2px solid var(--ink);
  background-image: repeating-linear-gradient(
    135deg,
    var(--paper-warm) 0 6px,
    var(--paper-edge) 6px 7px
  );
  box-shadow: 3px 3px 0 var(--ink);
}

.tape {
  /* Photo-tape: semitransparent gul stripe på toppen, rotert litt. */
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%) rotate(calc(-3deg * var(--chaos, 1)));
  width: 50px;
  height: 14px;
  background: oklch(94% 0.08 80 / 0.75);
  border: 1px solid oklch(80% 0.06 80 / 0.6);
  z-index: 2;
}

.box {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--ink-soft);
}
```

Media queries (uten `!important` siden alt CSS-Module-eid):
```css
@media (max-width: 767.98px) {
  .photos {
    position: static;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--sp-3);
    height: auto;
    margin-top: var(--sp-4);
  }
  .photo {
    position: static;
    /* Overskriv var-baserte dimensjoner — CSS-Module-regelen vinner siden
       det ikke finnes inline-style for width/height på .photo lenger. */
    width: 100%;
    height: 120px;
  }
}

@media (max-width: 479.98px) {
  .photos {
    grid-template-columns: 1fr;
  }
  .photo {
    height: 100px;
  }
}
```

**Hvorfor egen photo-placeholder framfor å utvide `<ImagePlaceholder>`:**
- ImagePlaceholders API (`w`, `h`, `label`, `tape`, `rotate`) er pent og brukes uendret i `/styleguide`. Å endre defaultene eller legge til "stretch"-modi ville utvidet et bibliotek for én spesifikk caller.
- AboutRows photo-kollasj har en spesifikk visuell oppskrift (4 photos, eksakt posisjon, photo-tape sentrert på toppen) — den er en kollasje, ikke en generisk placeholder. Å rendre den lokalt matcher fakta.
- Stripe-pattern og tape duplikeres i ~10 linjer CSS. Ikke verdt en abstrahering for én caller.

**Hvorfor ikke `useMediaQuery` / client-side branching:**
- Non-goal: ingen client-side breakpoint-deteksjon. Holder seksjonen som server component.
- CSS Modules + media queries gir alt vi trenger.

**Rotasjon:** `--rotation` settes som tall (ikke deg) på `.photo`. CSS Module multipliserer med `1deg * var(--chaos, 1)`. Forplanter chaos-skaleringen fra Change 1 automatisk. Tape får sin egen statiske `-3deg`-rotasjon multiplisert med `--chaos`.

**Alternativer vurdert:**
- `!important` + descendant `.photo > div > div` (forrige plan): Avvist per Geirs guidance — for fragile, dårlig kommunisert intent.
- Utvide `<ImagePlaceholder>` med `h?: string | number` og fjerne defaults: Endrer en shared-API for en isolert use-case. Avvist.
- Legge til en "stretch"-prop på `<ImagePlaceholder>`: Samme problem — egen-spesifikk modus på en delkomponent.
- AboutRow eier sin egen placeholder: Valgt. Litt CSS-duplikasjon mot full kontroll og null !important.

### D5. Megabox-headline: linjebrudd og overflow

**Valg:** Megabox bruker `clamp(56px, 10.5vw, 124px)` på h1. Det inner-`<h1>` har eksplisitte `<br/>`-linjebrudd. På smale widths kan en `<span class="acc">CREATE</span> SHIT.` bryte i to deler (CREATE på en linje, SHIT på neste) hvis text-wrap kicker in. Det er akseptabelt — `word-break`/`overflow-wrap` lar lange ord brytes.

Megabox har `overflow: hidden` på `.box`, så halftone-dekor stikker ut og klippes. Ingen overflow-bekymring der.

På narrow viewport (<480px) blir h1 ca. `clamp(56, 12vw, 124)` = max(56, 12vw=45.6 på 380) = 56px. Bungee 56px på 380px viewport får 6-7 tegn per linje. "GROUNDED," på én linje krever ~8 tegn. Akseptabelt — kan brytes hvis nødvendig, eller hver streng kan stå alene per `<br/>` i JSX.

**Action:** Ikke endre JSX. Bare CSS. Hvis Geir vil ha mer mobil-tuning av Megabox-linjebrudd, gjøres det i en senere change.

### D6. Forholdet til Change 1's `--chaos`-skalering

**Valg:** Change 1 dempet `--chaos` til 0.4 (tablet) og 0.15 (mobil). Denne change endrer ikke `--chaos`. Alle rotasjoner i forsiden bruker `var(--chaos, 1)`, så dempingen forplanter seg automatisk når vi kollapser gridet. Ingenting ekstra trengs.

**Verifikasjon:** Hvis en seksjon på narrow viewport viser rotasjon som matcher desktop-grader, betyr det at `--chaos` ikke er aktivert eller komponenten ikke bruker den. Sjekkes i task 6.

### D7. Internal tape-/halftone-fix

**Valg:** Inspeksjon ved smal skjerm, fiks bare det som klumper.

- **ManifestCut tape** (`top: -10px; left: 30px;` og `right: 30px;`): Anchored relativt til wrapper. Skalerer med wrapper-bredde. OK.
- **StuaPreview tape** (`top: -10px; left: 50%; translateX(-50%)`): Sentrert, skalerer. OK.
- **Megabox halftone-deco** (`right: -16px; bottom: -16px;`): Anchored, klippes av `overflow: hidden`. OK.
- **PullquoteBand halftone-dekor** (`left: -10px; top: -10px;` og `right: -20px; bottom: -20px;`): Samme, klippet av `overflow: hidden`. OK.
- **AboutRow photo-tape** (i hver ImagePlaceholder med `tape={true}`): Tape sentrert på toppen av photo-bilde. Photo-bildet er nå normal-flow på narrow widths, så tape bare flyter med. OK.

Konklusjon: ingen ekstra tape-/halftone-fix utover AboutRows photo-kollasj-rewrite (D4).

## Risks / Trade-offs

- **[Risk] AboutRow eier sin egen photo-placeholder-implementasjon (duplikat-CSS med ImagePlaceholder)** → Mitigation: Duplikasjonen er ~10 linjer (stripe-pattern + tape). Kollasje-layouten er forside-spesifikk i utgangspunktet og deler ikke API-overflate med andre placeholders. Akseptabel kost for full kontroll og null `!important`.
- **[Risk] Tablet-pairings (CornerStamp+IntroNote, StuaPreview+GuestbookGrid) gir ujevn høyde der den ene er tomere enn den andre** → Mitigation: `grid-auto-rows: auto` og hver seksjon har sin egen height; ujevne høyder er akseptable som collage-effekt. Hvis det skurrer kan Geir justere padding senere.
- **[Risk] ProjectsRow med `repeat(5, 1fr)` blir veldig smale cards på narrow desktop (~770px)** → Mitigation: 480-767px får 3 kolonner. Cards blir 200px brede med padding — fortsatt lesbar mono+typewriter. På desktop er card-bredde ~150px ved 1280px — det er allerede mockup-default.
- **[Risk] Trio-overgang 3→2+1 betyr at den mørke Endringslogg-kolonnen vandrer fra "sist" til "alene under" på mid-breakpoint** → Mitigation: DOM-rekkefølge er TIL, Lab, Changelog — det er det leser ser. Visuelt vekt-på-bunnen-prinsippet (per 02-PAGES designnote) blir litt brutt på mid, men ikke ødelagt — Endringslogg er fortsatt sist, bare under en rad i stedet for til høyre.
- **[Risk] Megabox h1 på 320px viewport kan fortsatt være for stor selv med 56px min** → Mitigation: 56px Bungee på 320px gir ~5-6 tegn per linje, og "STAY" / "GROUNDED," / "CREATE SHIT." passer akkurat. Hvis Geir vil ha enda smalere min: justeres uten å bryte spec.
<!-- (descendant-selektor-risikoen er ikke lenger relevant — AboutRow eier sin egen placeholder.) -->

## Migration Plan

Brownfield. Roll-back er `git revert` av implementeringscommit. Ingen data, ingen DB-effekt. Sekvens:

1. Konverter hardkodede font-sizes i 7 forside-seksjoner (Megabox, ManifestCut, PullquoteBand, AboutRow, BlogStrip, ProjectsRow, IntroNote).
2. Legg til grid-kollaps-media queries i `page.module.css`.
3. Legg til internal grid-kollaps-media queries i seksjonene som har dem (ProjectsRow, Trio, BlogStrip, AboutRow, FooterRow).
4. AboutRow photo-kollasj-fix (`!important`-overrides ved <768px og <480px).
5. Verifisering: tsc rent, dev-server starter, `/` viser samme på desktop og er lesbar på 380/600/768.

## Open Questions

- **Eksakte clamp-vw-koeffisienter** — som i Change 1, dette er smaks-dials Geir kan finjustere i nettleser. Forslagene er utgangspunkt.
- **Tablet-pairings** — `CornerStamp + IntroNote` og `StuaPreview + GuestbookGrid` er foreslått. Hvis Geir foretrekker andre pairings (f.eks. `ManifestCut + GuestbookGrid`), kan det enkelt byttes i page.module.css.
<!-- (Avklart: AboutRow eier sin egen photo-placeholder — TS-endring for CSS-variabler er en del av planen.) -->
- **Trio mid-breakpoint 2+1 vs. 3-kolonner med justert font-størrelse** — Forslag: 2+1 fordi Trio's interne `font-size: 13px` allerede er tett. Geir kan reviewe i nettleser.
