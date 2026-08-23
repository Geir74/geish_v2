/*
 * Next.js-middleware — delegerer til Supabase' updateSession (token-refresh).
 * Ingen rute-guarding her (design D2 i e3-auth): guards bor i pages/handlers.
 */
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Alt unntatt:
     * - _next/static (build-assets)
     * - _next/image (bildeoptimalisering)
     * - favicon.ico
     * - statiske filendelser (svg/png/jpg/jpeg/gif/webp/ico)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
