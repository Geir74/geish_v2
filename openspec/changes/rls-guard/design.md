# Design — RLS-vakt

## Problemet i én setning

Sikkerhetsflaten (RLS + policyer) lever som håndskrevet SQL **utenfor** både
Drizzle-skjemaet og enhver automatisk kontroll, og kan derfor fjernes uten at
noe verktøy protesterer.

## Eksperiment: årsaken er bevist (2026-09-26)

Oppgave 1.1 er utført. `drizzle-kit push` sletter håndskrevet RLS — reprodusert
to av to ganger i isolert Postgres 16-container (aldri mot prod).

Fremgangsmåte: tabell opprettet via drizzle-kit → håndskrevet
`enable row level security` + SELECT-policy → `push` på nytt → mål tilstanden.
Begge kjøringer: RLS=på/1 policy før, RLS=av/0 policyer etter.

**Tre ting dette endrer i designet:**

1. **Det kreves ingen skjemaendring.** Vi antok at push måtte ha noe å gjøre for
   å rive policyer. Nei — en ren no-op-push, der Drizzle selv melder at alt er i
   sync, fjerner dem. Enhver kjøring av `db:push` er derfor farlig, ikke bare
   de som migrerer noe. Tiltak 2.3 må gjelde ubetinget.
2. **Feilen er usynlig.** Dataene overlever. Tabeller, rader og app fungerer
   som før; det eneste som endrer seg er at tilgangskontrollen er borte. Derfor
   kan ingen «ser det ut til å virke?»-sjekk fange dette — bare en eksplisitt
   spørring mot `pg_class`/`pg_policies`.
3. **Vinduet er hele tiden.** Siden en no-op-push holder, kan flaten forsvinne
   når som helst noen kjører en rutinesjekk. En vakt som kjører sjelden er ikke
   nok; frekvensen må velges med dette i minnet.

Gjenstår av oppgave 1: sjekke om `db:generate` + manuell migrasjon har samme
effekt (1.3). Forventning ut fra mekanismen: nei, fordi generate skriver SQL-filer
og rører ikke databasen — men det er en forventning, ikke et måleresultat.

## Datamodell

Ingen endring. Denne changen rører ikke tabeller, kolonner eller policy-innhold
— kun *kontroll av* at policyene finnes.

## Hvorfor ikke bare et steg i CI-bygget

Den åpenbare løsningen — «legg en RLS-sjekk i `build`-jobben» — virker ikke.

CI-jobben har ingen databasetilgang. Det ble bevist samme dag: bygget feilte med
`ECONNREFUSED` fordi forsiden prerendret mot en database som ikke finnes i CI.
Å gi hver PR-jobb prod-credentials ville dessuten være verre enn problemet:
prod-nøkler eksponert for enhver PR, inkludert fra en fork.

Derfor: **separat, schedulert workflow** med egne secrets, ikke et PR-steg.

## Valgte løsning: tre lag

1. **Gjør feilen umulig å gjøre uoppdaget (skriptlag).**
   `db:push` kobles sammen med re-anvendelse av `drizzle/rls/*.sql`, slik at
   den vanligste mistenkte årsaken ikke lenger kan etterlate en naken database.
2. **Oppdag den hvis den skjer likevel (vaktlag).**
   Schedulert workflow kjører verifiseringen mot prod. Rødt = noen må se på det.
3. **Skriv regelen ned (spec-lag).**
   Konvensjonen sier i dag at RLS *skal være versjonert SQL*. Den sier ingenting
   om at den skal være *anvendt og bevist*. Det hullet lukkes i deltaet.

## Avveininger og forkastede alternativer

### Forkastet: flytt RLS inn i Drizzle-skjemaet (`pgPolicy`)

Drizzle støtter policyer i skjemaet i nyere versjoner. Da ville `push` forstå
dem, og hele problemet forsvinner ved roten — dette er trolig riktig løsning på
sikt.

**Forkastet nå** fordi: (a) det river en etablert, dokumentert konvensjon som
E4, E5 og E6 alle følger, (b) E6 ligger i åpen PR og ville måtte skrives om,
(c) en migrering av sikkerhetsflaten er nøyaktig den operasjonen man ikke vil
gjøre i hastverk rett etter en sikkerhetshendelse. Tas som egen vurdering når
E6 er landet.

### Forkastet: auto-reparasjon når vakten slår ut

Fristende, men galt. En vakt som selv skriver mot produksjon kan gjøre en
liten feil stor uten øyne på. Samme lærdom som migrerings-rollback-fella:
fiks framover, med menneske i loopen. Vakten varsler.

### Forkastet: la det ligge, regelen finnes jo

Regelen fantes — og hendelsen skjedde likevel. Disiplin fanger ikke sletting.

## Hvorfor vakten må rope høyt

Samme dag ble det oppdaget at nattbackupen hadde stått som *failed* i fire
netter uten at noen merket det. En rød status ingen ser på er ikke en vakt.
Utfallet av denne changen MÅ være et signal som faktisk når et menneske —
ikke bare en exit-kode i en logg.

## Åpent spørsmål til implementering

Hvilken varslingskanal vakten skal bruke ved rødt (GitHub-notifikasjon alene,
eller push videre til Telegram) avgjøres i oppgave 4 — etter at vi vet om
GitHubs egen varsling faktisk når fram.
