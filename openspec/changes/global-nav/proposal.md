## Why

geish.no har ingen felles navigasjon. Hver side har bare sin egen brødsmule-strip,
og eneste globale element i rot-layouten er `AuthNav` (logg inn/ut øverst til
høyre, fra E3). Det finnes ingen måte å bevege seg mellom rommene på — du må
kjenne URL-ene. Så lenge siten var forside + blogg + manifest gikk det an, men
E5 (gjestebok) og E6 (Stua) legger til flere rom, og da må det finnes en meny
som binder dem sammen. Global navigasjon er derfor **forutsetningen** for at
E5/E6 skal føles som steder man kan gå mellom, ikke løse URL-er.

Denne endringen er liten i kode, men den rører rot-layouten som *alt* rendres
under, og den må respektere to harde krav fra E3: (1) statiske ruter (forside,
blogg, manifest) MÅ forbli statiske, og (2) Cut & Paste-zine-designet skal ikke
brytes. Derfor egen change med spec, på linje med resten av repoet.

## What Changes

- **Ny `SiteNav`-komponent** (`src/components/shared/SiteNav/`) montert i
  `src/app/layout.tsx`, som **absorberer og erstatter `AuthNav`** (D1). Én
  samlet navigasjon: rom-lenker + innlogget-tilstand i samme komponent.
- **Rom-lenker, kun til rom som finnes** (D2): Hjem (`/`), Blogg (`/blogg`),
  Manifest (`/manifest`). Ingen grå/disabled placeholders for Stua/Gjestebok —
  de legges til når rommene faktisk finnes (E5/E6).
- **Auth-del absorbert fra AuthNav**: `Logg inn` (utlogget) ↔ `Min side` +
  `Logg ut` (innlogget), via `useUser()` + POST-form mot `/auth/logg-ut`.
  Uendret oppførsel, bare flyttet inn i SiteNav.
- **Aktiv rute markeres** via `usePathname` (aktiv lapp «tapet fast» —
  stempel-farget fyll).
- **«Avrevne papirlapper»-design** (D5): hver lenke som en liten utklippet lapp
  på rad, lett skjeve, dashed «tape»-kant, stempel-rød på hover. Flex-wrap på
  mobil — ingen hamburger.
- **Copy** i ny `nav`-slice i `src/content/locales/no.ts` (Geir-godkjent):
  rom-lenker (`links[]` med `href` + `label`) + auth-etiketter
  (`login`/`konto`/`logout`). Ingen hardkodet tekst i komponenten.
- **Barrel** (`src/components/shared/index.ts`) eksporterer `SiteNav` i stedet
  for `AuthNav`. AuthNav-fila beholdes (ikke slettet), men er ikke lenger montert.

## Capabilities

### New Capabilities
- `navigation`: Global `SiteNav` i rot-layouten som viser lenker til
  eksisterende rom + innlogget-tilstand, client-only (statiske ruter forblir
  statiske), i zine-designet. Absorberer auth-nav fra E3. Utvidbar med nye rom
  (E5/E6) ved å legge til lenker i `nav`-slicen.

### Modified Capabilities
- `auth`: Innlogget-tilstands-visningen fra E3 (`AuthNav`) flyttes inn i
  `SiteNav`. Samme oppførsel (`useUser()` + `/auth/logg-ut`-form), nytt hjem.

## Impact

- **Avhengigheter:** ingen nye npm-pakker. Bruker `next/link`, `next/navigation`
  (`usePathname`), eksisterende `useUser()`-hook og designtokens.
- **Env-vars:** ingen.
- **Filsystem (nytt):**
  - `src/components/shared/SiteNav/index.tsx` — komponenten (client).
  - `src/components/shared/SiteNav/SiteNav.module.css` — papirlapp-stil.
- **Filsystem (modifisert):**
  - `src/app/layout.tsx` — `<AuthNav />` → `<SiteNav />`.
  - `src/components/shared/index.ts` — eksporterer SiteNav.
  - `src/content/locales/no.ts` — ny `nav`-slice.
- **Røres ikke:** blogg (E2), manifest, forside-seksjonene, designsystem-tokens,
  auth-flyten (E3: middleware, callback, logg-inn, logg-ut, cookie-domene),
  profiler (E4), smoke/styleguide. `AuthNav`-fila beholdes urørt (bare avmontert).
- **Statisk rendering:** verifisert bevart — `/`, `/blogg`, `/manifest` er
  fortsatt `○ (Static)` i build-output.
- **Ut av scope:**
  - Lenker til Stua/Gjestebok (E5/E6) — legges til når rommene finnes.
  - Hamburger / off-canvas-meny — bevisst valgt bort (passer ikke zine-stilen).
  - Dropdowns, undermenyer, søk i nav.
  - Ny styling av selve sidene — kun nav-komponenten røres.
