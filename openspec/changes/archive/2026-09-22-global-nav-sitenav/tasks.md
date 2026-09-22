# Tasks: SiteNav

## 1. i18n-copy
- [ ] 1.1 Legg til `nav`-nøkkel i `src/content/i18n.ts` med kun LABELS
      (visningsnavn): Hjem · Blogg · Surdeig · Gjestebok · Manifest. Stiene ligger
      som statisk array i komponenten (Hugin: unngå ruter i i18n → statisk-render-risiko).
- [ ] 1.2 Bekreft at `auth.nav` (login/konto/logout) gjenbrukes uendret.

## 2. Komponent
- [ ] 2.1 Opprett `src/components/shared/SiteNav/index.tsx` (`"use client"`),
      absorber AuthNav-logikk. Behold EKSAKTE stier: `/konto`, `/logg-inn`,
      `<form action="/auth/logg-ut">` (Hugin: ikke finn på nye ruter).
- [ ] 2.2 Rom-stier som statisk array i komponenten, labels fra i18n; aktiv rute via `usePathname()`.
- [ ] 2.3 Loading-tilstand: placeholder med FAST dimensjon, ikke `null`
      (Hugin: dagens `null` gir layout-shift når auth popper inn).
- [ ] 2.4 Opprett `SiteNav.module.css` — «avrevne papirlapper», mono/caps,
      stempel-rød hover, aktiv-markering, flex-wrap på mobil. Kun eksisterende
      designtokens.

## 3. Montering + opprydding
- [ ] 3.1 Bytt `<AuthNav />` → `<SiteNav />` i `src/app/layout.tsx`.
- [ ] 3.2 Oppdater shared-barrel (`index.ts`): eksporter `SiteNav`, fjern `AuthNav`.
- [ ] 3.3 Fjern `AuthNav`-komponenten (mappen) når ingen andre referanser gjenstår.

## 4. Verifisering
- [ ] 4.1 `npm run lint` grønt.
- [ ] 4.2 `npm run build` grønt; statiske ruter fortsatt statiske i output.
- [ ] 4.3 Manuell: nav synlig på forside/blogg/manifest/surdeig/gjestebok; aktiv
      rute markert; auth-veksling logg inn/ut som før; mobil-wrap ved 320px.
- [ ] 4.4 Branch + PR (CI-gate), ikke direkte push til master.

## 5. Arkivering (etter merge)
- [ ] 5.1 `openspec archive global-nav-sitenav` (delta flettet inn i specs/navigation).
