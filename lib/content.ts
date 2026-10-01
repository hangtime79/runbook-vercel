// Loader and validator for the owner-edited markdown in content/ (the intro deck and the x-ray cards).
// Plain node:fs and relative imports only, so pipeline/check_xray.mts can run it under `node`.
// Every error names the file and the field, so a bad edit fails `npm run build` with a clear message.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  OBJECTION_SECTIONS,
  OBJECTION_THEMES,
  OBJECTION_WHO,
  STOP_SECTIONS,
  type StopSection,
  type XrayObjection,
  type XrayStop,
} from "./xrayTypes.ts";

export { OBJECTION_SECTIONS, STOP_SECTIONS };
export type { StopSection, XrayObjection, XrayStop };

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, "content");

// ---- types ---------------------------------------------------------------------------------------

export type Fields = Record<string, string>;
export type Sections = Record<string, string>;

export type IntroSlide = { file: string; fields: Fields };
export type IntroCard = { key: string; title: string; text: string; vercel: string; href: string };
export type Intro = {
  situation: Fields;
  tension: Fields;
  thesis: Fields;
  see: Fields;
  seeCards: IntroCard[];
  tiers: Fields;
  start: Fields;
};

// ---- parsing -------------------------------------------------------------------------------------

type Parsed = { fields: Fields; sections: Sections; sectionOrder: string[] };

function fail(file: string, field: string | null, msg: string): never {
  const rel = path.relative(ROOT, file) || file;
  throw new Error(`content error in ${rel}${field ? ` (field "${field}")` : ""}: ${msg}`);
}

/** Flat frontmatter (`key: value` lines between two `---` lines), then `## Heading` sections. */
export function parseFile(file: string): Parsed {
  const raw = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const lines = raw.split("\n");
  const fields: Fields = {};
  let i = 0;
  if (lines[0]?.trim() === "---") {
    i = 1;
    let closed = false;
    for (; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === "---") {
        closed = true;
        i++;
        break;
      }
      if (!line.trim()) continue;
      const m = /^([A-Za-z][\w-]*):\s?(.*)$/.exec(line);
      if (!m) fail(file, null, `frontmatter line ${i + 1} is not "key: value": ${JSON.stringify(line.slice(0, 60))}`);
      if (m[1] in fields) fail(file, m[1], `appears twice in the frontmatter`);
      fields[m[1]] = m[2].trim();
    }
    if (!closed) fail(file, null, `frontmatter opens with --- but never closes with ---`);
  }
  const sections: Sections = {};
  const sectionOrder: string[] = [];
  let current: string | null = null;
  let buf: string[] = [];
  const flush = () => {
    if (current !== null) sections[current] = buf.join("\n").trim();
    buf = [];
  };
  for (; i < lines.length; i++) {
    const h = /^##\s+(.+?)\s*$/.exec(lines[i]);
    if (h) {
      flush();
      current = h[1];
      if (current in sections || sectionOrder.includes(current)) fail(file, current, `section "## ${current}" appears twice`);
      sectionOrder.push(current);
    } else if (current !== null) {
      buf.push(lines[i]);
    } else if (lines[i].trim()) {
      fail(file, null, `text before the first "## Heading" line: ${JSON.stringify(lines[i].slice(0, 60))}`);
    }
  }
  flush();
  return { fields, sections, sectionOrder };
}

function checkKeys(file: string, fields: Fields, required: string[], optional: string[] = []) {
  for (const k of required) {
    if (!(k in fields)) fail(file, k, `missing required field "${k}"`);
    if (!fields[k]) fail(file, k, `"${k}" is empty`);
  }
  for (const k of Object.keys(fields)) {
    if (!required.includes(k) && !optional.includes(k)) {
      fail(file, k, `unknown field "${k}" (allowed: ${[...required, ...optional].join(", ")})`);
    }
  }
}

// ---- routes --------------------------------------------------------------------------------------

/**
 * Real app routes: every folder under app/ (not api/) that holds a page file. Null when app/ is not on
 * disk (a deployed function ships only the traced files), where the build has already checked routes.
 */
export function appRoutes(): string[] | null {
  const out: string[] = [];
  const appDir = path.join(ROOT, "app");
  if (!existsSync(appDir)) return null;
  for (const d of readdirSync(appDir, { withFileTypes: true })) {
    if (!d.isDirectory() || d.name === "api" || d.name.startsWith("_") || d.name.startsWith("(")) continue;
    if (existsSync(path.join(appDir, d.name, "page.tsx"))) out.push(`/${d.name}`);
  }
  return out.sort();
}

// ---- intro ---------------------------------------------------------------------------------------

