## 1. Beregningsmodul (ren matematikk)

- [ ] 1.1 Opprett `src/lib/surdeig/bakers-math.ts` med typer: `Recipe`,
  `FlourType` (navn + andel-%), `Starter` (vekt + hydrering-%), moduser
  `fromFlour | fromTotalWeight`
- [ ] 1.2 Implementer baker's %-beregning: total mel = 100 %, vann/salt/starter
  som % av total mel, flere meltyper summerer til 100 %
- [ ] 1.3 Implementer **true hydration**: skill ut mel + vann i starteren
  (`starterMel = vekt / (1 + h/100)`, `starterVann = vekt - starterMel`), legg
  til total mel/vann, returner true hydration som primær hydreringsverdi
- [ ] 1.4 Implementer toveis: `fromFlour` (mel → alt) og `fromTotalWeight`
  (`mel = T / (1 + Σprosent)`), begge skriver til uavrundet `baseFlourWeight`
- [ ] 1.5 Implementer skalering (endre mel/totalvekt → proporsjonal reberegning)
- [ ] 1.6 Implementer avrundingsregel: differanse etter gram-avrunding
  absorberes i vann, aldri i mel/salt

## 2. Enhetstester (matematikken er isolert testbar)

- [ ] 2.1 Opprett `src/lib/surdeig/bakers-math.test.ts`
- [ ] 2.2 Test: én meltype (1000 g, 70 %, 2 % → 700 g vann, 20 g salt)
- [ ] 2.3 Test: flere meltyper (70/30 hvete/rug summerer til total mel)
- [ ] 2.4 Test: **true hydration** (1000 g mel + 700 g vann + 200 g starter@100 %
  → ~72,7 %, IKKE 70 %)
- [ ] 2.5 Test: starterhydrering ≠ 100 % gir riktig utskilt mel/vann
- [ ] 2.6 Test: `fromTotalWeight` løser mel korrekt bakover
- [ ] 2.7 Test: avrundingsavvik havner i vann, mel/salt urørt
- [ ] 2.8 Test: skalering bevarer prosenter

## 3. Klientside store (single source of truth)

- [ ] 3.1 Opprett recipe-store med uavrundet `baseFlourWeight` som eneste base
  + prosent-sett + mode-flag
- [ ] 3.2 Alle viste verdier er avledede selektorer fra basen (ingen komponent
  skriver til annen komponent)
- [ ] 3.3 Brukerinput → eksplisitte transform-funksjoner som oppdaterer basen
- [ ] 3.4 Definér og implementer lås-regler for flere meltyper (endring av én
  meltype omfordeler forutsigbart; dokumentér valgt regel i UI-tekst/kommentar)

## 4. UI-komponenter

- [ ] 4.1 `ModeToggle` (fromFlour | fromTotalWeight)
- [ ] 4.2 `FlourInputs` (legg til/fjern meltyper, andel-% eller gram)
- [ ] 4.3 `HydrationInputs` (vann-%, salt-%, starter-vekt + starter-hydrering-%)
- [ ] 4.4 `PercentageDisplay` (read-only baker's % + **true hydration** tydelig
  merket)
- [ ] 4.5 `ScalingControl` (endre totalvekt/melmengde)
- [ ] 4.6 Gjenbruk eksisterende design-tokens (ingen nye globale tokens)

## 5. Rute + integrasjon

- [ ] 5.1 Opprett åpen rute `src/app/surdeig/page.tsx` (server-skall, ingen auth)
- [ ] 5.2 Verifiser at ingen Supabase/auth-kall skjer på ruten
- [ ] 5.3 Lenk prosjektkort/forside-seksjon til `/surdeig`

## 6. Verifisering

- [ ] 6.1 `npm run lint` + `npm run build` grønt
- [ ] 6.2 Alle enhetstester grønne
- [ ] 6.3 Manuell test: anonym bruker, alle scenarier fra spec (true hydration
  vises korrekt, toveis fungerer, avrunding treffer totalvekt)
- [ ] 6.4 `openspec validate b1-surdeig-kalkulator --strict` grønt
