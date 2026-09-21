import { describe, it, expect } from "vitest";
import {
  splitStarter,
  computeFromAddedFlour,
  solveAddedFlourFromDough,
  calculate,
  roundForDisplay,
  type RecipeInput,
} from "./bakers-math";

// baseCore: starter = 20 % av tilsatt mel, 100 % hydrering.
const baseCore = {
  trueHydrationPct: 75,
  saltPct: 2,
  starter: { percent: 20, hydrationPct: 100 },
  flours: [{ name: "Hvetemel", percent: 100 }],
};

describe("splitStarter", () => {
  it("20% av 1000g @100% hydrering → 200g starter = 100g mel + 100g vann", () => {
    const { weight, flour, water } = splitStarter(
      { percent: 20, hydrationPct: 100 },
      1000,
    );
    expect(weight).toBeCloseTo(200, 6);
    expect(flour).toBeCloseTo(100, 6);
    expect(water).toBeCloseTo(100, 6);
  });

  it("stiff starter 50% hydrering: 15% av 1000g = 150g → 100g mel + 50g vann", () => {
    const { flour, water } = splitStarter({ percent: 15, hydrationPct: 50 }, 1000);
    expect(flour).toBeCloseTo(100, 6);
    expect(water).toBeCloseTo(50, 6);
  });
});

describe("true hydration — Hugins kjernekrav", () => {
  it("1000g tilsatt mel, 20% starter@100%, ønsket 75% → tilsatt vann = 725g", () => {
    const r = computeFromAddedFlour(1000, baseCore);
    expect(r.starterFlour).toBeCloseTo(100, 6);
    expect(r.starterWater).toBeCloseTo(100, 6);
    expect(r.totalFlour).toBeCloseTo(1100, 6);
    expect(r.totalWater).toBeCloseTo(825, 6);
    expect(r.addedWater).toBeCloseTo(725, 6);
  });

  it("true hydration vises som 75%, ikke naiv 72.5%", () => {
    const r = computeFromAddedFlour(1000, baseCore);
    expect(r.trueHydration).toBeCloseTo(75, 6);
    expect((r.addedWater / r.addedFlour) * 100).toBeCloseTo(72.5, 6);
  });

  it("stiff starter (50% hydr) justerer tilsatt vann men holder true hydration", () => {
    const r = computeFromAddedFlour(1000, {
      ...baseCore,
      starter: { percent: 15, hydrationPct: 50 }, // 150g = 100g mel + 50g vann
    });
    expect(r.starterFlour).toBeCloseTo(100, 6);
    expect(r.starterWater).toBeCloseTo(50, 6);
    expect(r.totalFlour).toBeCloseTo(1100, 6);
    expect(r.totalWater).toBeCloseTo(825, 6);
    expect(r.addedWater).toBeCloseTo(775, 6);
    expect(r.trueHydration).toBeCloseTo(75, 6);
  });
});

describe("salt mot TOTAL mel — Hugins andre krav", () => {
  it("2% salt av total mel (1100g) = 22g, ikke 20g", () => {
    const r = computeFromAddedFlour(1000, baseCore);
    expect(r.salt).toBeCloseTo(22, 6);
  });

  it("uten starter: 2% av 1000g = 20g", () => {
    const r = computeFromAddedFlour(1000, {
      ...baseCore,
      starter: { percent: 0, hydrationPct: 100 },
    });
    expect(r.salt).toBeCloseTo(20, 6);
  });
});

describe("flere meltyper", () => {
  it("70% hvete / 30% rug av 1000g tilsatt mel → 700g / 300g", () => {
    const r = computeFromAddedFlour(1000, {
      ...baseCore,
      flours: [
        { name: "Hvete", percent: 70 },
        { name: "Rug", percent: 30 },
      ],
    });
    expect(r.flours[0].grams).toBeCloseTo(700, 6);
    expect(r.flours[1].grams).toBeCloseTo(300, 6);
  });
});

describe("toveis: fromTotalWeight treffer deigvekt EKSAKT (Hugin-fiks)", () => {
  it("solveAddedFlourFromDough → computeFromAddedFlour gir tilbake samme T", () => {
    const T = 1800;
    const solved = solveAddedFlourFromDough(T, baseCore);
    const r = computeFromAddedFlour(solved, baseCore);
    expect(r.doughWeight).toBeCloseTo(T, 4); // treffer på grammet, ingen divergens
  });

  it("høy starter + høy hydrering treffer også eksakt (der gammel bug var verst)", () => {
    const core = {
      trueHydrationPct: 85,
      saltPct: 2.2,
      starter: { percent: 35, hydrationPct: 100 },
      flours: [{ name: "Hvete", percent: 100 }],
    };
    const T = 1000;
    const solved = solveAddedFlourFromDough(T, core);
    const r = computeFromAddedFlour(solved, core);
    expect(r.doughWeight).toBeCloseTo(T, 4);
  });

  it("calculate() gir samme resultat i begge moduser for samme deig", () => {
    const fromFlour = calculate({
      ...baseCore,
      mode: "fromFlour",
      baseValue: 1000,
    } as RecipeInput);
    const fromTotal = calculate({
      ...baseCore,
      mode: "fromTotalWeight",
      baseValue: fromFlour.doughWeight,
    } as RecipeInput);
    expect(fromTotal.addedFlour).toBeCloseTo(1000, 4);
    expect(fromTotal.addedWater).toBeCloseTo(fromFlour.addedWater, 4);
    expect(fromTotal.salt).toBeCloseTo(fromFlour.salt, 4);
  });
});

describe("skalering", () => {
  it("dobling av mel dobler vann og salt, bevarer true hydration", () => {
    const single = computeFromAddedFlour(1000, baseCore);
    const doubled = computeFromAddedFlour(2000, baseCore);
    expect(doubled.addedWater).toBeCloseTo(single.addedWater * 2, 4);
    expect(doubled.salt).toBeCloseTo(single.salt * 2, 4);
    expect(doubled.starterWeight).toBeCloseTo(single.starterWeight * 2, 4);
    expect(doubled.trueHydration).toBeCloseTo(single.trueHydration, 6);
  });
});

describe("avrunding absorberes i vannet", () => {
  it("låst totalvekt: differansen havner i vann, mel+salt urørt", () => {
    const core = {
      trueHydrationPct: 72,
      saltPct: 2.1,
      starter: { percent: 18, hydrationPct: 100 },
      flours: [{ name: "Hvete", percent: 100 }],
    };
    const target = 1000;
    const solvedFlour = solveAddedFlourFromDough(target, core);
    const result = computeFromAddedFlour(solvedFlour, core);
    const view = roundForDisplay(result, target);

    const sum = view.addedFlour + view.addedWater + view.salt + view.starterWeight;
    expect(sum).toBe(target);
    expect(view.addedFlour).toBe(Math.round(result.addedFlour));
    expect(view.salt).toBe(Math.round(result.salt));
  });
});
