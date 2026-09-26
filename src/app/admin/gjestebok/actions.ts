/*
 * Admin-moderering av gjesteboka (E5, task 4.3/4.3b).
 *
 * SIKKERHET: isAdmin() FØR hver skriving (E4.5-mønster, fail closed). Domenedata
 * via Drizzle (omgår RLS) — admin-grensen bor HER i server-laget, ikke i RLS.
 *
 * updated_at settes EKSPLISITT ved hver endring (i tillegg til DB-triggeren) —
 * Hugin-merknad fra schema-review: gjør admin-endringer sporbare uansett vei.
 *
 * D4: vis (→published), skjul (→hidden), slett, rediger (navn/hilsen — rører
 * ALDRI status; kun retting av skrivefeil / fjerne sensitiv info).
 */
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { guestbookEntries } from "@/db/schema";
import { isAdmin } from "@/lib/admin/is-admin";

export type ModerationResult = { ok: boolean; error?: string };

function revalidateBoth() {
  revalidatePath("/admin/gjestebok");
  revalidatePath("/gjestebok");
}

const idSchema = z.string().uuid();

async function setStatus(
  id: string,
  status: "published" | "hidden",
): Promise<ModerationResult> {
  if (!(await isAdmin())) return { ok: false, error: "unauthorized" };
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "invalid" };

  await db
    .update(guestbookEntries)
    .set({ status, updatedAt: new Date() })
    .where(eq(guestbookEntries.id, parsed.data));

  revalidateBoth();
  return { ok: true };
}

export async function showEntry(id: string): Promise<ModerationResult> {
  return setStatus(id, "published");
}

export async function hideEntry(id: string): Promise<ModerationResult> {
  return setStatus(id, "hidden");
}

export async function deleteEntry(id: string): Promise<ModerationResult> {
  if (!(await isAdmin())) return { ok: false, error: "unauthorized" };
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "invalid" };

  await db.delete(guestbookEntries).where(eq(guestbookEntries.id, parsed.data));

  revalidateBoth();
  return { ok: true };
}

// Rediger: KUN navn + hilsen, aldri status (D4). Samme trim/lengde som DB-CHECK.
const editSchema = z.object({
  id: z.string().uuid(),
  author_name: z.string().trim().min(1).max(60),
  body: z.string().trim().min(1).max(2000),
});

export async function editEntry(
  formData: FormData,
): Promise<ModerationResult> {
  if (!(await isAdmin())) return { ok: false, error: "unauthorized" };

  const parsed = editSchema.safeParse({
    id: formData.get("id"),
    author_name: formData.get("author_name"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { ok: false, error: "invalid" };

  await db
    .update(guestbookEntries)
    .set({
      authorName: parsed.data.author_name,
      body: parsed.data.body,
      updatedAt: new Date(),
    })
    .where(eq(guestbookEntries.id, parsed.data.id));

  revalidateBoth();
  return { ok: true };
}
