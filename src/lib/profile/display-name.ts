/*
 * displayNameFor — gjenbrukbar VISNINGS-fallback for profilnavn (Geirs beslutning
 * 2026-08-24, overstyrer «Anonym»-fallbacken).
 *
 * Brukere uten valgt visningsnavn vises som «stormtrooper-NNN», der NNN er et
 * STABILT tresifret nummer (100–999) utledet deterministisk fra profil-/bruker-
 * id — samme hver gang, aldri fra e-post (personvern, Geirs D5).
 *
 * VIKTIG: dette er kun visning. `display_name` i databasen forblir NULL til
 * brukeren velger noe selv (getProfile/updateProfile rører ikke dette).
 *
 * E5/E6 SKAL bruke denne når de rendrer andres bidrag, så fallbacken er lik
 * overalt.
 */

// djb2-hash → stabilt tall i [100, 999]. Rent deterministisk av id-strengen.
function stableNumber(id: string): number {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 33) ^ id.charCodeAt(i);
  }
  // >>> 0 gir usignert 32-bit; mod 900 + 100 → 100–999.
  return ((hash >>> 0) % 900) + 100;
}

export function stormtrooperName(id: string): string {
  return `stormtrooper-${stableNumber(id)}`;
}

type ProfileLike = { id: string; displayName: string | null };

export function displayNameFor(profile: ProfileLike): string {
  const chosen = profile.displayName?.trim();
  return chosen && chosen.length > 0 ? chosen : stormtrooperName(profile.id);
}
