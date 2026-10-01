// X-ray stops match the script: every card in content/xray/ has an anchor in the app, and every anchor has a card.
// Usage: node --no-warnings pipeline/check_xray.mts   (from the repo root; no secrets, no network)
// Also runs the full content check (lib/content.ts), so a bad edit to content/ fails here with file and field.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { loadObjections, loadXrayStops, validateAllContent } from "../lib/content.ts";

let failed = 0;
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`);
  if (!ok) failed++;
};

// 1. Every content file passes validation (required keys, known sections, real routes, 1..N numbering).
let stops: ReturnType<typeof loadXrayStops> = [];
let objections: ReturnType<typeof loadObjections> = [];
try {
  const v = validateAllContent();
  stops = loadXrayStops();
  objections = loadObjections();
  check(true, `content validates: ${v.slides} intro slides, ${v.cards} cards, ${v.stops} x-ray stops, ${v.objections} objections`);
  check(stops.every((s, i) => s.n === i + 1), `stop numbers run 1..${stops.length} with no gaps or repeats`);
} catch (e) {
  check(false, String((e as Error).message));
  process.exit(1);
}

// 2. Collect every data-xray anchor id written in app/ and components/.
function* walk(dir: string): Generator<string> {
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) yield* walk(p);
    else if (/\.(tsx|ts)$/.test(d.name)) yield p;
  }
}

/** The attribute value: "a b" or {expr}. Returns every string literal inside, split on spaces. */
function idsIn(src: string, from: number): string[] {
  let i = from;
  const out: string[] = [];
  if (src[i] === '"') {
    const end = src.indexOf('"', i + 1);
    return src.slice(i + 1, end).split(/\s+/).filter(Boolean);
  }
  if (src[i] === "{") {
    let depth = 0;
    let j = i;
    for (; j < src.length; j++) {
      if (src[j] === "{") depth++;
      else if (src[j] === "}" && --depth === 0) break;
    }
    for (const m of src.slice(i, j).matchAll(/"([^"]*)"/g)) out.push(...m[1].split(/\s+/).filter(Boolean));
  }
  return out;
}

const anchors = new Map<string, string[]>(); // id -> files
for (const root of ["app", "components"]) {
  for (const file of walk(root)) {
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(/data-xray=/g)) {
      for (const id of idsIn(src, m.index! + m[0].length)) {
        anchors.set(id, [...(anchors.get(id) ?? []), file]);
      }
    }
  }
}

// An xray={...} prop that is forwarded to data-xray (AskButton) is covered by its call sites.
for (const file of walk("app")) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(/xray=/g)) {
    if (src.slice(m.index! - 5, m.index!).endsWith("data-")) continue;
    for (const id of idsIn(src, m.index! + m[0].length)) anchors.set(id, [...(anchors.get(id) ?? []), file]);
  }
}

// data-xray-standin ids (an element a ghost stop sits on until its own element exists).
const standIns = new Map<string, string[]>();
for (const root of ["app", "components"]) {
  for (const file of walk(root)) {
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(/data-xray-standin=/g)) {
      for (const id of idsIn(src, m.index! + m[0].length)) standIns.set(id, [...(standIns.get(id) ?? []), file]);
    }
  }
}

// 3. Both directions. A stop counts as anchored if its own anchor or its stand-in exists in code.
const ids = new Set(stops.map((s) => s.id));
for (const s of stops) {
  const own = anchors.get(s.id);
  const stand = s.standIn ? anchors.get(s.standIn) ?? standIns.get(s.standIn) : undefined;
  const where = own ?? stand;
  const via = own ? "" : stand ? ` via stand-in "${s.standIn}"` : "";
  check(!!where, `stop ${String(s.n).padStart(2, "0")} ${s.id} has an anchor${where ? `${via} (${[...new Set(where)].join(", ")})` : " or stand-in in app/ or components/"}`);
}
for (const s of stops) {
  if (!s.standIn) continue;
  check(s.appearsAfter !== undefined && s.appearsAfter < s.n && !!stops[s.appearsAfter - 1], `ghost stop ${s.n} appears after stop ${s.appearsAfter}, which exists and comes earlier`);
}
for (const [id, files] of standIns) check(ids.has(id) || stops.some((s) => s.standIn === id), `stand-in "${id}" is used by a stop (${[...new Set(files)].join(", ")})`);
for (const [id, files] of anchors) {
  check(ids.has(id), `anchor "${id}" has a stop file (${[...new Set(files)].join(", ")})`);
}

// 4. Every objection's anchor resolves to a stop that has an anchor in code.
for (const o of objections) {
  check(ids.has(o.anchor) && anchors.has(o.anchor), `objection ${o.id} anchors to stop "${o.anchor}", which has an element in app/ or components/`);
}

console.log(failed ? `X-RAY CHECK FAILED: ${failed} problem(s)` : "X-RAY CHECK PASSED");
process.exit(failed ? 1 : 0);
