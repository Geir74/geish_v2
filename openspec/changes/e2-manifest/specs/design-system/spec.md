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
9. **`Pullquote`** — props: `children: ReactNode`, `variant?: "quiet" | "loud"` (default `"quiet"`). Archivo Black sitat med to varianter:
   - **`quiet`** (default, blog-bruk): sentrert, ink-farget, symmetrisk double-border top/bottom, `clamp(20px, 3vw, 26px)`-skala, `max-width: 600px`.
   - **`loud`** (manifest-bruk): venstrejustert, stempel-rød tekst (`color: var(--stamp)`), italic (`font-style: italic`), hard venstre-blokk (`border-left: 10px solid var(--stamp)`), `clamp(30px, 5vw, 44px)`-skala, `max-width: 680px`. Sitatene skal rope — ikke hviske. **Italic er et bevisst design-avvik fra `01-DESIGN-SYSTEM.md` §6** ("Pullquotes er Archivo Black, ikke italic") for å gi manifest-tonen framlent-energi-i-rop. Dokumentert i CSS-kommentar for å unngå at en framtidig pass "retter" det.
   Flyttet fra `src/lib/blog/Pullquote/` i `e2-manifest` siden to ruter konsumerer den, og samtidig utvidet med variant-prop.

Alle komponenter MUST:
- Eksportere et navngitt TypeScript-interface for props.
- Bruke CSS Modules for all styling (ingen inline `style`-attributt utenom å sette CSS-variabler som `--rotation`, `--halftone-fill`).
- Bruke `var(--chaos, 1)` for rotasjons-multiplikatorer.
- Følge forbudslisten i `01-DESIGN-SYSTEM.md` §8.

En barrel-eksport `src/components/shared/index.ts` MUST re-eksportere alle 9 komponenter.

#### Scenario: alle 9 komponenter eksisterer
- **WHEN** `ls src/components/shared/` kjøres
- **THEN** mappene `VisitorCounter`, `UnderConstructionBanner`, `WebringWidget`, `GuestbookSnippet`, `StatusBadge`, `Stamp`, `ImagePlaceholder`, `HalftoneBlock`, `Pullquote` finnes, hver med en `index.tsx` og en `*.module.css`

#### Scenario: barrel-eksport fungerer for Pullquote
- **WHEN** en fil importerer `import { Pullquote } from "@/components/shared"`
- **THEN** TypeScript kompilerer uten feil og komponenten er tilgjengelig

#### Scenario: quiet er default-varianten
- **WHEN** `<Pullquote>tekst</Pullquote>` rendres uten variant-prop
- **THEN** elementet får CSS-klassen som matcher quiet (symmetrisk double-border, sentrert, ink-farget)

#### Scenario: loud overstyrer
- **WHEN** `<Pullquote variant="loud">tekst</Pullquote>` rendres
- **THEN** elementet får CSS-klassen som matcher loud (venstrejustert, stempel-rød, border-left)

#### Scenario: Pullquote eksisterer ikke lenger i lib/blog/
- **WHEN** `ls src/lib/blog/` kjøres
- **THEN** ingen `Pullquote/`-mappe finnes; komponenten er flyttet til shared

#### Scenario: HalftoneBlock med color-prop overstyrer default-fill
- **WHEN** `<HalftoneBlock color="oklch(85% 0.08 80)" />` rendres
- **THEN** SVG-prikkene har `fill` lik den oppgitte fargen, ikke `var(--ink)`

#### Scenario: HalftoneBlock uten color-prop bruker default
- **WHEN** `<HalftoneBlock />` rendres uten `color`
- **THEN** SVG-prikkene har `fill: var(--ink)` (default fra modulen)

#### Scenario: ingen Tailwind-utility-klasser i komponentene
- **WHEN** `grep -r "className=\"[a-z]*-[a-z]*-[a-z]*\"" src/components/shared/` kjøres
- **THEN** treff er kun på CSS Modules-genererte klassenavn, ikke Tailwind-utilities som `bg-gray-500` eller `text-sm`
