// Asks one question on each allowlisted model, and once with a model that is not on the allowlist.
// Needs a server started with ASK_DEMO_MODEL_SWITCH=1 (and gateway credentials).
// Usage: node pipeline/check_model_switch.mjs [base_url]
// Asserts the answer metadata names the model asked for, and that an unknown model falls back to the default.
import { readFileSync } from "node:fs";

const BASE = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const cfg = JSON.parse(readFileSync("lib/askModels.json", "utf8"));
const QUESTION = "How does fraud differ between transactions with and without a signature?";

async function ask(model) {
  const res = await fetch(`${BASE}/api/ask`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model, messages: [{ id: "q", role: "user", parts: [{ type: "text", text: QUESTION }] }] }),
    signal: AbortSignal.timeout(180_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  let meta = null;
  for (const line of text.split("\n")) {
    if (!line.startsWith("data: {")) continue;
    const ev = JSON.parse(line.slice(6));
    if (ev.messageMetadata?.answer) meta = ev.messageMetadata.answer;
  }
  return meta;
}

let failed = 0;
const check = (ok, msg) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`);
  if (!ok) failed++;
};

for (const m of cfg.models) {
  const meta = await ask(m.id);
  check(meta?.model === m.id, `asked ${m.id}: answered by ${meta?.model}; ${((meta?.ms ?? 0) / 1000).toFixed(1)} s; ${meta?.inputTokens} in / ${meta?.outputTokens} out; cost ${meta?.costUsd} (${meta?.costSource})`);
}
const off = await ask("openai/not-on-the-allowlist");
check(off?.model === cfg.default, `asked a model off the allowlist: answered by ${off?.model} (default is ${cfg.default})`);
process.exit(failed ? 1 : 0);
