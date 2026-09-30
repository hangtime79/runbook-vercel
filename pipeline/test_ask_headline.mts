// Mock-model test for the Ask route's headline step (no network, no gateway).
// Usage: node --no-warnings pipeline/test_ask_headline.mts
//
// Drives streamText with the SDK's MockLanguageModelV4 and the route's own prepareStep and
// headline tool. Case 3 is the regression witness: it reproduces the old forced-toolChoice
// behaviour and must still fail, so the passing cases prove something.
import assert from "node:assert/strict";
import { isStepCount, simulateReadableStream, streamText, tool } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { z } from "zod";
import { headlineTool, offerHeadlineAfterQuery } from "../lib/askSteps.ts";

const usage = {
  inputTokens: { total: 3, noCache: 3, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 5, text: 5, reasoning: undefined },
};
const finish = (unified: "stop" | "tool-calls" | "other") => ({
  type: "finish" as const,
  finishReason: { unified, raw: undefined },
  logprobs: undefined,
  usage,
});
const call = (id: string, toolName: string, input: object) => ({
  type: "tool-call" as const,
  toolCallId: id,
  toolName,
  input: JSON.stringify(input),
});
const text = (t: string) => [
  { type: "text-start" as const, id: "t" },
  { type: "text-delta" as const, id: "t", delta: t },
  { type: "text-end" as const, id: "t" },
];

// One entry per model call, in order.
const model = (steps: object[][]) => {
  let i = 0;
  return new MockLanguageModelV4({
    doStream: async () => ({ stream: simulateReadableStream({ chunks: steps[Math.min(i++, steps.length - 1)] as never }) }),
  });
};

const query = tool({
  description: "stub",
  inputSchema: z.object({ sql: z.string() }),
  execute: async ({ sql }) => ({ sql, columns: ["n"], rows: [[1]], rowCount: 1, truncated: false, ms: 1 }),
});

async function run(m: MockLanguageModelV4, prepareStep: unknown) {
  const parts: { type: string; [k: string]: unknown }[] = [];
  const result = streamText({
    model: m,
    prompt: "q",
    tools: { query, headline: headlineTool },
    stopWhen: isStepCount(8),
    prepareStep: prepareStep as never,
    onError: () => {}, // the route logs here; the test reads the error part instead
  });
  for await (const p of result.stream) parts.push(p as never);
  const types = parts.map((p) => p.type);
  return {
    error: types.includes("error"),
    finished: types.includes("finish"),
    text: parts.filter((p) => p.type === "text-delta").map((p) => p.text).join(""),
    headline: parts.some((p) => p.type === "tool-result" && p.toolName === "headline"),
  };
}

const step1 = [call("c1", "query", { sql: "select 1" }), finish("tool-calls")];

// 1. Headline offered and used: query, headline, then the answer.
{
  const r = await run(
    model([step1, [call("c2", "headline", { value: "9.5%", label: "fraud rate" }), finish("tool-calls")], [...text("Answer."), finish("stop")]]),
    offerHeadlineAfterQuery
  );
  assert.equal(r.error, false, "case 1: no error part");
  assert.ok(r.finished && r.text === "Answer." && r.headline, "case 1: text, stat and finish");
  console.log("PASS 1 headline offered and used: answer + stat");
}

// 2. The model skips the headline on its step: the answer still completes, no stat.
{
  const r = await run(model([step1, [...text("Answer without a stat."), finish("stop")]]), offerHeadlineAfterQuery);
  assert.equal(r.error, false, "case 2: no error part");
  assert.ok(r.finished && r.text === "Answer without a stat." && !r.headline, "case 2: text, no stat, finish");
  console.log("PASS 2 headline skipped: answer completes, no stat, no error");
}

// 3. Witness: the old forced choice with a step that returns nothing valid fails the stream.
{
  const forced = ({ steps }: { steps: { toolResults: { toolName: string }[] }[] }) =>
    steps.at(-1)?.toolResults.some((r) => r.toolName === "query")
      ? { toolChoice: { type: "tool", toolName: "headline" } }
      : {};
  const r = await run(model([step1, [{ type: "text-start", id: "x" }, { type: "text-end", id: "x" }, finish("other")]]), forced);
  assert.equal(r.error, true, "case 3: forced choice must reproduce the failure");
  console.log("PASS 3 witness: forced toolChoice still errors when the model returns nothing");
}
