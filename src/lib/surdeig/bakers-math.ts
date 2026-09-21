/**
 * Surdeigskalkulator — ren beregningskjerne (B1).
 *
 * Baker's percentages med TRUE HYDRATION: surdeigsstarteren regnes som
 * mel + vann, ikke en nøytral ingrediens. Hydrering-input tolkes som ØNSKET
 * true hydration; kalkulatoren regner ut hvor mye vann som faktisk skal
 * tilsettes (helles i bollen) etter at starterens vannbidrag er trukket fra.
 *
 * Ingen sideeffekter. All matematikk er isolert testbar.
 *
 * Sentrale definisjoner (jf. openspec b1-surdeig-kalkulator/design.md):
 *   starterMel   = starterVekt / (1 + h/100)      // h = starterhydrering %
 *   starterVann  = starterVekt - starterMel
 *   totalMel     = tilsattMel + starterMel
 *   totalVann    = totalMel * (H/100)             // H = ønsket true hydration %
 *   tilsattVann  = totalVann - starterVann        // det brukeren heller i bollen
 *   salt         = totalMel * (saltPct/100)       // mot TOTAL mel, ikke tilsatt
 */

export interface FlourType {
  /** Navn på meltypen, f.eks. "Hvetemel", "Rug". */
  name: string;
  /** Andel av tilsatt mel i prosent. Alle meltypers andeler summerer til 100. */
  percent: number;
}

export interface StarterSpec {
  /** Total startervekt i gram (mel + vann). */
  weight: number;
  /** Starterens egen hydrering i prosent (default 100 = 50/50 mel/vann). */
  hydrationPct: number;
}

export type CalcMode = "fromFlour" | "fromTotalWeight";

export interface RecipeInput {
  /** Ønsket true hydration i prosent (styrende input). */
  trueHydrationPct: number;
  /** Saltprosent, regnet mot TOTAL mel. */
  saltPct: number;
  /** Surdeigsstarter. */
  starter: StarterSpec;
  /** Meltyper med andels-% (summerer til 100). */
  flours: FlourType[];
  /** Beregningsmodus. */
  mode: CalcMode;
  /**
   * Uavrundet base. I fromFlour: tilsatt mel i gram.
   * I fromTotalWeight: ønsket ferdig deigvekt i gram.
   */
  baseValue: number;
}

export interface FlourResult {
  name: string;
  percent: number;
  grams: number;
}

export interface RecipeResult {
  /** Uavrundet tilsatt mel (source of truth). */
  addedFlour: number;
  /** Utskilt mel i starteren. */
  starterFlour: number;
  /** Utskilt vann i starteren. */
  starterWater: number;
  /** Tilsatt mel + starter-mel. */
  totalFlour: number;
  /** Vann som faktisk skal tilsettes (helles i bollen). */
  addedWater: number;
  /** Totalt vann (tilsatt + starter-vann). */
  totalWater: number;
  /** Salt i gram (mot total mel). */
  salt: number;
  /** Startervekt (uendret fra input). */
  starterWeight: number;
  /** Faktisk true hydration (skal være lik input-H). */
  trueHydration: number;
  /** Ferdig deigvekt (tilsatt mel + tilsatt vann + salt + starter). */
  doughWeight: number;
  /** Fordeling av tilsatt mel per meltype. */
  flours: FlourResult[];
}

/** Del startervekt i mel + vann ut fra starterens hydrering. */
export function splitStarter(starter: StarterSpec): { flour: number; water: number } {
  const h = starter.hydrationPct;
  const flour = starter.weight / (1 + h / 100);
  const water = starter.weight - flour;
  return { flour, water };
}

/**
 * Kjerneberegning fra TILSATT MEL (uavrundet base).
 * Alle andre poster avledes herfra.
 */
