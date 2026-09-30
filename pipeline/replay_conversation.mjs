// Replays one conversation from pipeline/ask_redteam.json against a Vercel preview through
// `vercel curl` (which handles Deployment Protection), carrying the real history and metadata.
// Usage: node pipeline/replay_conversation.mjs <preview_url> [conversation_id]   (default transcript-six)
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const [url, id = "transcript-six"] = process.argv.slice(2);
if (!url) {
  console.error("Usage: node pipeline/replay_conversation.mjs <preview_url> [conversation_id]");
  process.exit(2);
}
const conv = JSON.parse(readFileSync("pipeline/ask_redteam.json", "utf8")).conversations.find((c) => c.id === id);
if (!conv) throw new Error(`No conversation ${id}`);
const dir = mkdtempSync(path.join(tmpdir(), "replay-"));

const history = [];
let failures = 0;
for (const [i, t] of conv.turns.entries()) {
  history.push({ id: `u${i}`, role: "user", parts: [{ type: "text", text: t.question }] });
  const file = path.join(dir, `turn${i}.json`);
  writeFileSync(file, JSON.stringify({ messages: history }));
  const out = execFileSync(
    "vercel",
    ["curl", "/api/ask", "--deployment", url, "--", "-s", "-m", "150", "-X", "POST", "-H", "content-type: application/json", "-d", `@${file}`],
    { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 }
  );
  let text = "";
  let meta = {};
  for (const line of out.split("\n")) {
    if (!line.startsWith("data: {")) continue;
    const ev = JSON.parse(line.slice(6));
    if (ev.type === "text-delta") text += ev.delta;
    if (ev.messageMetadata) meta = { ...meta, ...ev.messageMetadata };
  }
  const s = meta.scope;
  const outcome = !s ? "no-metadata" : s.outcome === "allowed" && meta.output && !meta.output.allowed ? "block" : s.outcome === "allowed" ? "allow" : s.outcome === "blocked" ? "block" : s.outcome;
  const ok = outcome === t.expect && (outcome !== "block" || !t.category || s.category === t.category);
  if (!ok) failures++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  turn ${i + 1}  expect ${t.expect}${t.category ? " " + t.category : ""}  got ${outcome} ${s?.category ?? ""}${s?.followUpOf ? " (follow-up to " + s.followUpOf + ")" : ""}  p=${s?.probability ?? "n/a"}  gate ${s?.ms ?? "?"} ms  | ${t.question.slice(0, 60)}`
  );
  history.push({ id: `a${i}`, role: "assistant", metadata: meta, parts: [{ type: "text", text: text || " " }] });
}
process.exit(failures ? 1 : 0);
