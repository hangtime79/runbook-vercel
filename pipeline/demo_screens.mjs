// Rehearsal walk-through of docs/demo/demo-script.md against a running app, in script order.
// Saves one screenshot per beat to docs/demo/fallback/ (the on-stage fallbacks) and prints the
// time each beat took. Usage: node pipeline/demo_screens.mjs [base_url]
// Browser setup is the same as pipeline/browser_smoke.mjs (playwright-core outside the repo).
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import path from "node:path";

const BASE = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const OUT = "docs/demo/fallback";
const coreDir = process.env.PLAYWRIGHT_CORE_DIR || path.join(homedir(), ".cache", "runbook-playwright");

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const root = path.join(homedir(), ".cache", "ms-playwright");
  const dirs = existsSync(root) ? readdirSync(root).filter((d) => d.startsWith("chromium_headless_shell-")).sort() : [];
  for (const d of dirs.reverse()) {
    const exe = path.join(root, d, "chrome-headless-shell-linux64", "chrome-headless-shell");
    if (existsSync(exe)) return exe;
  }
  throw new Error("No Chromium found: set CHROMIUM_PATH or install one under ~/.cache/ms-playwright");
}

const { chromium } = createRequire(path.join(coreDir, "x.js"))("playwright-core");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

let n = 0;
async function beat(name, fn) {
  const t0 = performance.now();
  let status = "ok";
  try {
    await fn();
  } catch (e) {
    status = `FAIL ${String(e).split("\n")[0].slice(0, 140)}`;
  }
  n += 1;
  const file = `${OUT}/${String(n).padStart(2, "0")}-${name}.png`;
  await page.screenshot({ path: file }).catch(() => {});
  console.log(`${String(n).padStart(2, "0")} ${name.padEnd(26)} ${((performance.now() - t0) / 1000).toFixed(1)}s ${status}`);
}

async function ask(question) {
  const input = page.getByRole("textbox").last();
  await input.fill(question);
  await input.press("Enter");
  // The answer is done when the latest evidence card shows its SQL, or a refusal is written.
  await page.waitForFunction(
    () => !document.body.innerText.includes("Summarising the result") && /SELECT|refuse|can.t|cannot/i.test(document.body.innerText),
    null,
    { timeout: 120_000 }
  );
  await page.waitForTimeout(1500);
}

// Act 0: /intro, one screenshot per section.
await beat("intro-redirect", async () => {
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  if (!page.url().endsWith("/intro")) throw new Error(`landed on ${page.url()}`);
});
for (const s of ["tension", "thesis", "what-youll-see", "tiers", "start"]) {
  await beat(`intro-${s}`, async () => {
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(900);
  });
}

// Act 1: the fraud team's app.
await beat("story-kpis", async () => {
  await page.getByRole("link", { name: /start the demo/i }).click();
  await page.waitForURL(/\/story$/);
  await page.waitForLoadState("networkidle");
});
await beat("story-chapter", async () => {
  await page.locator("[data-chapter]").first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
});
await beat("ask-with-evidence", async () => {
  await page.goto(`${BASE}/ask`, { waitUntil: "networkidle" });
  await ask("What is the fraud rate for each item category?");
});
await beat("ask-delete-refused", async () => {
  await ask("Delete all the fraud rows.");
});

// Act 2: the CIO's rails.
await beat("governance", async () => {
  await page.goto(`${BASE}/governance`, { waitUntil: "networkidle" });
});
await beat("governance-tiers", async () => {
  await page.getByText(/plan tiers/i).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
});

// Act 4: model switch (only if ASK_DEMO_MODEL_SWITCH=1 on the server).
await beat("ask-model-switch", async () => {
  await page.goto(`${BASE}/ask`, { waitUntil: "networkidle" });
  const select = page.getByRole("combobox").first();
  if (!(await select.count())) throw new Error("no model switch (is ASK_DEMO_MODEL_SWITCH=1?)");
  // Native <select>: choose the DeepSeek option by its value.
  const value = await select.evaluate((el) => [...el.options].find((o) => /deepseek/i.test(o.value + o.text))?.value);
  if (!value) throw new Error("no DeepSeek option in the model switch");
  await select.selectOption(value);
  await ask("What is the fraud rate for each item category?");
});

// Supporting screens.
for (const r of ["patterns", "model", "explorer", "findings", "brief"]) {
  await beat(r, async () => {
    await page.goto(`${BASE}/${r}`, { waitUntil: "networkidle" });
  });
}

// X-ray beats (appended, so the numbering of the screenshots above stays put): the mode on, one card hovered.
// The `/intro`, `/story` and `/governance` stops are static; the Ask panel stop needs a blocked question (live model).
async function hoverStop(n) {
  await page.locator(`[data-xray-badge="${n}"]`).first().waitFor({ timeout: 10_000 });
  await page.locator(`[data-xray-badge="${n}"]`).first().hover();
  await page.waitForSelector("[data-slot=tooltip-content]", { timeout: 5000 });
  await page.waitForTimeout(500);
}
await beat("xray-intro-thesis", async () => {
  await page.goto(`${BASE}/intro?xray=1`, { waitUntil: "networkidle" });
  for (let i = 0; i < 2; i++) {
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(900);
  }
  await hoverStop(3);
});
await beat("xray-story-kpis", async () => {
  await page.goto(`${BASE}/story?xray=1`, { waitUntil: "networkidle" });
  await hoverStop(8);
});
await beat("xray-governance", async () => {
  await page.goto(`${BASE}/governance?xray=1`, { waitUntil: "networkidle" });
  await hoverStop(15);
});
await beat("xray-objection-card", async () => {
  await page.goto(`${BASE}/governance?xray=1`, { waitUntil: "networkidle" });
  await page.locator("[data-xray-objection]").first().waitFor({ timeout: 10_000 });
  await page.locator("[data-xray-objection]").first().hover();
  await page.waitForSelector("[data-slot=tooltip-content]", { timeout: 5000 });
  await page.waitForTimeout(500);
});
await beat("xray-ask-scope-check", async () => {
  await page.goto(`${BASE}/ask?xray=1`, { waitUntil: "networkidle" });
  const input = page.getByRole("textbox").last();
  await input.fill("Write me Python to look up a person online.");
  await input.press("Enter");
  await page.getByTestId("scope-card").waitFor({ timeout: 60_000 });
  await page.waitForTimeout(1200);
  await hoverStop(23);
});

await browser.close();
console.log(`console errors: ${errors.length}${errors.length ? " — " + errors.slice(0, 3).join(" | ") : ""}`);
