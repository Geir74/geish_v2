## 1. Supabase-konfig (dashboard — forutsetning)

> Manuelle steg utenfor repoet — gjøres av Geir/Munin i Supabase- og Vercel-dashbordene før flyten kan testes. Detaljert liste i PR-beskrivelsen.

- [ ] 1.1 Redirect URLs i Supabase Auth: `http://localhost:3000/auth/callback`, `https://geish.no/auth/callback`, Vercel-preview-wildcard (`https://*-<team>.vercel.app/auth/callback` — verifiser eksakt mønster mot faktisk preview-URL).
- [ ] 1.2 Site URL satt til `https://geish.no`.
- [ ] 1.3 E-post-provider: Supabase-default bekreftet på (magic link-mal urørt — custom SMTP/maler er ut av scope).
- [ ] 1.4 `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=.geish.no` lagt inn i Vercel — KUN Production-environment. IKKE i Preview, IKKE i `.env.local`.

## 2. Cookie-domene-helper + klientfabrikker

- [x] 2.1 `src/lib/supabase/cookie-domain.ts` med `authCookieDomain()` (`NEXT_PUBLIC_AUTH_COOKIE_DOMAIN || undefined`) og fotpistol-kommentar (hvorfor kun prod).
- [x] 2.2 `src/lib/supabase/server.ts`: `cookieOptions: { domain: authCookieDomain() }` i `createServerClient`.
- [x] 2.3 `src/lib/supabase/client.ts`: samme i `createBrowserClient`.
- [x] 2.4 Verifiser: ingen hardkodet `.geish.no` i `src/` (`grep -rn "geish.no" src/lib/supabase/ src/middleware.ts` → 0 treff).

## 3. Middleware (token-refresh)

- [x] 3.1 `src/lib/supabase/middleware.ts` med `updateSession(request)` per Supabase' App Router-mønster: server-klient bundet til request/response-cookies (med domene-helper), `auth.getUser()` for refresh, cookies synket begge veier.
- [x] 3.2 `src/middleware.ts` som delegerer til `updateSession`, matcher ekskluderer `_next/static`, `_next/image`, `favicon.ico` og statiske filendelser (svg/png/jpg/webp/ico).
- [x] 3.3 Ingen redirect-logikk i middleware — kun refresh (bekreft ved lesing).

## 4. Auth-endepunkter

- [x] 4.1 `src/app/auth/callback/route.ts` (GET): `exchangeCodeForSession(code)`, `safeNext()`-validering av `next`-param (kun interne stier, default `/konto`), redirect på request-`origin`. Feil → `/logg-inn?feil=lenke`.
- [x] 4.2 `src/app/auth/logg-ut/route.ts` (POST): `signOut()` + redirect til `/`.

## 5. /logg-inn

- [x] 5.1 `auth`-slice i `src/content/locales/no.ts`: heading, felt-label, knapp, lenke-sendt-copy (med plass til e-postadresse), feilmeldinger, "bruk en annen adresse".
- [x] 5.2 `src/app/logg-inn/page.tsx` (server): redirect til `/konto` hvis innlogget, ellers rendre `LoginForm`.
- [x] 5.3 `LoginForm` (client component): e-postfelt + submit → `signInWithOtp` med `emailRedirectTo: ${location.origin}/auth/callback?next=/konto`; to-tilstands UI (skjema ↔ lenke-sendt-kvittering med adresse + reset-mulighet); feilvisning fra `?feil=`-param og fra utsendingsfeil.
- [x] 5.4 `page.module.css` i zine-stil: mono-labels, dashed border, stempel-rød aksent, "LENKE SENDT"-stempel-look på kvitteringen. Responsiv per RESPONSIVE.md. Forbudslisten respektert.

## 6. /konto (beskyttet review-flate)

