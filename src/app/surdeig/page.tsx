/*
 * /surdeig — åpen surdeigskalkulator (B1). Ingen auth, ingen database.
 * Server-skall + client-kalkulator. All matematikk i @/lib/surdeig/bakers-math;
 * denne ruten regner ingenting selv.
 *
 * Design: Claude Design «E · Kvittering» (zine/kvittering). Steps/StarRating/
 * Comments/TempField er bevisst UTE av B1 (senere epics) — se OpenSpec
 * b1-surdeig-kalkulator.
 */
import type { Metadata } from "next";
import { SurdeigCalculator } from "./SurdeigCalculator";

export const metadata: Metadata = {
  title: "Surdeig — geish.no",
  description:
    "Surdeigskalkulator med baker's prosent og true hydration. Still inn deigen, kvitteringen skriver seg selv.",
};

export default function SurdeigPage() {
  return <SurdeigCalculator />;
}
