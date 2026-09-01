import type { Metadata } from "next";
import {
  Archivo_Black,
  Bungee,
  Special_Elite,
  JetBrains_Mono,
  Newsreader,
} from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/shared";

/*
 * De 5 fontene som tokens.css forventer. next/font/google self-hoster dem ved
 * build (ingen runtime-request til google) og setter en CSS-variabel som vi
 * legger på <html>. Variabelnavnene MATCHER de i src/styles/tokens.css —
 * next/font sin verdi vinner over tokens-fallback i kaskaden.
 */

// Plakat-overskrifter (h1/h2/h3).
const display = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

// Stencil-typografi (sjelden, spesial-tilfeller).
const poster = Bungee({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-poster",
  display: "swap",
});

// Brødtekst — Special Elite finnes kun i vekt 400.
const typewriter = Special_Elite({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-typewriter",
  display: "swap",
});

// Meta, datoer, kode, status-badges, tags.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

// Lange tekstpartier (manifest, blogg) — trenger italic for sitater.
const serif = Newsreader({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "geish.no",
  description: "Geirs personlige digitale hjemmebase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Alle 5 font-variabel-klasser på <html> så var(--font-display) osv. løses i CSS.
  const fontVars = `${display.variable} ${poster.variable} ${typewriter.variable} ${mono.variable} ${serif.variable}`;

  return (
    <html lang="nb" className={fontVars}>
      <body>
        {/* Client component: hydreres oppå statisk HTML, leser aldri cookies
            server-side — statiske ruter forblir statiske (e3-auth D5 /
            global-nav D4). Absorberer tidligere AuthNav. */}
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
