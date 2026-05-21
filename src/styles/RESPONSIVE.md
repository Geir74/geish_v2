# Responsiv-strategi for Cut & Paste Zine

Kort oppskrift for hvordan zine-stilen oppfører seg på smal skjerm.
Etablert i `e15-responsive-tokens`. Følges av E2+ (blogg, Stua, gjestebok osv.).

**Premiss:** "Roligere, ikke flatere." Demp rotasjon, behold tape/skygger/halftone.
Mobil skal være lesbar uten å miste collage-sjelen.

---

## 1. Breakpoints

| Navn         | Variabel        | Px-verdi | Hva som skjer |
|--------------|-----------------|----------|---------------|
| Desktop      | (default)       | ≥ 768px  | Full collage-energi, 12-kolonners grid, alle rotasjoner. |
| Tablet       | `--bp-tablet`   | 768px    | `--chaos: 0.4`. Grid kollapser til 2 kolonner (Change 2). |
| Mobil        | `--bp-mobile`   | 480px    | `--chaos: 0.15`. Grid stables til 1 kolonne (Change 2). |

Variablene `--bp-tablet` og `--bp-mobile` er definert i `tokens.css` for
dokumentasjon og bruk i `clamp()`/`calc()`. **Media queries må bruke raw px**
— CSS-spesifikasjonen tillater ikke `var()` i `@media`-conditions.
Endrer du breakpoint-verdiene, må du også oppdatere rå-tallene i alle
media queries (start med `src/app/globals.css` og `src/app/page.module.css`).

Konvensjon: bruk `(max-width: 767.98px)` og `(max-width: 479.98px)` for å
matche tabellen over.

---

## 2. `--chaos`-skalaen

`--chaos` er en global rotasjons-multiplikator definert i `globals.css`.
Alle roterte komponenter i `src/components/shared/` og `src/components/forside/`
bruker `var(--chaos, 1)` i sine `transform: rotate(...)`-uttrykk. Endrer du
`--chaos` ett sted, dempes hele siden.

| Viewport      | `--chaos` | Eksempel: Stamp rotate=-7° |
|---------------|-----------|----------------------------|
| ≥ 768px       | `1`       | -7° (full)                 |
| 480–767px     | `0.4`     | -2.8° (rolig)              |
| < 480px       | `0.15`    | -1.05° (knapt synlig)      |

Verdiene er ikke `0` — vi vil at en hilsende rotasjon fortsatt skal være synlig.
Hvis du finner en komponent som ikke dempes som forventet: sjekk at den
faktisk bruker `var(--chaos, 1)`, ikke en hardkodet `rotate(...)`.

---

## 3. Typografi-strategi

**Mega-tier** (`--t-h3`, `--t-h2`, `--t-h1`, `--t-mega`) bruker `clamp(min, vw, max)`
i `tokens.css`. Max-verdien er dagens desktop. På ≥1280px viewport vinner max
(uendret fra E1); på smalere skjermer skalerer de jevnt ned.

**Body-tier** (`--t-meta`, `--t-small`, `--t-body`, `--t-lead`) er faste
px-verdier. 16px brødtekst er minstemålet — å skalere ned ville gjøre vondt
å lese.

**Regel for E2+:** Bruk tokens. Hardkod ikke heading-fontstørrelser i px i
en komponentmodul — da må du re-løse responsivitet hver gang. Hvis tokens
ikke passer for en spesifikk seksjon, definer en lokal `clamp()` med samme
mønster (min for 380px, max = ønsket desktop-verdi).

Forside-seksjonene i E1 hardkoder fontstørrelser (Megabox 124px, PullquoteBand
42px, osv.). Det fikses i Change 2 (`e15-forside-responsive`) der det hører
til. Ikke et generelt mønster — det er bevisst per-seksjon-tuning.

---

## 4. Grid-kollaps: 12 → 2 → 1

12-kolonners gridet i `src/app/page.module.css` kollapser i to trinn ved
breakpoints (Change 2 anvender dette på forsiden):

- **≥ 768px** — 12 kolonner, som E1. Alle seksjoner i sine `grid-column`/`grid-row`-spenn.
- **480–767px** — 2 kolonner. Seksjoner pares naturlig (f.eks. Stua + gjestebok side om side, Trio 2+1). Full bredde for hero/pullquote/blogg.
- **< 480px** — 1 kolonne. Alle seksjoner stables i leserekkefølge.

DOM-rekkefølgen i `page.tsx` MÅ være riktig for stabling. Bruk **ikke**
`order`-hacks i CSS for å oppnå stabling i en annen rekkefølge enn DOM —
det divergerer hva en utvikler ser i koden fra hva en bruker ser. Hvis
rekkefølgen er feil: omorganiser JSX-en i `page.tsx`.

---

## 5. Sjekkliste for E2+

Når du bygger en ny side (eller utvider forsiden):

- [ ] **Bruk tokens.** `var(--t-h1)` ikke `font-size: 88px`. `var(--sp-4)` ikke `padding: 16px`.
- [ ] **Bruk `var(--chaos, 1)`** på alle rotasjoner. Aldri en hardkodet `rotate(-3deg)` uten multiplikator.
- [ ] **Plasser breakpoint-overrides** i `globals.css` (siteomfattende) eller i den rute-spesifikke `*.module.css` (f.eks. `page.module.css`). **Ikke** i komponentens egen modul — komponenten skal kunne plasseres i ulike kontekster uten å bære sin egen responsivitet.
- [ ] **DOM-rekkefølge = leserekkefølge.** Stabling på mobil må følge JSX-rekkefølgen i `page.tsx`. Ingen `order`-hacks.
- [ ] **Forbudslisten gjelder på alle breakpoints.** Ingen rounded corners, ingen blur-skygger, ingen gradient-fader, ingen emoji-ikoner, ingen sans-serif body — heller ikke på mobil.
- [ ] **Test på 380px og 768px** i Chrome DevTools før du sier deg ferdig. Ingen horisontal scroll. Lesbar.
