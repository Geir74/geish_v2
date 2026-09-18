/*
 * submitEntry — server action for gjestebok-innsending (E5, bolk 3).
 *
 * SIKKERHET / FLYT (design D1–D3):
 *  1. Honeypot (D3): usynlig felt `website`. Utfylt → bot → forkast STILLE
 *     (returner "suksess" til boten, men lagre ingenting).
 *  2. Valider navn + hilsen (lengde, ikke bare whitespace — matcher DB-CHECK).
 *  3. getUser() (autoritativt mot Supabase): innlogget → status=published +
 *     author_id; anonym → status=pending + author_id NULL.
 *  4. Skriv via Drizzle (omgår RLS; server-laget er autoritativt), revalider.
 *
 * Domenedata skrives via Drizzle (src/db), aldri via Supabase JS.
 * INGEN e-post samles inn (personvern D2).
 */
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { guestbookEntries } from "@/db/schema";
import { t } from "@/content/i18n";
import { createClient } from "@/lib/supabase/server";

export type SubmitResult = { ok: boolean; message: string };

// Trim + lengdekrav som speiler DB-CHECK (trim 1–60 / 1–2000).
const nameSchema = z
  .string()
  .trim()
  .min(1, "nameRequired")
  .max(60, "nameTooLong");
const bodySchema = z
  .string()
  .trim()
  .min(1, "messageRequired")
  .max(2000, "messageTooLong");

export async function submitEntry(formData: FormData): Promise<SubmitResult> {
  const G = t().gjestebok;

  // 1) Honeypot (D3): utfylt → bot. Forkast stille, lat som suksess.
  const honeypot = formData.get("website");
  if (typeof honeypot === "string" && honeypot.trim().length > 0) {
    return { ok: true, message: G.successPublished };
  }

  // 2) Valider.
  const nameParsed = nameSchema.safeParse(formData.get("author_name") ?? "");
  if (!nameParsed.success) {
    const key = nameParsed.error.issues[0]?.message as keyof typeof G.errors;
    return { ok: false, message: G.errors[key] ?? G.errors.generic };
  }
  const bodyParsed = bodySchema.safeParse(formData.get("body") ?? "");
  if (!bodyParsed.success) {
    const key = bodyParsed.error.issues[0]?.message as keyof typeof G.errors;
    return { ok: false, message: G.errors[key] ?? G.errors.generic };
  }

  // 3) Innlogget? Avgjør publiseringsvei (D1).
  let authorId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    authorId = user?.id ?? null;
  } catch {
    // Uten gyldig sesjon behandles innsendingen som anonym (pending).
    authorId = null;
  }
  const status = authorId ? "published" : "pending";

  // 4) Skriv via Drizzle + revalider.
  try {
    await db.insert(guestbookEntries).values({
      authorName: nameParsed.data,
      body: bodyParsed.data,
      status,
      authorId,
    });
  } catch {
    return { ok: false, message: G.errors.generic };
  }

  revalidatePath("/gjestebok");
  return {
    ok: true,
    message: authorId ? G.successPublished : G.successPending,
  };
}