const SLIDES: { file: string; key: keyof Omit<Intro, "seeCards">; required: string[]; optional?: string[] }[] = [
  { file: "01-situation.md", key: "situation", required: ["kicker", "title", "closer", "label_fraud", "label_rate"] },
  {
    file: "02-tension.md",
    key: "tension",
    required: ["kicker", "title", "fraud_role", "fraud_line", "cio_role", "cio_line", "apra_label", "apra_quote", "apra_cite"],
  },
  { file: "03-thesis.md", key: "thesis", required: ["kicker", "title", "sub"] },
  { file: "04-see.md", key: "see", required: ["kicker", "title", "vercel_label"] },
  { file: "05-tiers.md", key: "tiers", required: ["kicker", "title", "sub"] },
  { file: "06-start.md", key: "start", required: ["title", "button", "footer"] },
];

/** A card links to a route, or to the demo pull request (the word PR). */
const CARD_REQUIRED = ["title", "text", "vercel", "href"];

function readIntro(): Intro {
  const dir = path.join(CONTENT, "intro");
  const routes = appRoutes();
  const out: Record<string, Fields> = {};
  for (const s of SLIDES) {
    const file = path.join(dir, s.file);
    if (!existsSync(file)) fail(file, null, `file is missing`);
    const { fields, sectionOrder } = parseFile(file);
    if (sectionOrder.length) fail(file, sectionOrder[0], `intro slides use frontmatter fields only, no "## sections"`);
    checkKeys(file, fields, s.required, s.optional);
    out[s.key] = fields;
  }
  const cardDir = path.join(dir, "04-see");
  const cardFiles = existsSync(cardDir) ? readdirSync(cardDir).filter((f) => f.endsWith(".md")).sort() : [];
  if (cardFiles.length === 0) fail(cardDir, null, `no card files (01-story.md and so on)`);
  const seeCards: IntroCard[] = cardFiles.map((f) => {
    const file = path.join(cardDir, f);
    const { fields, sectionOrder } = parseFile(file);
    if (sectionOrder.length) fail(file, sectionOrder[0], `cards use frontmatter fields only, no "## sections"`);
    checkKeys(file, fields, CARD_REQUIRED);
    if (fields.href !== "PR" && routes && !routes.includes(fields.href)) {
      fail(file, "href", `"${fields.href}" is not a route (use one of ${routes.join(" ")}, or PR for the pull request)`);
    }
    return { key: f.replace(/^\d+-/, "").replace(/\.md$/, ""), title: fields.title, text: fields.text, vercel: fields.vercel, href: fields.href };
  });
  return { ...(out as Omit<Intro, "seeCards">), seeCards } as Intro;
}

// ---- x-ray stops ---------------------------------------------------------------------------------

const STOP_FRONT = ["id", "title", "act", "beat", "route", "fast"];
const REQUIRED_SECTIONS: StopSection[] = ["What", "Tell"];
/** Bridge stops leave the app, so they carry a "Leave the app" section. */
const BRIDGE_SECTION: StopSection = "Leave the app";

function readStops(): XrayStop[] {
  const dir = path.join(CONTENT, "xray");
  const routes = appRoutes();
  if (!existsSync(dir)) fail(dir, null, `directory is missing`);
  const files = readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
  if (files.length === 0) fail(dir, null, `no stop files`);

  const stops: XrayStop[] = [];
  const seenIds = new Map<string, string>();
  for (const f of files) {
    const file = path.join(dir, f);
    const m = /^(\d+)-[a-z0-9][a-z0-9-]*\.md$/.exec(f);
    if (!m) fail(file, null, `filename must look like 07-start.md (number, dash, lowercase words)`);
    const n = Number(m[1]);
    const { fields, sections } = parseFile(file);
    checkKeys(file, fields, STOP_FRONT);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(fields.id)) fail(file, "id", `"${fields.id}" must be lowercase letters, digits and dashes (no spaces)`);
    if (seenIds.has(fields.id)) fail(file, "id", `"${fields.id}" is also used by ${seenIds.get(fields.id)}`);
    seenIds.set(fields.id, f);
    if (fields.fast !== "keep" && fields.fast !== "skip") fail(file, "fast", `"${fields.fast}" must be keep or skip`);
    if (routes && !routes.includes(fields.route)) fail(file, "route", `"${fields.route}" is not a route (use one of ${routes.join(" ")})`);
    for (const name of Object.keys(sections)) {
      if (!(STOP_SECTIONS as readonly string[]).includes(name)) {
        fail(file, name, `unknown section "## ${name}" (allowed: ${STOP_SECTIONS.join(", ")})`);
      }
      if (!sections[name]) fail(file, name, `section "## ${name}" is empty (delete the heading or add text)`);
    }
    for (const name of REQUIRED_SECTIONS) if (!sections[name]) fail(file, name, `missing required section "## ${name}"`);
    stops.push({
      n,
      id: fields.id,
      title: fields.title,
      act: fields.act,
      beat: fields.beat,
      route: fields.route,
      fast: fields.fast,
      bridge: BRIDGE_SECTION in sections,
      sections: sections as XrayStop["sections"],
    });
  }
  stops.sort((a, b) => a.n - b.n);
  stops.forEach((s, i) => {
    if (s.n !== i + 1) {
      const dup = stops[i - 1]?.n === s.n;
      fail(path.join(dir, files[i]), null, `numbers must run 1..${stops.length} with no gaps or repeats; ${dup ? `${s.n} appears twice` : `expected ${i + 1} here but found ${s.n}`}`);
    }
  });
  return stops;
}

