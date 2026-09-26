# RLS-vakt — sikkerhetsflaten skal ikke kunne forsvinne stille

## Hvorfor

**2026-09-26 ble RLS funnet slått AV på alle fem tabellene i produksjon**
(`profiles`, `guestbook_entries`, `stua_rooms`, `stua_threads`, `stua_posts`),
med null policyer igjen. Funnet kom tilfeldig, under live-verifisering av E6
task 9.4 — ikke fra noen alarm.

Eksponeringen var reell og empirisk bekreftet: den offentlige anon-nøkkelen
kunne lese `profiles` (1 rad), `guestbook_entries` (1 rad) og `stua_rooms`
(5 rader) via PostgREST. Prosjekt-ref verifisert mot utrullet bundle på
geish.no — det var prod, ikke en testdatabase.

Omfanget var lite (1 profil, 1 gjestebokoppføring, ingen e-post/PII i
`profiles`), og RLS ble gjenopprettet samme dag ved å re-anvende
`drizzle/rls/*.sql`. Men **hendelsen avdekket et strukturelt hull, ikke bare en
tabbe**: sikkerhetsflaten vår kan forsvinne uten at noe sier fra. Den sto av i
minst noen dager uten at et eneste signal gikk.

Dette er derfor ikke en «rydde opp»-change. Den lukker selve hullet.

## Ledende hypotese (IKKE bevist)

`drizzle-kit push` (`npm run db:push`) reconcilerer databasen mot
`src/db/schema.ts`. RLS-policyene våre er per konvensjon **håndskrevet SQL
utenfor** skjemaet (`drizzle/rls/<tabell>.sql`). Et push kjenner dem derfor
ikke, og kan fjerne dem som «drift».

Indisier: `db:push` finnes som script; RLS ligger utenfor Drizzle-skjemaet;
tidslinjen sammenfaller med E6 bolk 1-arbeidet (ny datamodell + seed).

**Å bevise eller avkrefte dette er første oppgave i changen** — tiltakene under
er riktige uansett årsak, men vi skal ikke bygge på en gjetning.

## Beslutninger (Geir, 2026-09-26)

- **D1 — Vi kan ikke stole på disiplin alene.** Regelen «ingen RLS ved klikking i
  dashboardet» fantes allerede og holdt sikkerhetsflaten versjonert — men den
  fanget ikke at flaten ble *fjernet*. Vakten skal være automatisk.
- **D2 — Det skal rope høyt.** Backupen vår sto som «failed» i fire netter uten
  at noen merket det (egen hendelse samme dag). En vakt ingen ser på er ingen
  vakt. Utfallet skal være et synlig, rødt signal.

## Hva endres

- **Verifiserings-skript** (`scripts/verify-rls.mjs` generaliseres): sjekker at
  RLS er PÅ og at forventede policyer finnes på ALLE tabeller i `public`, ikke
  bare gjesteboka. Exit-kode ikke-null ved avvik.
- **`db:push` blir trygg:** scriptet skal ikke kunne etterlate databasen uten
  RLS — re-anvendelse av `drizzle/rls/*.sql` kobles på som fast ettersteg.
- **Planlagt RLS-vakt mot produksjon:** en schedulert GitHub Actions-workflow
  som kjører verifiseringen mot prod og feiler rødt hvis sikkerhetsflaten er
  borte.
- **Konvensjonen skjerpes** (spec-delta): det holder ikke å *ha* versjonert
  RLS-SQL — den skal også være bevist anvendt.

## Viktig arkitektur-funn (fra samme dag)

CI har **ingen databasetilgang**. Byggejobben feilet 2026-09-26 nettopp fordi
forsiden prerendret mot DB som ikke fantes i CI. Vakten kan derfor **ikke** være
et steg i den vanlige `build`-jobben på hver PR — den trenger egne
credentials og må kjøre som en separat, schedulert jobb.

## Ikke i scope (bevisst)

- **Flytte RLS inn i Drizzle-skjemaet** (`pgPolicy`). Reell og kanskje bedre
  langsiktig løsning — vurdert og utsatt i `design.md`, fordi den river en
  etablert konvensjon midt i en åpen E6-leveranse.
- Automatisk *reparasjon* når vakten slår ut. Vakten varsler; et menneske
  bestemmer. (Auto-reparasjon mot prod uten øyne på er hvordan man gjør en liten
  feil til en stor.)
- Utvidelse til andre miljøer enn produksjon.
