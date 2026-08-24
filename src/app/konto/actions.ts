/*
 * updateProfile — server action for profiloppdatering (design D6).
 *
 * SIKKERHET: den autoritative eier-sjekken bor HER, ikke i RLS. getUser()
 * validerer sesjonen mot Supabase (autoritativt), og Drizzle-skrivingen har
 * `where id = user.id` — Drizzle-tilkoblingen (DATABASE_URL) omgår RLS, så
 * `where`-en er det som gjør at en bruker kun kan endre EGEN rad.
 *
 * Domenedata skrives via Drizzle (src/db), aldri via Supabase JS.
 *
 * D1 (Geir): visningsnavn er FRITT, ikke unikt. Ved lagring gjør vi en enkel
 * oppslags-sjekk og returnerer en IKKE-BLOKKERENDE advarsel hvis navnet er i
 * bruk av noen andre — vi lagrer likevel.
 *
 * D5 (Geir): tomt navn/bio lagres som NULL. Navn avledes aldri fra e-post.
 */
"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = {
  status: "idle" | "success" | "error";
  // Feltnøkkel mot profil-slicen i no.ts (ingen hardkodet copy i UI).
  message?:
    | "saved"
    | "nameInUse"
    | "unauthenticated"
    | "displayNameTooShort"
    | "displayNameTooLong"
    | "bioTooLong";
};

// Tom streng → NULL (D5: navnløs = NULL, aldri avledet). Trim whitespace.
const displayNameSchema = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? null : v))
  .refine((v) => v === null || v.length >= 2, "displayNameTooShort")
  .refine((v) => v === null || v.length <= 40, "displayNameTooLong");

const bioSchema = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? null : v))
  .refine((v) => v === null || v.length <= 300, "bioTooLong");

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "unauthenticated" };
  }

  const nameResult = displayNameSchema.safeParse(
    formData.get("display_name") ?? "",
  );
  if (!nameResult.success) {
    const code = nameResult.error.issues[0]?.message;
    return {
      status: "error",
      message: code === "displayNameTooLong" ? "displayNameTooLong" : "displayNameTooShort",
    };
  }

  const bioResult = bioSchema.safeParse(formData.get("bio") ?? "");
  if (!bioResult.success) {
    return { status: "error", message: "bioTooLong" };
  }

  const displayName = nameResult.data;
  const bio = bioResult.data;

  // D1: ikke-blokkerende «navnet er i bruk»-sjekk (kun når navn er satt).
  let nameInUse = false;
  if (displayName !== null) {
    const [clash] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(and(eq(profiles.displayName, displayName), ne(profiles.id, user.id)))
      .limit(1);
    nameInUse = Boolean(clash);
  }

  // Autoritativ eier-avgrenset skriving. updated_at bumpes av DB-trigger (D7).
  await db
    .update(profiles)
    .set({ displayName, bio })
    .where(eq(profiles.id, user.id));

  revalidatePath("/konto");

  return {
    status: "success",
    message: nameInUse ? "nameInUse" : "saved",
  };
}
