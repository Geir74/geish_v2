/*
 * getProfile — autoritativ server-side lesing av profildata via Drizzle
 * (design D5). Brukes av /konto nå, og av E5/E6 for å slå opp visningsnavn
 * når andres bidrag rendres.
 *
 * Domenedata går ALLTID via Drizzle (src/db), aldri via Supabase JS-klienten —
 * den er reservert for auth/realtime/storage.
 *
 * Defensivt sikkerhetsnett (design D2): normalt oppretter en Postgres-trigger
 * profilraden idet brukeren opprettes i auth.users. Skulle triggeren mangle i
 * et miljø, oppretter vi raden her med ON CONFLICT DO NOTHING — belte og
 * bukseseler, så innlogget bruker aldri står uten profil. display_name settes
 * IKKE (forblir NULL) — aldri avledet fra e-post (Geirs D5).
 */
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, type Profile } from "@/db/schema";

export async function getProfile(userId: string): Promise<Profile | null> {
  const [existing] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (existing) {
    return existing;
  }

  // Sikkerhetsnett: rad manglet (trigger ikke kjørt i dette miljøet).
  await db.insert(profiles).values({ id: userId }).onConflictDoNothing();

  const [created] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  return created ?? null;
}
