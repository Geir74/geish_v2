## Context

E2 leverte filbasert MDX-blogg. `coverImage` er i dag et valgfritt `string`-felt i frontmatter-skjemaet (`src/lib/blog/schema.ts`), og hero-rendringen i `src/app/blogg/page.tsx` viser HalftoneBlock når feltet mangler. Bildehåndtering ble deferert i E2.

**Sideordnet kapabilitet (2026-08-19):** Munins `tools/imgproc/webimg.js` (Node + Linux-`sharp` 0.35) forbehandler bilder: auto-roter → strip all metadata inkl. GPS → resize (aldri oppskalering) → valgfritt vannmerke → WebP. Merk at `sharp` i `geish_v2/node_modules` er Windows-bygget og kræsjer i WSL — derfor kjører prosesseringen utenfor repoet.

**Autoritativ design:** `02-PAGES.md` Side 4 (Bloggen: hero-split 1.4fr/1fr, arkiv-grid, kort-estetikk), `references/pages.jsx` `PageBlogg`.

**Arkitekturvalg (låst av mandatet):** Bilder er filer, ikke DB/CDN. Prosessering er et forsteg, ikke en byggetids-avhengighet. `next/image` gjør kun resize av det ferdige masteret. Git publiserer.

## Goals / Non-Goals

**Goals:**
- Poster kan ha ekte cover-bilder, personvern-trygt (EXIF/GPS strippet før commit).
- `coverImage` støtter `alt` (tilgjengelighet/SEO) og `focal` (crop-fokus) uten å knekke eksisterende poster.
- To standardiserte utsnitt (16:9 hero, 1:1 kort) fra samme master.
- HalftoneBlock-fallback uendret for poster uten cover.
- Ingen CLS ved bildelast; responsivt fra 320px.
- Ingen ny byggetids-avhengighet i geish_v2.

**Non-Goals:**
- Generativ/AI-retusj.
- CDN / ekstern hosting.
- DB/`images`-tabell.
- Upload-UI / admin.
- Runtime-vannmerking.
- Innebygd `sharp` i geish_v2.
- Endre BlogStrip på forsiden (egen senere runde).

## Decisions

### D1. `coverImage`: zod-union `string | object` med normalisering

**Valg:** Utvid skjemaet slik at `coverImage` aksepterer enten ren `string` (bakoverkompat) eller et objekt. Normaliser alltid til en intern `CoverImage`-form etter parsing.

```ts
// src/lib/blog/schema.ts
import { z } from "zod";

const focalSchema = z.enum(["center", "top", "bottom", "left", "right"]).default("center");

const coverObjectSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1, "coverImage.alt er påkrevd når coverImage er et objekt"),
  focal: focalSchema,
  credit: z.string().optional(),
});

export const coverImageSchema = z
  .union([z.string().min(1), coverObjectSchema])
  .optional();

// Normalisert intern form:
export type CoverImage = {
  src: string;
  alt: string;
  focal: "center" | "top" | "bottom" | "left" | "right";
  credit?: string;
};
```

```ts
// normalisering i posts.ts (etter safeParse)
function normalizeCover(raw: unknown, file: string): CoverImage | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "string") {
    console.warn(`[blog] ${file}: coverImage er en ren string uten alt-tekst — bruk objekt { src, alt } for tilgjengelighet.`);
    return { src: raw, alt: "", focal: "center" };
  }
  return raw as CoverImage; // allerede validert av zod
}
```

**Hvorfor union + normalisering:**
- Eksisterende poster med `coverImage: "/..."` fortsetter å virke (ingen brekkende migrering).
- Nye poster tvinges til `alt` når de bruker objekt-formen — a11y/SEO by default.
- Rendringslaget forholder seg til én normalisert `CoverImage`-type, aldri unionen.

**Alternativer vurdert:**
- Hard overgang til objekt + oppdater alle seed-poster: enklere type, men brekker bakoverkompat og gjør skjemaet mindre tilgivende. Avvist — union koster lite.
- `alt` valgfritt også i objekt-formen: svekker a11y-gevinsten. Avvist — objekt = eksplisitt valg = krev alt.

### D2. To committede utsnitt vs. ett master + CSS

**Valg:** To faste filer per post — `cover-hero.webp` (16:9) og `cover-card.webp` (1:1) — begge i `public/blog/<slug>/`, generert fra samme råbilde i forsteget via `sharp().extract()` med fokuspunkt.

**Hvorfor to filer:**
- Skarpere, tilsiktet crop for hvert format (fokuspunkt bevares i begge).
- Arkiv-kortet laster ned et lite 1:1-bilde, ikke et nedskalert 16:9 (mindre båndbredde — relevant for Vercel Hobby-kvoten).
- `next/image` lager responsive bredder av hver fil; ingen dobbel størrelses-logikk.

**Alternativer vurdert:**
- Ett master + `object-position`/`object-fit` i CSS for begge forhold: færre filer, men kortet laster ned et større bilde og crop-fokus blir mindre presist ved ekstreme forhold. Holdt som mulig forenkling hvis to-fil-tilnærmingen viser seg overkill for få poster.
- `next/image` med `fill` + container-aspect: fungerer, men vi vil ha eksplisitt `width`/`height` for CLS-kontroll.

