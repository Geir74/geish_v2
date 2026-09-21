## Kontekst

B1 er en ren klientside-kalkulator uten backend. Utfordringen er ikke
infrastruktur, men **matematisk korrekthet** (true hydration, toveis-beregning)
og **reaktiv tilstandsstyring uten sirkulære oppdateringer**. Denne fila
dokumenterer de ikke-trivielle valgene så B2+ og fremtidige utviklere forstår
hvorfor.

## Beslutning 1: True hydration som STYRENDE input, ikke bare visning

En surdeigsstarter er selv mel + vann. Kalkulatoren skal være et
planleggingsverktøy: brukeren sikter mot en ønsket **true hydration**, og
verktøyet regner ut hvor mye vann som faktisk skal helles i bollen.

**Retning (avgjort etter Hugin-review 21.09):** hydrering-input tolkes som
ønsket **true hydration**, IKKE som «tilsatt vann». Kalkulatoren regner bakover
og trekker fra starterens vannbidrag. Motsatt retning (input = tilsatt vann,
true hydration bare vist) ble forkastet — da blir kalkulatoren en passiv
rapportør, ikke et verktøy.

**Starter-utskilling.** Starter har `starterWeight` + `starterHydrationPct`
(default 100). Ved hydrering `h`:
- `starterMel = starterWeight / (1 + h/100)`
- `starterVann = starterWeight - starterMel`

**Eksakte formler (MÅ implementeres slik i `bakers-math.ts`):**
```
totalMel   = tilsattMel + starterMel
totalVann  = totalMel * (H/100)          // H = ønsket true hydration %
tilsattVann = totalVann - starterVann     // det brukeren heller i bollen
trueHydration = totalVann / totalMel      // = H, men beregnes for visning
```

**Eksempel:** 1000 g tilsatt mel, 200 g starter @100 % (100 g mel + 100 g
vann), ønsket true hydration 75 %:
- totalMel = 1100, totalVann = 1100 × 0,75 = 825, tilsattVann = 825 − 100 =
  **725 g** (helles i bollen). Vist true hydration = 825/1100 = 75 %.

(Naiv 725/1000 = 72,5 % ville vært feil å vise.)

## Beslutning 2: Én uavrundet source of truth

For å unngå sirkulære React-oppdateringer (komponent A oppdaterer B som
oppdaterer A → infinite loop) holdes **all state i én uavrundet base**:
`baseFlourWeight: number` (total mel i gram, full presisjon).

- Alt annet (vann, salt, starter, enkelt-meltyper, totalvekt, prosenter) er
  **avledede visninger** beregnet fra `baseFlourWeight` + prosent-settet.
- Brukerinput går gjennom **eksplisitte transform-funksjoner** som oppdaterer
  `baseFlourWeight` (eller prosentene), aldri gjennom at én visning skriver til
  en annen.
- Avrunding til hele gram skjer KUN i visningslaget, aldri i beregningsbasen.

Dette er et hardt arkitekturkrav, ikke en preferanse.

## Beslutning 3: Toveis-beregning

- **Modus `fromFlour`:** bruker angir total melmengde → alle andre =
  mel × prosent.
- **Modus `fromTotalWeight`:** bruker angir ønsket deigvekt `T` → løs for mel:
  `mel = T / (1 + Σ(alle prosenter/100))` der Σ inkluderer vann-%, salt-%,
  starter-% (starter regnes med sin oppgitte vekt-prosent av mel). Resultatet
  settes som `baseFlourWeight`, resten avledes.

Begge moduser skriver til samme `baseFlourWeight` — de er to innganger til
samme base, ikke to separate tilstander.

## Beslutning 3b: Salt/tørre tilsetninger regnes mot TOTAL mel

Salt (og andre tørre baker's-%-ingredienser) regnes mot `totalMel`
(= tilsattMel + starterMel), IKKE mot tilsattMel alene. Grunn: starter-melet
påvirker saltkonsentrasjonen i ferdig brød like mye som tilsatt mel. Regner man
salt mot bare tilsatt mel, blir faktisk saltprosent for lav med stor starter
(f.eks. 2 % av 1000 g = 20 g → 20/1100 = 1,8 % i ferdig brød → for lite salt).

**Formel:** `salt = totalMel * (saltPct/100)`. Eksempel: 1000 g tilsatt mel +
200 g starter@100 % (100 g mel) + 2 % salt → 2 % av 1100 g = **22 g**.

## Beslutning 3c: Toveis bakover-formel med true hydration

I `fromTotalWeight` løses tilsatt mel bakover fra ønsket deigvekt `T`. Med true
hydration `H` og starter som fast vekt-andel `s` av tilsatt mel:
```
totalMel = tilsattMel + starterMel
deigvekt T = tilsattMel + tilsattVann + salt + starterWeight
           = tilsattMel + (totalMel*H/100 - starterVann) + totalMel*saltPct/100 + starterWeight
```
Implementasjonen MÅ utlede `tilsattMel` eksplisitt fra denne (ikke gjette), og
teste at resultatet gir ønsket `T` tilbake. Nøyaktig algebraisk isolering
dokumenteres i koden.

## Beslutning 4: Avrundingsavvik absorberes i vannet

Etter avrunding til hele gram vil summen sjelden treffe ønsket totalvekt
eksakt (f.eks. 1000 g → 998 g). Differansen legges til/trekkes fra **vannet**,
som er den største og smaksmessig minst følsomme posten. Salt og mel avrundes
korrekt og røres ikke — 1 g feil salt merkes på smak, 1 g vann gjør ikke.

Regel: `visningsvann = avrundet_vann + (ønsket_total - sum_avrundede_poster)`.

## Beslutning 5: Flere meltyper — definerte lås-regler

Med flere meltyper (f.eks. 70 % hvete, 30 % rug) og toveis-modus må UI-en ha
forutsigbare regler for hva som skjer når brukeren endrer én enkeltverdi:

- Hver meltype har en **andel-% av total mel**; andelene summerer alltid til
  100 %.
- Endrer brukeren én meltypes **prosent**, justeres de øvrige proporsjonalt så
  summen forblir 100 % (eller: siste redigerte låses, resten fordeler resten —
  velges i implementasjon og dokumenteres i UI).
- Endrer brukeren en meltypes **gram** direkte, tolkes det som ny
  `baseFlourWeight`-fordeling: total mel oppdateres, andels-% reberegnes.
- I `fromTotalWeight`-modus er totalvekt låst; endring av en meltype omfordeler
  *innenfor* melmengden, bryter ikke totalvekten.

Reglene MÅ være eksplisitte i koden og synlige/forutsigbare for brukeren.

## Bevisst UTE av B1 (→ B1.5)

- **DDT (Desired Dough Temperature):** beregn nødvendig vanntemperatur fra
  rom-/meltemp + friksjonsfaktor. Lineær, enkel — men et tillegg, ikke kjerne.
- **Bassinage:** splitt vann i hovedvann + justeringsvann. Prosess-hjelp, ikke
  korrekthetskrav.

Disse legges til i B1.5 uten å endre kjernemodellen (begge er avledninger oppå
eksisterende vann-/temperaturtall).

## Bevisst UTE av B1 (→ senere epics)

- Lagring, oppskrifter, auth (B2). Bake-logg (B3). Sosialt (B4).
- Volum-enheter (kun gram i B1).