- [x] 6.1 `src/app/konto/page.tsx`: server component, `getUser()` → `redirect("/logg-inn")` ved utlogget; ellers "logget inn som <e-post>" + logg ut-form (POST `/auth/logg-ut`).
- [x] 6.2 `page.module.css` i zine-stil (enkel — dette er en verifiseringsflate, ikke en profilside).

## 7. Innlogget-tilstand i UI

- [x] 7.1 `src/lib/auth/use-user.ts`: `useUser()`-hook — `getUser()` ved mount + `onAuthStateChange`-subscription, returnerer `{ user, loading }`, unsubscribe ved unmount.
- [x] 7.2 `src/components/shared/AuthNav/index.tsx` + `.module.css`: client component på `useUser()`; utlogget → "LOGG INN →"-lenke; innlogget → "KONTO"-lenke + "LOGG UT"-form; `loading` → tom placeholder med reservert plass (ingen blink/shift). Zine-stil, mono, ingen nye deps.
- [x] 7.3 Eksporter AuthNav fra `src/components/shared/index.ts`.
- [x] 7.4 Monter `<AuthNav />` i `src/app/layout.tsx` (utenfor `{children}`).

## 8. Verifisering — lokal flyt

> 8.2–8.9 + 8.11 krever kjørende dev-server, Supabase-konfig (seksjon 1) og ekte e-post — gjøres som del av review, ikke i apply-steget.

- [x] 8.1 `npx tsc --noEmit` og `npm run lint` rent.
- [ ] 8.2 Full flyt lokalt: skriv e-post på `/logg-inn` → kvittering vises med adressen → klikk lenken i e-posten → lander på `/konto` med riktig e-post vist.
- [ ] 8.3 Refresh + navigasjon som innlogget: sesjonen overlever (middleware-refresh funker).
- [ ] 8.4 Logg ut fra `/konto`: redirect til `/`, `/konto` redirecter deretter til `/logg-inn`, AuthNav viser "logg inn".
- [ ] 8.5 Utlogget: `/`, `/blogg`, `/blogg/<slug>`, `/manifest` gir 200 uten redirect (ingen auth-mur).
- [ ] 8.6 `/konto` som utlogget → redirect til `/logg-inn`. `/logg-inn` som innlogget → redirect til `/konto`.
- [ ] 8.7 Utløpt/gjenbrukt magic link → `/logg-inn?feil=lenke` viser feilmelding, ny lenke kan bes om.
- [ ] 8.8 Callback med `next=https://evil.example` → redirecter til `/konto`, ikke eksternt.
- [ ] 8.9 Localhost-cookies: `sb-*`-cookies UTEN Domain-attributt (host-only) — inspisert i nettleser.
- [x] 8.10 `npm run build`: forside/blogg/manifest fortsatt statiske i build-output; `/konto` og `/logg-inn` dynamiske. Ingen ruter har blitt dynamiske utilsiktet.
- [ ] 8.11 AuthNav på statiske sider: viser riktig tilstand etter hydrering, ingen layout-shift (reservert plass verifisert).

## 9. Verifisering — prod (etter merge/deploy)

- [ ] 9.1 Full magic link-flyt på `https://geish.no`.
- [ ] 9.2 Cookie-inspektør på prod: `sb-*`-cookies har `Domain=.geish.no`.
- [ ] 9.3 Vercel-preview (PR-deploy): login-flyt funker med host-only cookie (env-varen ikke satt i preview).

## 10. Forbudsliste + sanity

- [x] 10.1 Ingen nye npm-avhengigheter (`git diff package.json` tom).
- [x] 10.2 Ingen Tailwind/shadcn, ingen border-radius > 0, ingen blur-skygger, ingen gradients, ingen emoji-ikoner i auth-UI.
- [x] 10.3 Ingen Drizzle-imports eller DB-kall i auth-koden (E3 er DB-fri — `auth.users` styres av Supabase).
- [x] 10.4 Ingen bruk av deprecte `@supabase/auth-helpers-*`.
- [x] 10.5 All bruker-synlig auth-copy kommer fra `t()` — ingen hardkodede strenger i komponentene.
