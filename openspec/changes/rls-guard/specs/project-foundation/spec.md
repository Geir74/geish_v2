# project-foundation Specification

## MODIFIED Requirements

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
4. **Versjonert er ikke nok — den skal være anvendt og bevist.** Enhver operasjon
   som reconcilerer databasen mot Drizzle-skjemaet (særlig `drizzle-kit push`)
   MUST etterfølges av re-anvendelse av `drizzle/rls/*.sql`, fordi den
   håndskrevne sikkerhetsflaten ligger utenfor skjemaet og kan fjernes som
   «drift». Etter enhver slik operasjon mot et miljø med data MUST RLS
   verifiseres aktivt.

Anvendelsesrekkefølgen (tabell-migrasjon før RLS/trigger-SQL) SHALL dokumenteres.

#### Scenario: første tabell følger konvensjonen
- **WHEN** E4 er implementert
- **THEN** finnes `profiles` i `schema.ts`, en generert migrasjon under `drizzle/`,
  og en håndskrevet `drizzle/rls/profiles.sql` med RLS + trigger

#### Scenario: sikkerhetsflaten er versjonert
- **WHEN** repoet inspiseres for RLS-policyer og triggere
- **THEN** finnes de som committet SQL — ikke kun i Supabase-dashboardet

#### Scenario: skjema-reconciliering etterlater ikke databasen naken
- **WHEN** `npm run db:push` kjøres mot et miljø med data
- **THEN** RLS-SQL re-anvendes som del av samme operasjon, og en etterfølgende
  verifisering bekrefter at RLS er aktiv med policyer på alle berørte tabeller
