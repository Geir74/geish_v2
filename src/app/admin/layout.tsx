/*
 * /admin — felles guard for hele admin-taket (E4.5, design D3/D4).
 *
 * Guarden bor HER så alle /admin/* -ruter arver den; E5/E6 legger sine paneler
 * som underruter uten å repetere sjekken. Ikke-admin (utlogget ELLER innlogget
 * ikke-admin) → notFound() (D3: 404, lekker ikke at området finnes — vi
 * reklamerer ikke for angrepsflaten). isAdmin() feiler closed.
 */
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/admin/is-admin";

// Uten dette prøver Next å prerendre ved build (før env/cookies er klare) og
// isAdmin() ville feilet closed → 404 på en side som egentlig er dynamisk.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!(await isAdmin())) {
    notFound();
  }
  return <>{children}</>;
}
