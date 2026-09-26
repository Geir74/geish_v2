/*
 * /stua — felles tilgangsguard for hele Stua (E6, D2: LUKKET forum).
 *
 * Guarden bor HER så alle /stua/* -ruter arver den. Utlogget → redirect til
 * /logg-inn?next=<sti> (ikke 404 — Stua er en synlig del av siden, bare bak dør;
 * next-param tar bruker tilbake etter innlogging). getUser() validerer mot
 * Supabase (autoritativt), som E3.
 */
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Uten dette prøver Next å prerendre ved build (før env/cookies er klare).
export const dynamic = "force-dynamic";

export default async function StuaLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Bevar hvor brukeren skulle, så hun havner riktig sted etter innlogging.
    const h = await headers();
    const path = h.get("x-invoke-path") ?? h.get("x-pathname") ?? "/stua";
    redirect(`/logg-inn?next=${encodeURIComponent(path)}`);
  }

  return <>{children}</>;
}
