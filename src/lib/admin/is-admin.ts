/*
 * isAdmin — den ENE autoritative admin-sjekken (E4.5, design D1/D4).
 *
 * SIKKERHET: admin-grensen bor HER i server-laget, ikke i middleware og ikke i
 * RLS. Domenedata går via Drizzle (DATABASE_URL) som omgår RLS, så RLS kan ikke
 * være muren for admin-handlinger. Alle /admin-ruter og moderering-actions
 * SKAL gå gjennom denne sjekken (samme prinsipp som E3s /konto-guard).
 *
 * D1: admin-identitet er env-basert (ADMIN_USER_ID = Supabase auth-UUID), ikke
 * en role-kolonne. Oppgradering til roller senere bytter kun denne funksjonen —
 * kall-stedene (guards/actions) er stabile.
 *
 * D2: FAIL CLOSED. Mangler env, er den tom, eller er brukeren utlogget → false.
 * En feilkonfigurasjon stenger døra, den åpner den aldri.
 */
import { createClient } from "@/lib/supabase/server";

/** True kun hvis env-satt ADMIN_USER_ID matcher gitt bruker-id. Fail closed. */
export function isAdminId(userId: string | null | undefined): boolean {
  const adminId = process.env.ADMIN_USER_ID?.trim();
  if (!adminId) return false; // env mangler/tom → ingen er admin
  if (!userId) return false; // ingen bruker → ikke admin
  return userId === adminId;
}

/**
 * Henter innlogget bruker (validert mot Supabase) og avgjør om den er admin.
 * Bruk i /admin-guards og moderering-actions. Fail closed på alle feilstier.
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return isAdminId(user?.id);
  } catch {
    // Klientfabrikk-feil (manglende env e.l.) → fail closed.
    return false;
  }
}
