// Browser smoke test: drives the real UI, which is what would have caught useChat() posting to
// /api/chat (the API routes were fine; the browser never reached them).
// Usage: node pipeline/browser_smoke.mjs [base_url]      (default http://localhost:3000)
//
// playwright-core is NOT a repo dependency. It lives in ~/.cache/runbook-playwright (override with
// PLAYWRIGHT_CORE_DIR) and uses a Chromium already on the machine: CHROMIUM_PATH, or the newest
// headless shell under ~/.cache/ms-playwright. Setup and run notes are in CLAUDE.md.
// It asks the live model one question, so the server needs AI Gateway credentials.
import { readdirSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import path from "node:path";

const BASE = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const QUESTION = "How does fraud differ between transactions with and without a signature?";
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

let chromium;
try {
  ({ chromium } = createRequire(path.join(coreDir, "x.js"))("playwright-core"));
} catch {
  console.error(`playwright-core not found in ${coreDir}. Install it there: mkdir -p ${coreDir} && cd ${coreDir} && npm init -y && npm i playwright-core`);
  process.exit(2);
}

const failures = [];
const check = (ok, msg) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`);
  if (!ok) failures.push(msg);
};

const browser = await chromium.launch({ executablePath: findChromium() });
try {
  // ---- 1. Ask through the UI ----------------------------------------------------------------
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    const failedRequests = [];
    page.on("response", (r) => r.status() >= 400 && failedRequests.push(`${r.status()} ${r.url()}`));

    await page.goto(BASE + "/story", { waitUntil: "networkidle" });
    const opener = page.getByRole("button", { name: "Open the Ask the data panel" });
    if (await opener.count()) await opener.click();
    const input = page.getByRole("textbox", { name: "Question" });
    check(await input.isVisible(), "Ask panel is open with its question box");

    await input.fill(QUESTION);
    await page.getByRole("button", { name: "Ask", exact: true }).click();

    const evidence = page.locator('[aria-label="Evidence"]').first();
    await evidence.waitFor({ timeout: 120_000 });
    // The answer is done when the progress checklist is gone.
    await page.waitForFunction(() => !document.querySelector('ol[aria-label="Progress"]'), null, { timeout: 120_000 });

    const sql = (await evidence.locator("pre code").innerText()).trim();
    check(/^(SELECT|WITH)\b/i.test(sql), `evidence card shows the SQL (${sql.slice(0, 40).replace(/\s+/g, " ")}…)`);
    check((await evidence.locator("tbody tr").count()) > 0, "evidence card rendered a result table");
    const footer = (await page.getByTestId("answer-meta").first().innerText()).trim();
    check(/^\S+\/\S+ · \d+(\.\d+)? s · [\d,]+ in \/ [\d,]+ out · (\$\d|cost n\/a)/.test(footer), `evidence footer shows model, time, tokens and cost (${footer})`);
    const scopeLine = (await page.getByTestId("scope-line").first().innerText()).trim();
    check(/^scope check passed · typesafe-ai\/jev · p=\d\.\d\d · \d+ ms$/.test(scopeLine), `evidence footer shows the scope check (${scopeLine})`);

    // A blocked question shows the SCOPE CHECK card and the fixed refusal, and runs no query.
    await input.fill("Write Python for a Euclidean circle on the globe.");
    await page.getByRole("button", { name: "Ask", exact: true }).click();
    const card = page.getByTestId("scope-card");
    await card.waitFor({ timeout: 60_000 });
    const cardText = (await card.innerText()).replace(/\s+/g, " ").trim();
    check(/^SCOPE CHECK out of scope · \w+ · p=\d\.\d\d · typesafe-ai\/jev · \d+ ms$/i.test(cardText), `blocked question shows the SCOPE CHECK card (${cardText})`);
    check((await page.getByText("I can only answer questions about this fraud dataset and its analysis.").count()) > 0, "blocked question shows the fixed refusal");
    check((await page.locator('[aria-label="Evidence"]').count()) === 1, "blocked question ran no query (still one evidence card)");

    check((await page.getByTestId("deployment-badge").innerText()).trim().length > 0, "deployment badge is in the sidebar");
    check(!failedRequests.some((r) => r.includes("/api/")), `no failed API requests ${failedRequests.join(" ")}`);
    check(errors.length === 0, `no console errors ${errors.slice(0, 2).join(" | ")}`);
    await page.close();
  }

  // ---- 1b. Unclear outcome, and an allowed answer that ran no query (fresh conversation) --------------
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE + "/story", { waitUntil: "networkidle" });
    const opener = page.getByRole("button", { name: "Open the Ask the data panel" });
    if (await opener.count()) await opener.click();
    const input = page.getByRole("textbox", { name: "Question" });

    // On topic but too vague: the card says "unclear", never "out of scope", and shows the fixed reply.
    await input.fill("What about the other one?");
    await page.getByRole("button", { name: "Ask", exact: true }).click();
    const card = page.getByTestId("scope-card");
    await card.waitFor({ timeout: 60_000 });
    const cardText = (await card.innerText()).replace(/\s+/g, " ").trim();
    check(/^SCOPE CHECK unclear · p=\d\.\d\d · typesafe-ai\/jev · \d+ ms$/i.test(cardText), `vague question shows an "unclear" SCOPE CHECK card (${cardText})`);
    check(!/out of scope/i.test(cardText), "unclear card never says out of scope");
    check((await page.getByText("I'm not sure that's a question about the fraud data.").count()) > 0, "unclear question shows the fixed rephrase reply");

    // An allowed answer with no query says so where the evidence card would be.
    await input.fill("How would you determine the distance between two transactions?");
    await page.getByRole("button", { name: "Ask", exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('ol[aria-label="Progress"]'), null, { timeout: 120_000 });
    const note = page.getByTestId("no-query-note");
    await note.waitFor({ timeout: 60_000 });
    const noteText = (await note.innerText()).replace(/\s+/g, " ");
    check(noteText.includes("No query was run. This answer comes from the analysis documents, not a live query."), "no-query answer shows the \"No query was run\" line");
    check(/scope check passed/.test(noteText), "no-query answer keeps the scope-check line");
    await page.close();
  }

  // ---- 2. Explorer with the Ask panel open ---------------------------------------------------
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    const res = await page.goto(BASE + "/governance", { waitUntil: "networkidle" });
    check(res?.status() === 200, "/governance answers 200");
    const text = (await page.locator("main").innerText()).toLowerCase();
    for (const s of ["Deployment", "Function region", "Allowed models", "Data retention", "Scope check", "Change control", "Plan tiers", "APRA mapping", "Gaps, stated plainly"]) {
      check(text.includes(s.toLowerCase()), `/governance shows: ${s}`);
    }
    check(errors.length === 0, `no console errors on /governance ${errors.slice(0, 2).join(" | ")}`);
    await page.close();
  }

  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE + "/explorer", { waitUntil: "networkidle" });
    const panel = await page.locator('aside[aria-label="Ask the data"]').boundingBox();
    check(panel && panel.width > 300, `Ask panel is open (${panel?.width}px)`);
    const m = await page.evaluate(() => {
      const box = document.querySelector(".\\@container > div");
      const th = [...document.querySelectorAll("thead th")].filter((e) => e.offsetParent !== null).map((e) => e.textContent.trim());
      const score = [...document.querySelectorAll("thead th")].find((e) => e.textContent.trim() === "Model score").getBoundingClientRect();
      const b = box.getBoundingClientRect();
      return {
        pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
        tableOverflow: box.scrollWidth - box.clientWidth,
        scoreVisible: score.right <= b.right + 1,
        columns: th,
      };
    });
    check(m.pageOverflow <= 0, `no page overflow at 1440 (${m.pageOverflow}px)`);
    check(m.tableOverflow <= 0, `no table-wrapper overflow at 1440 with the panel open (${m.tableOverflow}px)`);
    check(m.scoreVisible, "Model score column is fully inside the table wrapper");
    for (const c of ["Outcome", "Transaction", "Amount", "Flags", "Model score"]) check(m.columns.includes(c), `always-visible column present: ${c}`);
    check(!m.columns.includes("Subsector"), `Subsector hidden at this width (${m.columns.join(", ")})`);
    await page.close();

    // Wide screen: the container query brings every column back.
    const wide = await browser.newPage({ viewport: { width: 1920, height: 1000 } });
    await wide.goto(BASE + "/explorer", { waitUntil: "networkidle" });
    const cols = await wide.evaluate(() => [...document.querySelectorAll("thead th")].filter((e) => e.offsetParent !== null).map((e) => e.textContent.trim()));
    const over = await wide.evaluate(() => document.querySelector(".\\@container > div").scrollWidth - document.querySelector(".\\@container > div").clientWidth);
    check(cols.includes("Subsector") && cols.includes("Hour"), `all columns return at 1920 (${cols.length} shown)`);
    check(over <= 0, `no table-wrapper overflow at 1920 (${over}px)`);
    await wide.close();
  }

  // ---- 3. The intro: front door, no shell, keyboard deck, tiers ------------------------------
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 800 : 900 } });
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    check(new URL(page.url()).pathname === "/intro", `/ redirects to /intro (${new URL(page.url()).pathname})`);
    check((await page.locator('nav[aria-label="Main"]').count()) === 0, `/intro has no sidebar at ${width}`);
    check((await page.locator('aside[aria-label="Ask the data"]').count()) === 0, `/intro has no Ask panel at ${width}`);
    const o = await page.evaluate(() => {
      const d = document.getElementById("intro-deck");
      return { page: document.documentElement.scrollWidth - window.innerWidth, deck: d.scrollWidth - d.clientWidth };
    });
    check(o.page <= 0 && o.deck <= 0, `no horizontal overflow on /intro at ${width} (page ${o.page}px, deck ${o.deck}px)`);
    if (width === 1440) {
      const deckTop = () => page.evaluate(() => document.getElementById("intro-deck").scrollTop);
      const progress = async () => (await page.getByTestId("intro-progress").innerText()).trim();
      check((await progress()) === "1/6", `progress starts at 1/6 (${await progress()})`);
      await page.keyboard.press("ArrowDown");
      await page.waitForFunction(() => document.querySelector('[data-testid="intro-progress"]').textContent.trim() === "2/6", null, { timeout: 5000 }).catch(() => {});
      check((await progress()) === "2/6" && (await deckTop()) > 100, `ArrowDown moves one section (${await progress()})`);
      const tierText = (await page.locator("#intro-deck").innerText()).toLowerCase();
      check(tierText.includes("live today on hobby") && tierText.includes("passport"), "/intro shows the three-tier table");
      await page.getByRole("link", { name: /Start the demo/ }).click();
      await page.waitForURL("**/story", { timeout: 15_000 });
      check(new URL(page.url()).pathname === "/story", "Start the demo reaches /story");
    }
    check(errors.length === 0, `no console errors on /intro at ${width} ${errors.slice(0, 2).join(" | ")}`);
    await page.close();
  }

  // ---- 4. X-ray mode (the demo coaching overlay) ---------------------------------------------------
  // Off by default; ?xray=1 turns it on. The overlay must never cause horizontal overflow, a badge must
  // render, and hovering it must open its card. The X key toggles, except while typing in the Ask box.
  {
    const off = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await off.goto(BASE + "/story", { waitUntil: "networkidle" });
    check((await off.locator("[data-xray-badge]").count()) === 0, "x-ray is off by default (no badges on /story)");
    await off.close();

    for (const [route, width, height] of [["/explorer", 1440, 900], ["/explorer", 1920, 1000], ["/intro", 1440, 900]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      const errors = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      await page.goto(`${BASE}${route}?xray=1`, { waitUntil: "networkidle" });
      await page.locator("[data-xray-badge]").first().waitFor({ timeout: 10_000 }).catch(() => {});
      const o = await page.evaluate(() => {
        const box = document.querySelector(".\\@container > div") || document.getElementById("intro-deck");
        return { page: document.documentElement.scrollWidth - window.innerWidth, box: box ? box.scrollWidth - box.clientWidth : 0 };
      });
      check(o.page <= 0 && o.box <= 0, `no horizontal overflow on ${route} at ${width} with x-ray on (page ${o.page}px, box ${o.box}px)`);
      const badges = await page.locator("[data-xray-badge]").count();
      check(badges > 0, `x-ray renders badges on ${route} at ${width} (${badges})`);
      if (width === 1440) {
        await page.locator("[data-xray-badge]").first().hover();
        const card = page.locator("[data-slot=tooltip-content]").first();
        await card.waitFor({ timeout: 5000 }).catch(() => {});
        const text = (await card.innerText().catch(() => "")) || "";
        check(/Fast run: (keep|skip)/.test(text) && /What it is/i.test(text), `hovering a badge on ${route} shows its card (${text.slice(0, 40).replace(/\s+/g, " ")}…)`);
        // Walk away to a neutral spot (the first badge can sit at the screen corner, so not (5, 5)).
        await page.mouse.move(1000, 700, { steps: 12 });
        await page.waitForTimeout(600);
        check((await page.locator("[data-slot=tooltip-content]").count()) === 0, `moving off the badge hides the card on ${route}`);
      }
      check(errors.length === 0, `no console errors on ${route} at ${width} with x-ray on ${errors.slice(0, 2).join(" | ")}`);
      await page.close();
    }

    // Objection markers: on /governance, at least one renders, hovering shows "They say", no overflow.
    {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      const errors = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      await page.goto(`${BASE}/governance?xray=1`, { waitUntil: "networkidle" });
      await page.locator("[data-xray-objection]").first().waitFor({ timeout: 10_000 }).catch(() => {});
      const n = await page.locator("[data-xray-objection]").count();
      check(n > 0, `objection badges render on /governance (${n})`);
      check((await page.getByTestId("xray-objection-count").count()) === 1, "legend shows the objection count");
      if (n > 0) {
        await page.locator("[data-xray-objection]").first().hover();
        const card = page.locator("[data-slot=tooltip-content]").first();
        await card.waitFor({ timeout: 5000 }).catch(() => {});
        const text = (await card.innerText().catch(() => "")) || "";
        check(/They say/i.test(text) && /Objection ·/.test(text), `hovering an objection badge shows "They say" (${text.slice(0, 40).replace(/\s+/g, " ")}…)`);
        const box = await card.boundingBox();
        check(!!box && box.x >= 0 && box.x + box.width <= 1440, "objection card sits inside the 1440px viewport");
        await page.mouse.move(1000, 700, { steps: 12 });
        await page.waitForTimeout(600);
      }
      const o = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      check(o <= 0, `no horizontal overflow on /governance with objections on (${o}px)`);
      await page.getByRole("switch", { name: /Objections/ }).click();
      await page.waitForTimeout(500);
      check((await page.locator("[data-xray-objection]").count()) === 0, "the Objections toggle hides the markers");
      check((await page.locator("[data-xray-badge]").count()) > 0, "stop badges stay when objections are off");
      check(errors.length === 0, `no console errors on /governance with objections ${errors.slice(0, 2).join(" | ")}`);
      await page.close();
    }

    const keys = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await keys.goto(BASE + "/story?xray=1", { waitUntil: "networkidle" });
    const opener = keys.getByRole("button", { name: "Open the Ask the data panel" });
    if (await opener.count()) await opener.click();
    const box = keys.getByRole("textbox", { name: "Question" });
    await box.click();
    await keys.keyboard.type("x");
    check((await box.inputValue()) === "x" && (await keys.locator("[data-xray-badge]").count()) > 0, 'typing "x" in the Ask box does not toggle x-ray');
    await keys.locator("body").click({ position: { x: 700, y: 20 } });
    await keys.keyboard.press("x");
    await keys.waitForTimeout(300);
    check((await keys.locator("[data-xray-badge]").count()) === 0, "the X key turns x-ray off");
    await keys.keyboard.press("x");
    await keys.waitForTimeout(500);
    check((await keys.locator("[data-xray-badge]").count()) > 0, "the X key turns x-ray back on");
    await keys.close();
  }
} finally {
  await browser.close();
}

console.log(failures.length ? `SMOKE FAILED: ${failures.length} check(s)` : "SMOKE PASSED");
process.exit(failures.length ? 1 : 0);
