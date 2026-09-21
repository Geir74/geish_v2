import { describe, it, expect } from "vitest";
import {
  splitStarter,
  computeFromAddedFlour,
  solveAddedFlourFromDough,
  calculate,
  roundForDisplay,
  type RecipeInput,
} from "./bakers-math";

const baseCore = {
  trueHydrationPct: 75,
  saltPct: 2,
  starter: { weight: 200, hydrationPct: 100 },
  flours: [{ name: "Hvetemel", percent: 100 }],
};

describe("splitStarter", () => {
  it("100% hydrering deler 200g i 100g mel + 100g vann", () => {
    const { flour, water } = splitStarter({ weight: 200, hydrationPct: 100 });
    expect(flour).toBeCloseTo(100, 6);
    expect(water).toBeCloseTo(100, 6);
  });

  it("50% hydrering (stiff starter) deler 150g i 100g mel + 50g vann", () => {
    const { flour, water } = splitStarter({ weight: 150, hydrationPct: 50 });
    expect(flour).toBeCloseTo(100, 6);
    expect(water).toBeCloseTo(50, 6);
  });
});

describe("true hydration — Hugins kjernekrav", () => {
  it("1000g tilsatt mel, 200g starter@100%, ønsket 75% → tilsatt vann = 725g", () => {
    const r = computeFromAddedFlour(1000, baseCore);
    expect(r.starterFlour).toBeCloseTo(100, 6);
    expect(r.starterWater).toBeCloseTo(100, 6);
    expect(r.totalFlour).toBeCloseTo(1100, 6);
    expect(r.totalWater).toBeCloseTo(825, 6);
    expect(r.addedWater).toBeCloseTo(725, 6); // det brukeren heller i bollen
  });

  it("true hydration vises som 75%, ikke naiv 72.5%", () => {
    const r = computeFromAddedFlour(1000, baseCore);
    expect(r.trueHydration).toBeCloseTo(75, 6);
    // naiv ville vært 725/1000 = 72.5
    expect(r.addedWater / r.addedFlour * 100).toBeCloseTo(72.5, 6);
  });

  it("starterhydrering ≠ 100% justerer tilsatt vann men holder true hydration", () => {
    const r = computeFromAddedFlour(1000, {
      ...baseCore,
      starter: { weight: 150, hydrationPct: 50 }, // 100g mel + 50g vann
    });
    expect(r.starterFlour).toBeCloseTo(100, 6);
    expect(r.starterWater).toBeCloseTo(50, 6);
    expect(r.totalFlour).toBeCloseTo(1100, 6);
    expect(r.totalWater).toBeCloseTo(825, 6);
    expect(r.addedWater).toBeCloseTo(775, 6); // 825 - 50
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
      starter: { weight: 0, hydrationPct: 100 },
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

describe("toveis: fromTotalWeight løser mel bakover", () => {
  it("deigvekt fra fromFlour kan løses tilbake til samme tilsatt mel", () => {
    const forward = computeFromAddedFlour(1000, baseCore);
    const solvedFlour = solveAddedFlourFromDough(forward.doughWeight, baseCore);
    expect(solvedFlour).toBeCloseTo(1000, 4);
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
  it("dobling av mel dobler vann, salt og bevarer true hydration", () => {
    const single = computeFromAddedFlour(1000, baseCore);
    const doubled = computeFromAddedFlour(2000, {
      ...baseCore,
      starter: { weight: 400, hydrationPct: 100 }, // starter skalerer også
    });
    expect(doubled.addedWater).toBeCloseTo(single.addedWater * 2, 4);
    expect(doubled.salt).toBeCloseTo(single.salt * 2, 4);
    expect(doubled.trueHydration).toBeCloseTo(single.trueHydration, 6);
  });
});

describe("avrunding absorberes i vannet", () => {
  it("låst totalvekt: differansen havner i vann, mel+salt urørt", () => {
    // Velg tall som gir brøkdeler
    const core = {
      trueHydrationPct: 72,
      saltPct: 2.1,
      starter: { weight: 137, hydrationPct: 100 },
      flours: [{ name: "Hvete", percent: 100 }],
    };
    const target = 1000;
    const solvedFlour = solveAddedFlourFromDough(target, core);
    const result = computeFromAddedFlour(solvedFlour, core);
    const view = roundForDisplay(result, target);

    const sum = view.addedFlour + view.addedWater + view.salt + view.starterWeight;
    expect(sum).toBe(target); // treffer eksakt
    // mel og salt er rene avrundinger av de faktiske verdiene
    expect(view.addedFlour).toBe(Math.round(result.addedFlour));
    expect(view.salt).toBe(Math.round(result.salt));
  });
});
