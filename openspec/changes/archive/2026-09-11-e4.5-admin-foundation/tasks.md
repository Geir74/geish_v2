## 1. Env + admin-identitet (D1)

- [x] 1.1 `ADMIN_USER_ID` dokumentert i `.env.example` (Supabase `auth.users`-
  UUID; verdien settes i `.env.local` + Vercel, aldri committet). `.env.example`
  committet med gitignore-unntak (kun feltnavn, ingen verdier).
- [x] 1.2 `ADMIN_USER_ID` satt i `.env.local` på munin — Geirs auth-UUID hentet
  fra `auth.users` (1 bruker, verifisert riktig).

## 2. isAdmin()-hjelper

- [x] 2.1 `src/lib/admin/is-admin.ts`: server-side `isAdmin()` som henter
  `getUser()` og sammenligner `user.id === process.env.ADMIN_USER_ID`. Pluss
  ren `isAdminId(userId)` for testbar logikk.
- [x] 2.2 Fail closed: mangler `ADMIN_USER_ID`/tom, ingen bruker, eller
  klientfabrikk-kast → `false`. Try/catch rundt Supabase-kall.
- [x] 2.3 Verifisert: admin-UUID → true; annen UUID → false; utlogget → false;
  tom env → false; undefined env → false. (Alle 5 passerte.)

## 3. /admin-tak + guard

- [x] 3.1 Guard i `src/app/admin/layout.tsx`: `force-dynamic`, `isAdmin()`,
  ikke-admin → `notFound()` (404). D3: 404, ikke redirect. Verifisert live:
  utlogget → HTTP 404.
- [x] 3.2 `src/app/admin/page.tsx` + `page.module.css`: nesten tom landingsside
  i fanzine-stil (overskrift + tom-tilstand «ingen paneler ennå» via `t()`).
  Ingen tomme panel-seksjoner (ikke kart før landskap).
- [x] 3.3 `src/app/admin/layout.tsx`: felles guard/ramme så E5/E6 arver guarden
  uten å repetere den.

## 4. Moderering-mønster — UT AV E4.5 (gjennomgang B, 2026-09-11)

- [x] 4.1 BESLUTNING: moderering-mønsteret er FJERNET fra E4.5. Utledes fra E5s
  første faktiske panel. E4.5 = `isAdmin()` + `/admin`-guard + tom landingsside.
- [x] 4.2 Ingen generisk moderering-motor (bevisst).

## 5. Copy

- [x] 5.1 `admin`-slice i `src/content/locales/no.ts` (UTKAST — Geir godkjenner):
  crumb, heading, lede, tom-tilstand.
- [x] 5.2 All admin-synlig copy via `t()` (ingen hardkodet tekst).

## 6. Verifisering

- [x] 6.1 `npx tsc --noEmit` (TSC=0) og `npm run lint` (LINT=0) rent.
- [x] 6.2 `npm run build` grønt: `/admin` dynamisk (ƒ), ikke utilsiktet statisk.
- [ ] 6.3 Admin-bruker (Geir innlogget) når `/admin` (200) — KREVER Geirs
  innloggede sesjon i nettleser; ikke automatisk verifiserbart. Kodesti klar.
- [x] 6.4 Innlogget ikke-admin nektes `/admin` — dekkes av fail-closed-logikk
  (annen UUID → false → 404). Enhets-verifisert.
- [x] 6.5 Utlogget nektes `/admin` — verifisert live (HTTP 404).
- [x] 6.6 Tom `ADMIN_USER_ID` → ingen når `/admin` (fail closed) — enhets-
  verifisert (tom env → false).

## 7. Forbudsliste + sanity

- [x] 7.1 Ingen nye npm-avhengigheter (`package.json` urørt).
- [x] 7.2 Ingen DB-migrasjon / role-kolonne (D1: env-basert).
- [x] 7.3 Ingen admin-sjekk i middleware eller kun i RLS — guarden bor i
  server-laget (layout/page).
- [x] 7.4 `ADMIN_USER_ID`-verdi aldri committet (kun feltnavn i `.env.example`).
- [x] 7.5 Ingen border-radius/blur/gradient/emoji i admin-UI; zine-stil,
  gjenbruk av design-tokens.
- [x] 7.6 Ingen Tailwind/shadcn.
