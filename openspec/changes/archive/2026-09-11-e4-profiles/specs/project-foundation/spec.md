## MODIFIED Requirements

### Requirement: Mappestruktur for db og supabase

Prosjektet SHALL etablere mappestrukturen:
- `src/db/index.ts` — Drizzle-instans og postgres-klient
- `src/db/schema.ts` — domenetabeller (fra E4 ikke lenger tom: inneholder
  `profiles` som første tabell; nye tabeller legges her eller i per-feature-filer
  som re-eksporteres herfra)
- `src/lib/supabase/server.ts` — server-side Supabase-klient
- `src/lib/supabase/client.ts` — browser-side Supabase-klient
- `app/smoke/page.tsx` — slettbar smoke-rute

DB-laget og Supabase-klient-laget MUST være separate (ingen kryssimporter utenfor smoke-ruten). `src/components/ui/` (shadcn) eksisterer ikke etter E1.

#### Scenario: Mappestruktur eksisterer
- **WHEN** repo er initialisert
- **THEN** alle filene over eksisterer med ikke-tomt innhold

#### Scenario: schema.ts inneholder profiles-tabellen
- **WHEN** `src/db/schema.ts` inspiseres etter E4-merge
- **THEN** definerer den `profiles`-tabellen (ikke lenger `export {}`-placeholder)

#### Scenario: src/components/ui finnes ikke
- **WHEN** repo er på master etter E1-merge
- **THEN** `src/components/ui/` eksisterer ikke, og det finnes ingen `shadcn`-relaterte filer (`components.json`) på repo-rot

## ADDED Requirements

### Requirement: Konvensjon for tabeller, migrasjoner og RLS-SQL

Prosjektet SHALL etablere og dokumentere en gjenbrukbar konvensjon for hvordan
nye domenetabeller innføres, som E5/E6 følger:

1. **Tabell-DDL** defineres i `src/db/schema.ts` (Drizzle `pgTable`) og genereres
   til committet SQL via `drizzle-kit generate` (under `drizzle/`).
2. **RLS-policyer, Postgres-triggere og eventuelle FK-er mot `auth`-skjemaet**
   (som drizzle-kit ikke genererer) skrives som håndskrevet, idempotent SQL og
   committes ved siden av migrasjonen, under `drizzle/rls/<tabell>.sql`.
3. Ingen RLS/policy/trigger opprettes ved klikking i Supabase-dashboardet — hele
   sikkerhetsflaten SHALL være versjonert SQL i repoet.

Anvendelsesrekkefølgen (tabell-migrasjon før RLS/trigger-SQL) SHALL dokumenteres.

#### Scenario: første tabell følger konvensjonen
- **WHEN** E4 er implementert
- **THEN** finnes `profiles` i `schema.ts`, en generert migrasjon under `drizzle/`,
  og en håndskrevet `drizzle/rls/profiles.sql` med RLS + trigger

#### Scenario: sikkerhetsflaten er versjonert
- **WHEN** repoet inspiseres for RLS-policyer og triggere
- **THEN** finnes de som committet SQL — ikke kun i Supabase-dashboardet
