# Surdeig – design handoff (retning «E · Kvittering»)

Design only. Calculation logic lives in `bakers-math`; the design never computes anything.
Every number in the reference is a placeholder (`[g]`, `[sum]`).

## Files

| File | What it is | Use it for |
|---|---|---|
| `surdeig-reference.html` | Static, responsive HTML + CSS. Mobile first, desktop at ≥1024px. Uses the existing token names from `src/styles/tokens.css`. | **Source of truth for porting.** Open it in a browser and resize. |
| `dc-source/*.dc.html` | The original Claude Design artboards (390px mobile, 1280px desktop). They use a Design-only runtime (`<x-dc>`, `<sc-for>`, `DCLogic`). | Visual reference only. **Do not port this markup.** |

## Tokens

- Reuse the existing tokens: `--paper`, `--ink`, `--ink-soft`, `--stamp`, `--stamp-fade`, `--highlight`, `--paper-edge`, `--paper-dark`, the 5 font vars, `--t-*`, `--sp-*`, `--chaos`.
- Add 3 local tokens, scoped to the page's CSS Module (not global):
  - `--card: oklch(98.5% 0.008 85)`: the taped card and the receipt.
  - `--tape`: `--highlight` at 60 % alpha.
  - `--touch: 44px`.
- Reuse the existing helpers `.paper` and `.torn-bottom`.
- Every rotation is `calc(Xdeg * var(--chaos))`, so small screens calm down automatically, like the rest of the site.

## Component map (suggested)

```
/surdeig (page)
├─ SurdeigHeader     black hero, torn bottom edge, "GRAM FOR GRAM" round stamp
├─ CalcCard          taped card (form). Mobile: stack. Desktop: 2-col grid
│  ├─ DoughInput     01 · big ink field + ±100 g
│  ├─ FlourMix       02 · FlourBar (patterned segments) + IngredientRow[] + add
│  ├─ ExtraIngredients 03 · IngredientRow[] (red "+" marker, % of flour) + add
│  ├─ RatioField[]   04 · hydration / levain / salt. Mobile: 3 tiles. Desktop: rows
│  └─ TempField[]    05 · deig / rom / ovn °C
├─ Receipt           torn receipt, dotted leaders, SUM highlighted, "VEI OPP" stamp
│  └─ StarRating     5 stamped stars (radiogroup), avg + count line
├─ Steps             numbered steps: editable text + time chip + temp chip + remove + add
└─ Comments          yellow taped note (textarea + submit) + comment "clippings"
```

`IngredientRow` is one component used for both flour and extras. Its props are `marker: 'swatch' | 'plus'` and `patternIndex`.

## Layout

- **Mobile (<1024px):** one column in this order: header → card → receipt → steps → comments.
- **Desktop (≥1024px):** a grid of `1fr 420px`, column gap 72px, max width 1280px.
  - Row 1: card | receipt
  - Row 2: steps | comments
  - Inside the card: 01 spans both columns, then 02 | 03, then 04 | 05.
  - The hero title is on one line («SURDEIG», 150px) with the tagline beside it.

## Behaviour (design intent, not logic)

- **All inputs are editable text fields.** Use `inputmode="decimal"` for percentages and accept a comma as the decimal separator. The ± buttons are shortcuts for small nudges.
- **FlourBar:** segment width = that flour's %. Patterns cycle by index: `pat-0` through `pat-5` in the reference.
- **Receipt:** one line per flour, then water, levain, salt, then the extras. SUM is the sum of the lines. Use `aria-live="polite"` on the list.
- **Motion:** none, apart from the static tilts. The scrolling ticker was tried and rejected as too distracting.
- **Stars and comments need auth and profiles (E3/E4).** Hide both behind a flag until then; the rest of the page works without them.

## Accessibility

- Every input has a real `<label>` (visually hidden ones use `.sr-only`).
- Icon-only buttons have an `aria-label`.
- Touch targets are ≥44px.
- `:focus-visible` shows a 2px `--stamp` outline.
- Text contrast: the secondary text is `--ink-soft`, not `--ink-fade`, because `--ink-fade` on paper is too faint.
- No emoji. All icons are inline stroke SVG.
