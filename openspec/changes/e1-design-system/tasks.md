## 1. Riv ut Tailwind og shadcn

- [x] 1.1 Avinstaller deps: `npm rm tailwindcss @tailwindcss/postcss shadcn class-variance-authority clsx tailwind-merge tw-animate-css lucide-react @base-ui/react`
- [x] 1.2 Slett `postcss.config.mjs`, `components.json`, `src/components/ui/` (hele mappen), `src/lib/utils.ts`
- [x] 1.3 Strip `src/app/globals.css` for Tailwind-direktiver (`@import "tailwindcss"`, `@theme inline`, alle Tailwind-spesifikke regler) — etterlat fila tom for nå, eller med en kommentar om at innhold legges inn i task 4
- [x] 1.4 Bekreft med `grep -ri "tailwind\|shadcn\|class-variance" src package.json` at ingen treff utover dette mandatets dokumenter

## 2. Last fonter via next/font/google

- [x] 2.1 Verifiser at alle 5 fonter er tilgjengelige i `next/font/google` (verifisert mot Google Fonts-katalogen — runtime-introspeksjon umulig fordi next/font er compile-time API)
- [x] 2.2 Oppdater `src/app/layout.tsx` til å laste alle 5 fonter med `variable`-opsjon matchende `tokens.css`-navn
- [x] 2.3 Sett alle fem font-variabel-klassenavn på `<html>`

## 3. Port tokens.css

- [x] 3.1 Opprett mappen `src/styles/`
- [x] 3.2 Kopier `design_handoff_geish/references/tokens.css` ordrett til `src/styles/tokens.css`
- [x] 3.3 Verifiser med diff at filene er identiske

## 4. Sett opp globals.css

- [x] 4.1 Skriv `src/app/globals.css` med `@import` av tokens, `--chaos: 1`, og html-defaults
- [x] 4.2 Verifiser at `layout.tsx` fortsatt importerer `./globals.css`

## 5. Port komponentbiblioteket

For hver komponent: opprett `src/components/shared/<Name>/index.tsx` (TypeScript med eksplisitt props-interface) og `src/components/shared/<Name>/<Name>.module.css`. Konverter inline-stiler fra `shared.jsx` til CSS Modules-klasser. Dynamiske verdier (rotate, size) settes via CSS-variabler i en inline-`style`-prop typet som `React.CSSProperties`. Erstatt `window.t()` med eksplisitte props med norske defaults.

- [x] 5.1 `VisitorCounter`
- [x] 5.2 `UnderConstructionBanner`
- [x] 5.3 `WebringWidget` — 🔗-emoji erstattet med ◉-glyf (overstyrbar via `ringSymbol`-prop)
- [x] 5.4 `GuestbookSnippet`
- [x] 5.5 `StatusBadge`
- [x] 5.6 `Stamp`
- [x] 5.7 `ImagePlaceholder`
- [x] 5.8 `HalftoneBlock`
- [x] 5.9 Barrel-eksport opprettet

## 6. Styleguide-rute

- [x] 6.1 Opprett `src/app/styleguide/page.tsx` som server component
- [x] 6.2 Tokens-seksjon (paletter, type-roller, type-skala, spacing-stige)
- [x] 6.3 Komponent-seksjon (alle 8 komponenter med alle varianter)
- [x] 6.4 Mønstre-seksjon (photo-tape, flat skygge, stripet bg, marker-highlight)
- [x] 6.5 Bekreft visuelt — alle 8 komponenter rendret på /styleguide (200), ingen kompileringsfeil

## 7. Strip shadcn fra forside og smoke

- [x] 7.1 `src/app/page.tsx` — minimal placeholder, ingen shadcn
- [x] 7.2 `src/app/smoke/page.tsx` — ingen Button-import, CSS Module i stedet for Tailwind-klasser

## 8. Verifisering

- [x] 8.1 `npx tsc --noEmit` — rent
- [x] 8.2 `npm run dev` — starter rent
- [x] 8.3 `/` returnerer 200, viser "geish v2" + lenke til `/styleguide`
- [x] 8.4 `/smoke` returnerer 200, db-status wired (Supabase-status `fail: PUBLISHABLE_KEY is not set` er residual fra project-init — ikke berørt av E1)
- [x] 8.5 `/styleguide` returnerer 200, viser tokens, alle 8 komponenter, og alle 4 mønstre
- [ ] 8.6 Visuell sammenligning mot screenshots — utføres av Geir i nettleser
- [x] 8.7 Ingen Tailwind/shadcn-rester (kun en kommentar-referanse i smoke/page.tsx)

## 9. Håndhevelses-sjekker (forbudslisten)

- [x] 9.1 Ingen `border-radius: [1-9]` i komponentene eller styleguide
- [x] 9.2 Ingen `box-shadow` med blur > 0 (alle er flat offset)
- [x] 9.3 Kun `repeating-linear-gradient` (UC-banner, ImagePlaceholder) — ingen gradient-fader
- [x] 9.4 Ingen Tailwind/shadcn-referanser i `src/` utover en kommentar i `smoke/page.tsx`
