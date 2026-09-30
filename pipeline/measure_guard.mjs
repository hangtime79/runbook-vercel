// Measures what the guardrails add to an allowed question: Jev latency, tokens and cost for the
// scope gate and the output check, next to the total request time.
// Usage: node pipeline/measure_guard.mjs [base_url]     (default http://localhost:3000)
const BASE = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const qs = [
  "Which hour of the day has the highest fraud rate, counting only hours with at least 500 labeled transactions?",
  "What is the fraud rate for purchases under five dollars compared with purchases over one hundred dollars?",
  "Which age groups see the most fraud?",
];
for (const q of qs) {
  const res = await fetch(`${BASE}/api/ask`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages: [{ id: "q", role: "user", parts: [{ type: "text", text: q }] }] }),
  });
  const body = await res.text();
  const line = body.split("\n").find((l) => l.includes('"type":"finish"') && l.includes("messageMetadata"));
  const m = JSON.parse(line.slice(6)).messageMetadata;
  const pick = (v) => ({ ms: v.ms, in: v.inputTokens, out: v.outputTokens, usd: v.costUsd, p: v.probability });
  console.log(JSON.stringify({ q: q.slice(0, 40), totalMs: m.answer.ms, answerUsd: m.answer.costUsd, gate: pick(m.scope), output: pick(m.output) }));
}
