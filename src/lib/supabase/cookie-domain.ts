/*
 * Env-betinget cookie-domene for auth-cookies (design D3 i e3-auth).
 *
 * FOTPISTOL: prod-domenet (med ledende punktum) er et UGYLDIG cookie-domene på localhost og
 * *.vercel.app — nettleseren DROPPER cookien stille. Auth ser da ut til å
 * virke (lenken sendes), men sesjonen forsvinner sporløst. Derfor styres
 * domenet av `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN`, som settes til prod-domenet
 * KUN i Vercel Production-environment. Alle andre miljøer (dev, preview,
 * `.env.local`) lar variabelen stå usatt → `undefined` → host-only cookie,
 * som er riktig der.
 *
 * Alle tre Supabase-klientstedene (server.ts, client.ts, middleware.ts)
 * MÅ bruke denne helperen — ingen hardkoding av domenet noe sted.
 */
export function authCookieDomain(): string | undefined {
  // `|| undefined` sikrer at tom streng aldri sendes som domene.
  return process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN || undefined;
}
