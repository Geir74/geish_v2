#!/usr/bin/env node
/*
 * changelog-sync — UTKAST-generator for src/content/changelog.ts.
 *
 * KJØRES KUN MANUELT: `npm run changelog:sync`. Aldri i build/CI — scriptet
 * snakker med GitHub-API-et og SKRIVER i en kildekodefil; build skal være
 * deterministisk og offline. package.json kobler det derfor ikke til
 * build/postinstall, kun til det eksplisitte `changelog:sync`-scriptet.
 *
 * Hva det gjør:
 *   1. Henter alle MERGEDE PR-er i Geir74/geish_v2 (lukkede uten merged_at
 *      hoppes over).
 *   2. Filtrerer bort interne/usynlige PR-er (chore-, docs-, infra-, ci-,
 *      env-, secrets-relaterte titler) — endringsloggen er for besøkende.
 *   3. Sammenligner med PR-numrene som allerede finnes i changelog.ts og
 *      appender UTKAST-oppføringer (markert med TODO-kommentar) for de som
 *      mangler, øverst i arrayet.
 *
 * Utkastene bruker PR-tittelen som tittel — Geir omformulerer til
 * menneskespråk og flytter oppføringen til riktig sortert plass før commit.
 *
 * Token: GITHUB_TOKEN-env hvis satt, ellers passordfeltet i første linje av
 * ~/.openclaw/workspace/secrets/git-credentials (git-credentials-URL-format).
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHANGELOG_PATH = join(__dirname, "..", "src", "content", "changelog.ts");
const REPO = "Geir74/geish_v2";

// Interne PR-er som aldri skal i den offentlige endringsloggen.
const INTERNAL_PATTERNS = [
  /^chore/i,
  /^docs/i,
  /^ci/i,
  /^build/i,
  /^test/i,
  /^refactor/i,
  /infra/i,
  /\benv\b/i,
  /secret/i,
  /credential/i,
  /passord/i,
  /password/i,
  /rebuild/i,
  /openspec/i,
];

function resolveToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  const credFile = join(homedir(), ".openclaw", "workspace", "secrets", "git-credentials");
  if (existsSync(credFile)) {
    const line = readFileSync(credFile, "utf8").split("\n")[0].trim();
    // Format: https://<bruker>:<token>@github.com
    const match = line.match(/^https?:\/\/[^:]+:([^@]+)@/);
    if (match) return match[1];
  }
  console.error("Fant ingen token (GITHUB_TOKEN eller secrets/git-credentials).");
  process.exit(1);
}

async function fetchMergedPrs(token) {
  const prs = [];
  for (let page = 1; page <= 10; page++) {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/pulls?state=closed&per_page=100&page=${page}`,
      { headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" } },
    );
    if (!res.ok) {
      console.error(`GitHub-API feilet: ${res.status} ${res.statusText}`);
      process.exit(1);
    }
    const batch = await res.json();
    prs.push(...batch.filter((p) => p.merged_at));
    if (batch.length < 100) break;
  }
  return prs;
}

function isInternal(title) {
  return INTERNAL_PATTERNS.some((re) => re.test(title));
}

function main() {
  return (async () => {
    const token = resolveToken();
    const source = readFileSync(CHANGELOG_PATH, "utf8");

    // PR-numre som allerede er dekket i changelog.ts.
    const existing = new Set(
      [...source.matchAll(/prNummer:\s*(\d+)/g)].map((m) => Number(m[1])),
    );

    const merged = await fetchMergedPrs(token);
    const missing = merged
      .filter((p) => !existing.has(p.number) && !isInternal(p.title))
      .sort((a, b) => (a.merged_at < b.merged_at ? 1 : -1));

    if (missing.length === 0) {
      console.log("Endringsloggen er à jour — ingen nye brukersynlige PR-er.");
      return;
    }

    // Append som UTKAST øverst i arrayet (rett etter åpningsbracketen).
    const drafts = missing
      .map((p) => {
        const date = p.merged_at.slice(0, 10);
        const title = p.title.replace(/"/g, "\\\"");
        return [
          `  // TODO(utkast fra changelog-sync): omformuler, godkjenn, og sorter riktig.`,
          `  {`,
          `    date: "${date}",`,
          `    title: "${title}",`,
          `    description: "UTKAST — beskriv endringen for besøkende.",`,
          `    prNummer: ${p.number},`,
          `  },`,
        ].join("\n");
      })
      .join("\n");

    const marker = "export const changelog: ReadonlyArray<ChangelogEntry> = [";
    if (!source.includes(marker)) {
      console.error("Fant ikke changelog-arrayet i changelog.ts — er filen endret?");
      process.exit(1);
    }
    writeFileSync(CHANGELOG_PATH, source.replace(marker, `${marker}\n${drafts}`));
    console.log(
      `La til ${missing.length} UTKAST-oppføring(er) i src/content/changelog.ts:`,
    );
    for (const p of missing) console.log(`  #${p.number} ${p.title}`);
    console.log("Rediger tekstene og sorteringen før commit.");
  })();
}

main();
