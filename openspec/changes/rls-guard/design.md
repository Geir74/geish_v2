# Design — RLS-vakt

## Problemet i én setning

Sikkerhetsflaten (RLS + policyer) lever som håndskrevet SQL **utenfor** både
Drizzle-skjemaet og enhver automatisk kontroll, og kan derfor fjernes uten at
noe verktøy protesterer.

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
