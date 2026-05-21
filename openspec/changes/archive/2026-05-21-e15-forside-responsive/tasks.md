## 1. Konverter hardkodede mega-fontstørrelser

- [x] 1.1 `Megabox.module.css` `.h1`: `124px` → `clamp(40px, 10.5vw, 124px)` (min satt til 40 — ikke 56 som først foreslått — fordi 56px Bungee gir "GROUNDED," ~250px ubrytelig, som sprenger megabox-content-area på 292px viewport)
- [x] 1.2 `ManifestCut.module.css` `.h2`: `36px` → `clamp(24px, 3.2vw, 36px)`
- [x] 1.3 `PullquoteBand.module.css` `.q`: `42px` → `clamp(24px, 3.8vw, 42px)`
- [x] 1.4 `AboutRow.module.css` `.h3`: `44px` → `clamp(28px, 3.9vw, 44px)`
- [x] 1.5 `BlogStrip.module.css` `.h3`: `32px` → `clamp(22px, 2.9vw, 32px)`
- [x] 1.6 `ProjectsRow.module.css` `.h3`: `30px` → `clamp(20px, 2.6vw, 30px)`
- [x] 1.7 `IntroNote.module.css` `.hello`: `28px` → `var(--t-h3)`

## 2. Grid-kollaps i page.module.css

- [x] 2.1 To media queries lagt til etter eksisterende seksjons-plasseringer (tablet: 2-kol med pairings, mobil: 1-kol stack)
- [x] 2.2 Norske kommentarer som forklarer pairings + at DOM-rekkefølge bevares

## 3. Internal grid-kollaps i seksjoner

- [x] 3.1 `ProjectsRow.module.css` `.grid5` — 5 → 3 → 2
- [x] 3.2 `Trio.module.css` `.wrap` — 3 → 2+1 → 1
- [x] 3.3 `BlogStrip.module.css` `.grid3` — 3 → 2 → 1
- [x] 3.4 `AboutRow.module.css` `.wrap` — 1.2fr/1fr → 1fr stablet (i samme media query som photo-kollasj-overrides)
- [x] 3.5 `FooterRow.module.css` `.row` — `auto 1fr auto` → `1fr` stablet vertikalt på <768px

## 4. AboutRow photo-kollasj — CSS-variabler + AboutRow-eid placeholder

- [x] 4.1 `AboutRow/index.tsx`: fjernet `<ImagePlaceholder>`-import, byttet til CSS-variabler (`--photo-top/-left/-right/-bottom/-w/-h/--rotation`) på `.photo`-wrapperen, og rendrer egne `.photo` + `.tape` + `.box` elementer
- [x] 4.2 `AboutRow.module.css`: nye desktop-regler (`.photos`, `.photo`, `.tape`, `.box`) leser CSS-variabler. Media queries ved <768px og <480px overstyrer uten `!important` — CSS-Module-regelen vinner siden det ikke finnes inline-style for `position/width/height` på `.photo`
- [x] 4.3 Desktop pixel-identisk: alle 4 photos har samme posisjon, dimensjoner og rotasjon som E1 (verdiene flyttet fra inline til CSS-variabler, ikke endret)

## 5. Verifisering

- [x] 5.1 `npx tsc --noEmit` rent
- [x] 5.2 `npm run dev` starter rent
- [x] 5.3 `/` returnerer 200; alle 13 seksjoner og alle 4 photo-labels (PORTRETT/HUND.JPG/VERKSTED/BRØD) rendres
- [x] 5.4 `/styleguide` returnerer 200 (uberørt — ImagePlaceholder demonstreres fortsatt der)
- [ ] 5.5 Visuell sammenligning på 380/600/768/1280px — utføres av Geir i nettleser (smaks-dialer kan finjusteres)
- [ ] 5.6 Bekreft tablet-pairings og Trio mid-breakpoint — utføres av Geir

## 6. Forbudsliste + sanity

- [x] 6.1 Ingen `border-radius > 0` i forside-komponentene eller page.module.css
- [x] 6.2 Ingen blur-skygger (alle flat offset)
- [x] 6.3 Kun `repeating-linear-gradient` (AboutRow stripe-pattern, pre-eksisterende UC-banner/ImagePlaceholder) — ingen gradient-fader
- [x] 6.4 Ingen `order`-CSS-property (DOM-rekkefølge bevart)
- [x] 6.5 Ingen hardkodede mega-sizes (124/42/44/36/32/30/28px) utenfor `clamp()`-uttrykk
- [x] 6.6 Ingen Tailwind/shadcn-referanser
- [x] 6.7 Ingen `!important` i forside-CSS (kun i kommentarer som forklarer hvorfor vi unngår det)

## 7. Overflow-fixer ved ~290px viewport (oppdaget under apply-review)

- [x] 7.1 `UnderConstructionBanner.module.css` `.full`: lagt til `flex-wrap: wrap`. Banneret er ~430px+ wide som single flex-rad; uten wrap sprengte det horisontal scroll på viewports under ~310px. Samme bug-mønster som WebringWidget bar hadde i Change 1.
- [x] 7.2 `Megabox.module.css` `.h1`: clamp min senket fra 56 → 40px. Bungee "GROUNDED," (9 tegn ubrytelig) ved 56px er ~250px wide — passet ikke i megabox-content-area på 292px viewport. 40px Bungee er ~180px og passer i ~196px content-area. Begge fixer er rotårsaker (krympbar bredde / wrap), ikke `overflow-x: hidden`-symptomfix.
- [x] 7.3 Asymmetrisk høyremargin ved ~411px (box-shadow eter visuell padding). Rotårsak: full-bredde-bokser med `box-shadow: Npx Npx 0 var(--ink)` (5px på AboutRow.bio + ProjectsRow.box, 4px på IntroNote + ManifestCut, 3px på AboutRow.photo) extender 3-5px past høyre kant via paint. På grid-padding 16px ved <480px spiser 5px-skyggen 31% av visuell høyremargin. Fikset ved å redusere shadow-offset til 2px på disse 5 boksene via media query `@media (max-width: 479.98px)`. Collage beholdt (skyggen er der, bare mindre); asymmetri redusert fra 5px til 2px (proporsjonalt OK på 16px-padding).