// ---- objections ----------------------------------------------------------------------------------

const OBJECTION_FRONT = ["id", "title", "who", "theme", "anchor"];
const OBJECTION_REQUIRED: (typeof OBJECTION_SECTIONS)[number][] = ["They say", "Why they ask", "Answer", "Sources"];

function readObjections(stops: XrayStop[]): XrayObjection[] {
  const dir = path.join(CONTENT, "objections");
  if (!existsSync(dir)) fail(dir, null, `directory is missing`);
  const files = readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
  if (files.length === 0) fail(dir, null, `no objection files`);
  const stopIds = new Set(stops.map((s) => s.id));
  const out: XrayObjection[] = [];
  const seen = new Map<string, string>();
  for (const f of files) {
    const file = path.join(dir, f);
    if (!/^[a-z0-9][a-z0-9-]*\.md$/.test(f)) fail(file, null, `filename must be lowercase words and dashes, like bill-at-scale.md (no number prefix)`);
    const { fields, sections } = parseFile(file);
    checkKeys(file, fields, OBJECTION_FRONT);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(fields.id)) fail(file, "id", `"${fields.id}" must be lowercase letters, digits and dashes`);
    if (seen.has(fields.id)) fail(file, "id", `"${fields.id}" is also used by ${seen.get(fields.id)}`);
    seen.set(fields.id, f);
    if (!(OBJECTION_WHO as readonly string[]).includes(fields.who)) fail(file, "who", `"${fields.who}" must be one of ${OBJECTION_WHO.join(", ")}`);
    if (!(OBJECTION_THEMES as readonly string[]).includes(fields.theme)) fail(file, "theme", `"${fields.theme}" must be one of ${OBJECTION_THEMES.join(", ")}`);
    if (!stopIds.has(fields.anchor)) fail(file, "anchor", `"${fields.anchor}" is not the id of any x-ray stop (copy one from content/xray/*.md)`);
    for (const name of Object.keys(sections)) {
      if (!(OBJECTION_SECTIONS as readonly string[]).includes(name)) {
        fail(file, name, `unknown section "## ${name}" (allowed: ${OBJECTION_SECTIONS.join(", ")})`);
      }
      if (!sections[name]) fail(file, name, `section "## ${name}" is empty (delete the heading or add text)`);
    }
    for (const name of OBJECTION_REQUIRED) if (!sections[name]) fail(file, name, `missing required section "## ${name}"`);
    out.push({
      id: fields.id,
      title: fields.title,
      who: fields.who as XrayObjection["who"],
      theme: fields.theme as XrayObjection["theme"],
      anchor: fields.anchor,
      sections: sections as XrayObjection["sections"],
    });
  }
  return out;
}

// ---- public API ----------------------------------------------------------------------------------

// Cached per process in production; re-read on every request in dev so a saved edit shows on refresh.
const cache: { intro?: Intro; stops?: XrayStop[]; objections?: XrayObjection[] } = {};
const cached = () => process.env.NODE_ENV === "production";

export function loadIntro(): Intro {
  if (cached() && cache.intro) return cache.intro;
  const v = readIntro();
  if (cached()) cache.intro = v;
  return v;
}

export function loadXrayStops(): XrayStop[] {
  if (cached() && cache.stops) return cache.stops;
  const v = readStops();
  if (cached()) cache.stops = v;
  return v;
}

export function loadObjections(): XrayObjection[] {
  if (cached() && cache.objections) return cache.objections;
  const v = readObjections(loadXrayStops());
  if (cached()) cache.objections = v;
  return v;
}

/** Everything, for the build gate and pipeline/check_xray.mts. Throws on the first bad file. */
export function validateAllContent(): { slides: number; cards: number; stops: number; objections: number } {
  const intro = readIntro();
  const stops = readStops();
  const objections = readObjections(stops);
  return { slides: SLIDES.length, cards: intro.seeCards.length, stops: stops.length, objections: objections.length };
}
