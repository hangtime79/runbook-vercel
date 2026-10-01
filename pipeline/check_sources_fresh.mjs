// Checks that the three research source files were re-verified recently.
// Usage: node pipeline/check_sources_fresh.mjs   (from the repo root; no network, no secrets)
// Reads the "Last verified: YYYY-MM-DD" line in each file, prints its age, and exits 1 if any file is
// older than 30 days or has no date. Not part of CI: it would go red on unrelated pull requests as time passes.
// Run it before the demo (see "Before the demo" in docs/demo/demo-script.md).
import { readFileSync } from "node:fs";

const FILES = [
  "docs/demo/vercel-positioning.md",
  "docs/demo/governance-research.md",
  "docs/demo/objections-research.md",
];
const MAX_AGE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

let failed = 0;
for (const file of FILES) {
  const src = readFileSync(file, "utf8");
  const m = src.match(/^Last verified:\s*(\d{4})-(\d{2})-(\d{2})\b/m);
  if (!m) {
    console.log(`FAIL  ${file}: no "Last verified: YYYY-MM-DD" line`);
    failed++;
    continue;
  }
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (Number.isNaN(date.getTime())) {
    console.log(`FAIL  ${file}: "${m[0]}" is not a real date`);
    failed++;
    continue;
  }
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const age = Math.round((today - date.getTime()) / DAY_MS);
  const iso = `${m[1]}-${m[2]}-${m[3]}`;
  if (age < 0) {
    console.log(`FAIL  ${file}: last verified ${iso} is in the future`);
    failed++;
  } else if (age > MAX_AGE_DAYS) {
    console.log(`FAIL  ${file}: last verified ${iso}, ${age} days ago (limit ${MAX_AGE_DAYS})`);
    failed++;
  } else {
    console.log(`PASS  ${file}: last verified ${iso}, ${age} days ago`);
  }
}

if (failed) {
  console.log(`\nSOURCES STALE: re-verify the failing file(s) against the live pages, then update "Last verified".`);
  process.exit(1);
}
console.log(`\nSOURCES FRESH (all within ${MAX_AGE_DAYS} days)`);
