## MODIFIED Requirements

### Requirement: 8 shared-komponenter portet til React + CSS Modules

Prosjektet SHALL ha følgende komponenter under `src/components/shared/`, hver i sin egen mappe med `index.tsx` (TypeScript) og `*.module.css`:

1. **`VisitorCounter`** — props: `count: string`, `label?: string`, `size?: "sm" | "md" | "lg"`. Sort boks, oransje LED-siffer i mono-font.
2. **`UnderConstructionBanner`** — props: `compact?: boolean`, `text?: string`. Blinkende banner med gul/cream-stripemønster.
3. **`WebringWidget`** — props: `variant?: "bar" | "card" | "stamp"`, samt eksplisitte tekstprops (ingen `window.t()`). Tre varianter via `data-variant`-attributt.
4. **`GuestbookSnippet`** — props: `items: Array<{ who: string; when: string; msg: string }>`, `style?: "list" | "cards"`. Default-items er 3 dummy-innlegg.
5. **`StatusBadge`** — props: `status: "live" | "wip" | "idea"`. Tekst-label (`LIVE` / `WIP` / `IDÉ`), aldri emoji.
6. **`Stamp`** — props: `rotate?: number` (grader), `size?: number` (font-size px), `children: ReactNode`. Rødt gummistempel-look.
7. **`ImagePlaceholder`** — props: `label?: string`, `w?: string | number`, `h?: number`, `tape?: boolean`, `rotate?: number`. Stripet placeholder med klammeparentes-label.
8. **`HalftoneBlock`** — props: `w?: number`, `h?: number`, `density?: number` (0..1), `color?: string` (CSS-fargestreng for prikkene; default `var(--ink)`). SVG-prikkmønster som dekor.

Alle komponenter MUST:
- Eksportere et navngitt TypeScript-interface for props.
- Bruke CSS Modules for all styling (ingen inline `style`-attributt utenom å sette CSS-variabler som `--rotation`, `--halftone-fill`).
- Bruke `var(--chaos, 1)` for rotasjons-multiplikatorer.
- Følge forbudslisten i `01-DESIGN-SYSTEM.md` §8.

En barrel-eksport `src/components/shared/index.ts` MUST re-eksportere alle 8 komponenter.

#### Scenario: alle 8 komponenter eksisterer
- **WHEN** `ls src/components/shared/` kjøres
- **THEN** mappene `VisitorCounter`, `UnderConstructionBanner`, `WebringWidget`, `GuestbookSnippet`, `StatusBadge`, `Stamp`, `ImagePlaceholder`, `HalftoneBlock` finnes, hver med en `index.tsx` og en `*.module.css`

#### Scenario: barrel-eksport fungerer
- **WHEN** en fil importerer `import { Stamp, StatusBadge } from "@/components/shared"`
- **THEN** TypeScript kompilerer uten feil og begge komponenter er tilgjengelige

#### Scenario: HalftoneBlock med color-prop overstyrer default-fill
- **WHEN** `<HalftoneBlock color="oklch(85% 0.08 80)" />` rendres
- **THEN** SVG-prikkene har `fill` lik den oppgitte fargen, ikke `var(--ink)`

#### Scenario: HalftoneBlock uten color-prop bruker default
- **WHEN** `<HalftoneBlock />` rendres uten `color`
- **THEN** SVG-prikkene har `fill: var(--ink)` (default fra modulen)

#### Scenario: ingen Tailwind-utility-klasser i komponentene
- **WHEN** `grep -r "className=\"[a-z]*-[a-z]*-[a-z]*\"" src/components/shared/` kjøres
- **THEN** treff er kun på CSS Modules-genererte klassenavn, ikke Tailwind-utilities som `bg-gray-500` eller `text-sm`