### D3. `focal` → `object-position`

**Valg:** `focal`-nøkkelord mappes til `object-position` på `next/image`:

```ts
const focalToPosition: Record<CoverImage["focal"], string> = {
  center: "50% 50%",
  top: "50% 0%",
  bottom: "50% 100%",
  left: "0% 50%",
  right: "100% 50%",
};
```

Fokuspunktet brukes både (a) i forsteget som hint for `sharp().extract()`-utsnittet, og (b) som `object-position` i tilfelle `next/image`-containeren har et litt annet forhold enn masteret. Prosent-verdier (`"50% 30%"`) er en mulig senere utvidelse.

### D4. `next/image` uten CLS

**Valg:** Bruk eksplisitt `width`/`height` som matcher utsnittets forhold (hero: f.eks. 1280×720; kort: 600×600), pakket i en aspect-ratio-boks der layouten krever fleksibel bredde. `sizes` settes per kontekst:
- Hero: `sizes="(max-width: 768px) 100vw, 60vw"` (1.4fr-kolonnen).
- Enkeltpost-header: `sizes="(max-width: 760px) 100vw, 760px"`.
- Arkiv-kort: `sizes="(max-width: 480px) 100vw, 50vw"`.

`priority` settes kun på hero-bildet på `/blogg` og enkeltpostens header (LCP-kandidater); arkiv-kort er lazy.

### D5. Prosessering utenfor bygget — dokumentert oppskrift

**Valg:** Ingen `sharp` i geish_v2. Cover-master lages med Munins `tools/imgproc/webimg.js` + `sharp().extract()` for de to forholdene, og resultatet kopieres til `public/blog/<slug>/`. En kort README/notat dokumenterer flyten:

```
# Råbilde → cover (kjøres i Munins workspace, ikke i repoet)
# 16:9 hero:
node webimg.js <raw> out --sizes 1280 --slug <slug>-hero --no-wm   # + extract 16:9 via focal
# 1:1 kort:
node webimg.js <raw> out --sizes 600  --slug <slug>-card --no-wm    # + extract 1:1 via focal
# → kopier out/*.webp til geish_v2/public/blog/<slug>/cover-hero.webp og cover-card.webp
```

Vannmerke er **av** som default for covers (`--no-wm`); kan slås på per bilde ved behov. `--crop`-forhold som fast flagg i `webimg.js` er en mulig senere imgproc-forbedring — inntil da gjøres utsnittet ad-hoc med `extract`.

### D6. Personvern-verifisering

**Valg:** Etter prosessering verifiseres at de committede WebP-ene er metadata-frie (ingen EXIF/GPS). `sharp` stripper metadata by default; verifiseres med en metadata-sjekk (f.eks. `sharp(file).metadata()` viser ingen `exif`/`gps`). Rå-originalen committes aldri — den holdes i Munins workspace / utenfor repoet.

## Risks / Trade-offs

- **Manuelt forsteg:** cover-bilder krever et Munin-drevet prosesseringssteg før commit. Trade-off akseptert: holder repoet fri for den kræsjende Windows-`sharp`-en og gir full personvern-kontroll. Kan automatiseres senere (imgproc-forbedring).
- **To filer per post:** litt mer diskbruk enn ett master. Trivielt (~0,5 MB/post); til gjengjeld mindre båndbredde per kort-visning.
- **Union-skjema:** litt mer kompleks zod-type. Betaler seg i bakoverkompat + a11y-tvang.
- **Vercel Image Optimization-kvote:** `next/image` teller transformasjoner på Hobby-planen. Mitigering finnes (forhåndsprosesserte WebP, evt. `unoptimized` på covers) — vurderes hvis kvoten nærmer seg. Følges opp, ikke et problem ved få poster.

## Migration Plan

1. Utvid `coverImage`-schema (union) + `CoverImage`-type + normalisering. Eksisterende string-cover (ingen i seed i dag) fortsetter å virke.
2. Oppdater hero + arkiv-grid + enkeltpost-header til `next/image` med de to utsnittene og `focal`.
3. Prosesser Nox-bildet til `cover-hero.webp` + `cover-card.webp`, legg i `public/blog/<slug>/`, gi én seed-post et `coverImage`-objekt.
4. Verifiser: build grønt, `/blogg` + `/blogg/[slug]` 200, alt-tekst i DOM, HalftoneBlock intakt for de andre postene, WebP metadata-frie.

## Open Questions

- **Filnavn-konvensjon:** `cover-hero.webp` + `cover-card.webp` (valgt), eller ett master + CSS? → to filer nå; revurderes om overkill.
- **`focal`-verdier:** nøkkelord (valgt) vs. prosent → nøkkelord nå, prosent som mulig utvidelse.
- **Vannmerke-provenens:** `watermark`-flagg i cover-objektet for sporbarhet? → utelatt fra runtime-frontmatter; evt. sidecar-README per slug.
- **BlogStrip på forsiden:** vise `cover-card.webp` nå? → nei, holdes uendret i denne changen.
