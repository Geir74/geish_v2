---
project: geish_v2
feature: project-init
date: 2026-05-20
type: greenfield
status: ready
---

# Mandat: Project Init

## Mål
Sette opp et komplett, utviklingsklart fundament for geish_v2. Alle kjerneavhengigheter skal være installert, koblet og verifisert — slik at neste feature kan bygges uten å måtte tenke på infrastruktur.

## Scope

### Inn
- Installer og konfigurer `@supabase/supabase-js` og `@supabase/ssr`
- Installer og konfigurer Drizzle ORM (`drizzle-orm`, `postgres`, `drizzle-kit`)
- Initialiser shadcn/ui med Tailwind v4
- Sett opp mappestruktur for `src/db/` og `src/lib/supabase/`
- Opprett Drizzle-konfig (`drizzle.config.ts`) pekt mot Supabase connection pooler
- Opprett Supabase-klient for server og browser (via `@supabase/ssr`)
- Legg til `drizzle-kit generate` og `drizzle-kit push` som npm-scripts
- Smoke test: én verifiserbar sjekk som bekrefter at db-tilkobling og Supabase-klient fungerer

### Ut
- Ingen features eller sider utover placeholder `app/page.tsx`
- Ingen database-schema (tabeller defineres i egne feature-mandater)
- Ingen auth-flows
- Ingen deploy til Vercel (gjøres manuelt etter init)

## Delta-type
**Type:** greenfield

## Suksesskriterier
- [ ] `npm run dev` starter uten feil
- [ ] Drizzle kan koble til Supabase PostgreSQL (smoke test passerer)
- [ ] Supabase-klient kan instansieres uten feil på server og klient
- [ ] shadcn/ui er initialisert og én testkomponent (`Button`) kan importeres i `app/page.tsx`
- [ ] `npm run db:generate` og `npm run db:push` kjører uten feil

## Constraints
- Drizzle skal bruke **Transaction pool mode** fra Supabase: `prepare: false` må settes eksplisitt
- Connection string hentes fra `DATABASE_URL` i `.env.local`
- Supabase-klient hentes fra `NEXT_PUBLIC_SUPABASE_URL` og `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- shadcn/ui skal bruke Tailwind v4 (ikke v3) — bruk `shadcn@latest`

## Kontekst for Code
- Prosjektet er Next.js 16 med App Router og `src/`-struktur
- Supabase-prosjekt: `ajsjzdgflnyyoljiqrpq` (Stockholm, eu-north-1)
- Env-variabler ligger i `.env.local` og er allerede satt opp
- Vercel og GitHub er koblet — ikke nødvendig å tenke på deploy i dette mandatet
- OpenSpec er initialisert — bruk `/opsx:propose` for å generere proposal, design og tasks

## Åpne spørsmål
- Optimal mappestruktur for `src/db/` og `src/lib/supabase/` — Code avgjør etter Drizzle + Supabase best practices 2026
- Smoke test-strategi: script, route handler eller server component — Code velger enkleste løsning
