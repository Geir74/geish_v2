/*
 * SurdeigCalculator — client-komponent (B1). Kobler design-UI til den rene
 * motoren @/lib/surdeig/bakers-math. All matematikk skjer i motoren; denne
 * komponenten holder input-state og viser avledet resultat i kvitteringen.
 *
 * Source of truth: baseFlourWeight (uavrundet) i fromFlour, eller ønsket
 * deigvekt i fromTotalWeight — begge går inn i calculate().
 *
 * B1-scope: melblanding, andre ingredienser, forhold (hydrering/surdeig/salt),
 * kvittering. Temp/steg/stjerner/kommentarer er senere epics og er utelatt her.
 */
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  calculate,
  roundForDisplay,
  type FlourType,
  type RecipeInput,
} from "@/lib/surdeig/bakers-math";
import styles from "./page.module.css";

const PATTERNS = [
  styles.pat0,
  styles.pat1,
  styles.pat2,
  styles.pat3,
  styles.pat4,
  styles.pat5,
];

interface Extra {
  name: string;
  percent: number;
}

// Parse "70" eller "72,5" → tall; tom → 0.
function num(v: string): number {
  const parsed = parseFloat(v.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function SurdeigCalculator() {
  const [mode, setMode] = useState<"fromFlour" | "fromTotalWeight">(
    "fromTotalWeight",
  );
  const [doughWeight, setDoughWeight] = useState("1800");
  const [addedFlour, setAddedFlour] = useState("1000");
  const [flours, setFlours] = useState<FlourType[]>([
    { name: "Hvete", percent: 70 },
    { name: "Sammalt rug", percent: 20 },
    { name: "Spelt", percent: 10 },
  ]);
  const [extras, setExtras] = useState<Extra[]>([
    { name: "Solsikkefrø", percent: 10 },
    { name: "Honning", percent: 3 },
  ]);
  const [hydration, setHydration] = useState("75");
  const [levain, setLevain] = useState("20");
  const [salt, setSalt] = useState("2");

  // Beregn via motoren. Starter-vekt utledes fra levain-% av total mel;
  // for fromFlour er baseValue tilsatt mel, for fromTotalWeight er det deigvekt.
  const result = useMemo(() => {
    const levainPct = num(levain);
    const baseValue =
      mode === "fromFlour" ? num(addedFlour) : num(doughWeight);

    // Startervekt = levain-% av tilsatt mel. I fromTotalWeight kjenner vi ikke
    // tilsatt mel ennå, så vi løser iterativt: motoren tar starter som fast
    // vekt. Vi estimerer tilsatt mel først, så justerer starter, så beregner.
    const estimateFlour =
      mode === "fromFlour"
        ? num(addedFlour)
        : num(doughWeight) / (1 + num(hydration) / 100 + num(salt) / 100 + levainPct / 100);
    const starterWeight = estimateFlour * (levainPct / 100);

    const input: RecipeInput = {
      trueHydrationPct: num(hydration),
      saltPct: num(salt),
      starter: { weight: starterWeight, hydrationPct: 100 },
      flours,
      mode,
      baseValue,
    };
    const r = calculate(input);
    const target = mode === "fromTotalWeight" ? num(doughWeight) : undefined;
    const view = roundForDisplay(r, target);

    const extraGrams = extras.map((e) => ({
      name: e.name,
      grams: Math.round(view.totalFlour * (e.percent / 100)),
    }));

    return { view, extraGrams };
  }, [mode, doughWeight, addedFlour, flours, extras, hydration, levain, salt]);

  const { view, extraGrams } = result;
  const flourSum = flours.reduce((s, f) => s + f.percent, 0);

  const updateFlour = (i: number, patch: Partial<FlourType>) =>
    setFlours((fs) => fs.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  const removeFlour = (i: number) =>
    setFlours((fs) => fs.filter((_, idx) => idx !== i));
  const addFlour = () =>
    setFlours((fs) => [...fs, { name: "", percent: 0 }]);

  const updateExtra = (i: number, patch: Partial<Extra>) =>
    setExtras((xs) => xs.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const removeExtra = (i: number) =>
    setExtras((xs) => xs.filter((_, idx) => idx !== i));
  const addExtra = () => setExtras((xs) => [...xs, { name: "", percent: 0 }]);

  return (
    <div className={styles.surdeig}>
      <header className={`${styles.hero} torn-bottom`}>
        <div className={styles.heroMeta}>
          <Link href="/">← geish.no</Link>
          <span>Bakehjørnet · nr. 07</span>
        </div>
        <div className={styles.heroRow}>
          <h1 className={styles.heroTitle}>SURDEIG</h1>
          <div className={styles.heroText}>
            <span className={styles.heroTag}>regnestykket, ikke magien.</span>
            <span className={styles.heroSub}>
              Still inn deigen til venstre. Kvitteringen skriver seg selv.
            </span>
          </div>
        </div>
        <div className={styles.stampRound} aria-hidden="true">
          GRAM
          <br />
          FOR
          <br />
          GRAM
        </div>
      </header>

      <main className={styles.layout}>
        {/* CalcCard */}
        <form className={styles.card} aria-label="Deig" onSubmit={(e) => e.preventDefault()}>
          {/* 01 Deigvekt / melmengde */}
          <section className={`${styles.sec} ${styles.secFull}`}>
            <div className={styles.secHead}>
              <label className={styles.secTitle} htmlFor="base">
                {mode === "fromTotalWeight" ? "01 · Deigvekt" : "01 · Melmengde"}
              </label>
              <button
                type="button"
                className={styles.secHint}
                onClick={() =>
                  setMode((m) =>
                    m === "fromTotalWeight" ? "fromFlour" : "fromTotalWeight",
                  )
                }
              >
                bytt: {mode === "fromTotalWeight" ? "fra deigvekt" : "fra mel"} ⇄
              </button>
            </div>
            <div className={styles.dough}>
              <button
                type="button"
                className={styles.btnStep}
                aria-label="100 gram mindre"
                onClick={() =>
                  mode === "fromTotalWeight"
                    ? setDoughWeight((v) => String(Math.max(0, num(v) - 100)))
                    : setAddedFlour((v) => String(Math.max(0, num(v) - 100)))
                }
              >
                −
              </button>
              <div className={styles.doughField}>
                <input
                  id="base"
                  inputMode="numeric"
                  value={mode === "fromTotalWeight" ? doughWeight : addedFlour}
                  onChange={(e) =>
                    mode === "fromTotalWeight"
                      ? setDoughWeight(e.target.value)
                      : setAddedFlour(e.target.value)
                  }
                />
                <span>g</span>
              </div>
              <button
                type="button"
                className={styles.btnStep}
                aria-label="100 gram mer"
                onClick={() =>
                  mode === "fromTotalWeight"
                    ? setDoughWeight((v) => String(num(v) + 100))
                    : setAddedFlour((v) => String(num(v) + 100))
                }
              >
                +
              </button>
            </div>
          </section>

          {/* 02 Melblanding */}
          <section className={styles.sec}>
            <div className={styles.secHead}>
              <h2 className={styles.secTitle}>02 · Melblanding</h2>
              <span className={styles.secHint}>
                sum {flourSum}%{flourSum !== 100 ? " ⚠" : ""}
              </span>
            </div>
            <div className={styles.flourbar} aria-hidden="true">
              {flours.map((f, i) => (
                <i
                  key={i}
                  className={PATTERNS[i % PATTERNS.length]}
                  style={{ width: `${f.percent}%` }}
                />
              ))}
            </div>
            {flours.map((f, i) => (
              <div className={styles.row} key={i}>
                <span
                  className={`${styles.rowSwatch} ${PATTERNS[i % PATTERNS.length]}`}
                  aria-hidden="true"
                />
                <input
                  className={styles.rowName}
                  aria-label={`Meltype ${i + 1}`}
                  value={f.name}
                  onChange={(e) => updateFlour(i, { name: e.target.value })}
                />
                <span className={styles.pct}>
                  <input
                    inputMode="decimal"
                    aria-label={`Andel ${i + 1} i prosent`}
                    value={String(f.percent)}
                    onChange={(e) =>
                      updateFlour(i, { percent: num(e.target.value) })
                    }
                  />
                  <span>%</span>
                </span>
                <button
                  type="button"
                  className={styles.btnRemove}
                  aria-label={`Fjern ${f.name || "meltype"}`}
                  onClick={() => removeFlour(i)}
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className={styles.btnAdd} onClick={addFlour}>
              + Legg til mel
            </button>
          </section>

          {/* 03 Andre ingredienser */}
          <section className={styles.sec}>
            <div className={styles.secHead}>
              <h2 className={styles.secTitle}>03 · Andre ingredienser</h2>
              <span className={styles.secHint}>% av mel</span>
            </div>
            {extras.map((x, i) => (
              <div className={styles.row} key={i}>
                <span className={styles.rowPlus} aria-hidden="true">
                  +
                </span>
                <input
                  className={styles.rowName}
                  aria-label={`Ingrediens ${i + 1}`}
                  value={x.name}
                  placeholder="frø, honning, olje …"
                  onChange={(e) => updateExtra(i, { name: e.target.value })}
                />
                <span className={styles.pct}>
                  <input
                    inputMode="decimal"
                    aria-label={`Mengde ${i + 1} i prosent av mel`}
                    value={String(x.percent)}
                    onChange={(e) =>
                      updateExtra(i, { percent: num(e.target.value) })
                    }
                  />
                  <span>%</span>
                </span>
                <button
                  type="button"
                  className={styles.btnRemove}
                  aria-label={`Fjern ${x.name || "ingrediens"}`}
                  onClick={() => removeExtra(i)}
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className={styles.btnAdd} onClick={addExtra}>
              + Legg til ingrediens
            </button>
          </section>

          {/* 04 Forhold */}
          <section className={styles.sec}>
            <h2 className={styles.secTitle}>04 · Forhold</h2>
            <div className={styles.ratios}>
              <div className={styles.ratio}>
                <label htmlFor="hyd">Hydrering</label>
                <div className={styles.ratioVal}>
                  <input
                    id="hyd"
                    inputMode="decimal"
                    value={hydration}
                    onChange={(e) => setHydration(e.target.value)}
                  />
                  <span>%</span>
                </div>
                <div className={styles.ratioBtns}>
                  <button type="button" className={styles.btnStep} aria-label="Mindre hydrering" onClick={() => setHydration((v) => String(num(v) - 1))}>−</button>
                  <button type="button" className={styles.btnStep} aria-label="Mer hydrering" onClick={() => setHydration((v) => String(num(v) + 1))}>+</button>
                </div>
              </div>
              <div className={styles.ratio}>
                <label htmlFor="lev">Surdeig</label>
                <div className={styles.ratioVal}>
                  <input
                    id="lev"
                    inputMode="decimal"
                    value={levain}
                    onChange={(e) => setLevain(e.target.value)}
                  />
                  <span>%</span>
                </div>
                <div className={styles.ratioBtns}>
                  <button type="button" className={styles.btnStep} aria-label="Mindre surdeig" onClick={() => setLevain((v) => String(num(v) - 1))}>−</button>
                  <button type="button" className={styles.btnStep} aria-label="Mer surdeig" onClick={() => setLevain((v) => String(num(v) + 1))}>+</button>
                </div>
              </div>
              <div className={styles.ratio}>
                <label htmlFor="salt">Salt</label>
                <div className={styles.ratioVal}>
                  <input
                    id="salt"
                    inputMode="decimal"
                    value={salt}
                    onChange={(e) => setSalt(e.target.value)}
                  />
                  <span>%</span>
                </div>
                <div className={styles.ratioBtns}>
                  <button type="button" className={styles.btnStep} aria-label="Mindre salt" onClick={() => setSalt((v) => String(num(v) - 0.5))}>−</button>
                  <button type="button" className={styles.btnStep} aria-label="Mer salt" onClick={() => setSalt((v) => String(num(v) + 0.5))}>+</button>
                </div>
              </div>
            </div>
          </section>
        </form>

        {/* Receipt */}
        <aside className={styles.receiptWrap} aria-label="Vei opp">
          <span className={styles.stampLabel} aria-hidden="true">
            VEI OPP
          </span>
          <div className={`${styles.receipt} torn-bottom`}>
            <div className={styles.receiptHead}>
              Bakehjørnet · geish.no
              <br />
              kvittering for deig
            </div>
            <ul className={styles.receiptList} aria-live="polite">
              {view.flours.map((f, i) => (
                <li className={styles.line} key={`f${i}`}>
                  <span>{f.name || "Mel"}</span>
                  <span className={styles.lineDots} />
                  <span className={styles.lineG}>{f.grams} g</span>
                </li>
              ))}
              <li className={styles.line}>
                <span>Vann</span>
                <span className={styles.lineDots} />
                <span className={styles.lineG}>{view.addedWater} g</span>
              </li>
              <li className={styles.line}>
                <span>Surdeig</span>
                <span className={styles.lineDots} />
                <span className={styles.lineG}>{view.starterWeight} g</span>
              </li>
              <li className={styles.line}>
                <span>Salt</span>
                <span className={styles.lineDots} />
                <span className={styles.lineG}>{view.salt} g</span>
              </li>
              {extraGrams.map((e, i) => (
                <li className={styles.line} key={`x${i}`}>
                  <span>{e.name || "Ingrediens"}</span>
                  <span className={styles.lineDots} />
                  <span className={styles.lineG}>{e.grams} g</span>
                </li>
              ))}
            </ul>
            <div className={styles.sum}>
              <span className={styles.sumLabel}>Sum</span>
              <span className={styles.sumG}>
                {view.doughWeight +
                  extraGrams.reduce((s, e) => s + e.grams, 0)}{" "}
                g
              </span>
            </div>
            <div className={styles.hydNote}>
              sann hydrering: {view.trueHydration.toFixed(1)}%
            </div>
            <div className={styles.receiptFoot}>* * * takk for handelen * * *</div>
          </div>
        </aside>
      </main>
    </div>
  );
}
