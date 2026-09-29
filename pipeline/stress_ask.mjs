// Stress /api/ask to reproduce streams that end without a finish event.
// Usage: node pipeline/stress_ask.mjs [base_url] [rounds]
// Prints one line per request and a summary. Never prints response bodies.
import { readFileSync } from "node:fs";

const BASE = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const ROUNDS = Number(process.argv[3] || 3);
const MODEL = process.argv[4]; // needs a server started with ASK_ALLOW_MODEL_OVERRIDE=1
const questions = JSON.parse(readFileSync("pipeline/ask_expected.json", "utf8")).questions.map((q) => q.question);

async function once(question) {
  const t0 = performance.now();
  const out = { finished: false, error: null, lastType: null, events: 0, tools: 0, bytes: 0, gapMax: 0 };
  let last = t0;
  try {
    const res = await fetch(`${BASE}/api/ask`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages: [{ id: "q", role: "user", parts: [{ type: "text", text: question }] }] }),
      signal: AbortSignal.timeout(180_000),
    });
    if (!res.ok) return { ...out, error: `HTTP ${res.status}`, ms: performance.now() - t0 };
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const now = performance.now();
      out.gapMax = Math.max(out.gapMax, now - last);
      last = now;
      out.bytes += value.length;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 2);
        if (!line.startsWith("data: {")) continue;
        const ev = JSON.parse(line.slice(6));
        out.events++;
        out.lastType = ev.type;
        if (ev.type === "tool-output-available") out.tools++;
        if (ev.type === "error") out.error = `stream error: ${String(ev.errorText).slice(0, 120)}`;
        if (ev.type === "finish") out.finished = true;
      }
    }
  } catch (e) {
    out.error = `client: ${String(e).slice(0, 120)}`;
  }
  return { ...out, ms: performance.now() - t0 };
}

const results = [];
for (let r = 0; r < ROUNDS; r++) {
  for (const [qi, q] of questions.entries()) {
    const x = await once(q);
    const status = x.error ? "ERROR" : x.finished ? "ok" : "NO-FINISH";
    console.log(
      `r${r} q${qi} ${status.padEnd(9)} ${(x.ms / 1000).toFixed(1)}s events=${x.events} tools=${x.tools} ` +
        `last=${x.lastType} maxGap=${(x.gapMax / 1000).toFixed(1)}s${x.error ? " " + x.error : ""}`
    );
    results.push({ qi, status });
  }
}
const count = (s) => results.filter((x) => x.status === s).length;
console.log(`SUMMARY ${BASE}: ok=${count("ok")} no-finish=${count("NO-FINISH")} error=${count("ERROR")} of ${results.length}`);