export function computeFromAddedFlour(
  addedFlour: number,
  input: Omit<RecipeInput, "mode" | "baseValue">,
): RecipeResult {
  const { flour: starterFlour, water: starterWater } = splitStarter(input.starter);

  const totalFlour = addedFlour + starterFlour;
  const totalWater = totalFlour * (input.trueHydrationPct / 100);
  const addedWater = totalWater - starterWater;
  const salt = totalFlour * (input.saltPct / 100);

  const doughWeight = addedFlour + addedWater + salt + input.starter.weight;
  const trueHydration = totalFlour > 0 ? (totalWater / totalFlour) * 100 : 0;

  const flours: FlourResult[] = input.flours.map((f) => ({
    name: f.name,
    percent: f.percent,
    grams: addedFlour * (f.percent / 100),
  }));

  return {
    addedFlour,
    starterFlour,
    starterWater,
    totalFlour,
    addedWater,
    totalWater,
    salt,
    starterWeight: input.starter.weight,
    trueHydration,
    doughWeight,
    flours,
  };
}

/**
 * Løs tilsatt mel bakover fra ønsket ferdig deigvekt T.
 *
 * doughWeight = addedFlour + addedWater + salt + starterWeight
 * der:
 *   totalFlour  = addedFlour + starterFlour
 *   totalWater  = totalFlour * H/100
 *   addedWater  = totalWater - starterWater
 *   salt        = totalFlour * saltPct/100
 *
 * Sett h = H/100, s = saltPct/100. Da:
 *   doughWeight = addedFlour
 *               + ((addedFlour + starterFlour)*h - starterWater)
 *               + (addedFlour + starterFlour)*s
 *               + starterWeight
 *
 * Isolér addedFlour:
 *   T = addedFlour*(1 + h + s) + starterFlour*(h + s) - starterWater + starterWeight
 *   addedFlour = (T - starterFlour*(h+s) + starterWater - starterWeight) / (1 + h + s)
 */
export function solveAddedFlourFromDough(
  doughWeight: number,
  input: Omit<RecipeInput, "mode" | "baseValue">,
): number {
  const { flour: starterFlour, water: starterWater } = splitStarter(input.starter);
  const h = input.trueHydrationPct / 100;
  const s = input.saltPct / 100;
  const numerator =
    doughWeight - starterFlour * (h + s) + starterWater - input.starter.weight;
  const denominator = 1 + h + s;
  return numerator / denominator;
}

/** Hovedinngang: beregn oppskrift fra input (begge moduser). */
export function calculate(input: RecipeInput): RecipeResult {
  const core = {
    trueHydrationPct: input.trueHydrationPct,
    saltPct: input.saltPct,
    starter: input.starter,
    flours: input.flours,
  };

  const addedFlour =
    input.mode === "fromFlour"
      ? input.baseValue
      : solveAddedFlourFromDough(input.baseValue, core);

  return computeFromAddedFlour(addedFlour, core);
}

/**
 * Avrund resultatet til hele gram for VISNING. Avrundingsavvik mot ønsket
 * totalvekt (i fromTotalWeight) absorberes i VANNET — mel og salt står urørt.
 */
export interface RoundedView {
  addedFlour: number;
  addedWater: number;
  salt: number;
  starterWeight: number;
  totalFlour: number;
  totalWater: number;
  trueHydration: number;
  doughWeight: number;
  flours: FlourResult[];
}

export function roundForDisplay(
  result: RecipeResult,
  targetDoughWeight?: number,
): RoundedView {
  const addedFlour = Math.round(result.addedFlour);
  const salt = Math.round(result.salt);
  const starterWeight = Math.round(result.starterWeight);
  const flours = result.flours.map((f) => ({ ...f, grams: Math.round(f.grams) }));

  let addedWater = Math.round(result.addedWater);

  // Absorbér avrundingsavvik i vannet når en totalvekt er låst.
  if (targetDoughWeight !== undefined) {
    const sumOthers = addedFlour + salt + starterWeight;
    addedWater = targetDoughWeight - sumOthers;
  }

  const doughWeight = addedFlour + addedWater + salt + starterWeight;
  const { water: starterWater } = splitStarter({
    weight: starterWeight,
    hydrationPct: result.totalWater > 0 ? result.starterWater !== 0
      ? (result.starterWater / (result.starterWeight - result.starterWater)) * 100
      : 100 : 100,
  });
  const totalWater = addedWater + starterWater;
  const totalFlour = addedFlour + (starterWeight - starterWater);
  const trueHydration = totalFlour > 0 ? (totalWater / totalFlour) * 100 : 0;

  return {
    addedFlour,
    addedWater,
    salt,
    starterWeight,
    totalFlour,
    totalWater,
    trueHydration,
    doughWeight,
    flours,
  };
}
