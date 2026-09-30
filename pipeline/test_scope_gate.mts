// Mock-model test for the Ask scope gate and output check (no network, no gateway).
// Usage: node --no-warnings pipeline/test_scope_gate.mts
//
// Builds the same stack the route builds (lib/guardrails/index.ts) around a mock answering model,
// with a mock evaluation model standing in for Jev. The answering model counts its calls so the
// tests can assert it is never reached when the gate says no.
import assert from "node:assert/strict";
import { isStepCount, simulateReadableStream, streamText, tool, wrapLanguageModel } from "ai";
import { Experimental_EvaluationMockModelV4 as MockEvalModel, MockLanguageModelV4 } from "ai/test";
import { z } from "zod";
import { ASK } from "../lib/copy.ts";
import { buildGuardrails, createGuardContext } from "../lib/guardrails/index.ts";

const usage = {
  inputTokens: { total: 3, noCache: 3, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 5, text: 5, reasoning: undefined },
};
const finish = (unified: "stop" | "tool-calls") => ({ type: "finish" as const, finishReason: { unified, raw: undefined }, logprobs: undefined, usage });
const text = (t: string) => [
  { type: "text-start" as const, id: "t" },
  { type: "text-delta" as const, id: "t", delta: t },
  { type: "text-end" as const, id: "t" },
];

/** An answering model that replays `steps` and counts how many times the stack called it. */
function answering(steps: object[][]) {
  let i = 0;
  const m = new MockLanguageModelV4({
    doStream: async () => ({ stream: simulateReadableStream({ chunks: steps[Math.min(i++, steps.length - 1)] as never }) }),
  });
  return m;
}

type Verdicts = { inScope?: number; category?: string; withinScope?: number; outCategory?: string };
/** A Jev stand-in: answers the gate's questions and the output check's by which question ids it sees. */
function jev(v: Verdicts | "throw") {
  const calls: string[] = [];
  const model = new MockEvalModel({
    doEvaluate: async ({ questions }) => {
      if (v === "throw") throw new Error("jev down");
      const gate = "inScope" in questions;
      calls.push(gate ? "gate" : "output");
      return {
        answers: gate
          ? {
              inScope: { type: "boolean", probability: v.inScope ?? 0.9 },
              category: { type: "choice", choice: v.category ?? "dataset_question" },
            }
          : {
              withinScope: { type: "boolean", probability: v.withinScope ?? 0.9 },
              category: { type: "choice", choice: v.outCategory ?? "dataset_answer" },
            },
        usage: { inputTokens: 400, outputTokens: 70 },
        warnings: [],
      };
    },
  });
  return { model, calls };
}

const query = tool({
  description: "stub",
  inputSchema: z.object({ sql: z.string() }),
  execute: async ({ sql }) => ({ sql, columns: ["n"], rows: [[1]], rowCount: 1, truncated: false }),
});

async function run(answerModel: MockLanguageModelV4, evalModel: MockEvalModel, question = "What is the fraud rate?") {
  const ctx = createGuardContext();
  const model = wrapLanguageModel({
    model: answerModel,
    middleware: buildGuardrails(ctx, { overrides: { model: evalModel } }),
  });
  const parts: { type: string; [k: string]: unknown }[] = [];
  const result = streamText({
    model,
    prompt: question,
    tools: { query },
    stopWhen: isStepCount(8),
    onError: () => {},
  });
  for await (const p of result.stream) parts.push(p as never);
  return {
    ctx,
    modelCalls: answerModel.doStreamCalls.length,
    error: parts.some((p) => p.type === "error"),
    text: parts.filter((p) => p.type === "text-delta").map((p) => p.text).join(""),
    queryRan: parts.some((p) => p.type === "tool-result" && p.toolName === "query"),
  };
}

const answer = [[...text("9.5% of labeled transactions are fraud."), finish("stop")]];

// 1. In scope: the answering model runs and its text passes both checks.
{
  const j = jev({});
  const r = await run(answering(answer), j.model);
  assert.equal(r.error, false);
  assert.equal(r.modelCalls, 1, "case 1: answering model called once");
  assert.equal(r.text, "9.5% of labeled transactions are fraud.");
  assert.deepEqual(j.calls, ["gate", "output"], "case 1: one gate call, one output check");
  assert.equal(r.ctx.scope?.allowed, true);
  assert.equal(r.ctx.output?.allowed, true);
  console.log("PASS 1 in scope: answered, both checks passed");
}

// 2. Out of scope: refusal, and the answering model is never called (the short-circuit).
{
  const j = jev({ inScope: 0.03, category: "code_request" });
  const m = answering(answer);
  const r = await run(m, j.model, "Write Python to do this analysis");
  assert.equal(r.error, false);
  assert.equal(r.modelCalls, 0, "case 2: answering model must not be called");
  assert.equal(r.text, ASK.refusal);
  assert.deepEqual(j.calls, ["gate"], "case 2: the output check sits inside the gate and never runs");
  assert.equal(r.ctx.scope?.allowed, false);
  assert.equal(r.ctx.scope?.category, "code_request");
  assert.equal(r.ctx.scope?.probability, 0.03);
  console.log("PASS 2 out of scope: fixed refusal, answering model never called");
}

// 3. Dataset-like probability but the wrong category still blocks (requireDatasetCategory).
{
  const r = await run(answering(answer), jev({ inScope: 0.7, category: "person_lookup" }).model);
  assert.equal(r.modelCalls, 0);
  assert.equal(r.text, ASK.refusal);
  console.log("PASS 3 category person_lookup blocks even at p=0.7");
}

// 4. The gate throws: fail closed with the distinct message, answering model never called.
{
  const r = await run(answering(answer), jev("throw").model);
  assert.equal(r.modelCalls, 0, "case 4: fail closed must not reach the answering model");
  assert.equal(r.text, ASK.gateUnavailable);
  assert.equal(r.ctx.scope?.category, "unavailable");
  console.log("PASS 4 gate error: fails closed, distinct message, answering model never called");
}

// 5. Output check withholds: text replaced with the refusal, the query step's result is kept.
{
  const steps = [
    [{ type: "tool-call" as const, toolCallId: "c1", toolName: "query", input: JSON.stringify({ sql: "select 1" }) }, finish("tool-calls")],
    [...text("Here is a Python script: import pandas"), finish("stop")],
  ];
  const r = await run(answering(steps), jev({ withinScope: 0.05, outCategory: "code" }).model);
  assert.equal(r.modelCalls, 2);
  assert.equal(r.text, ASK.refusal, "case 5: text replaced");
  assert.equal(r.queryRan, true, "case 5: the query that ran stays");
  assert.equal(r.ctx.output?.allowed, false);
  assert.equal(r.ctx.output?.category, "code");
  console.log("PASS 5 output check: answer withheld, evidence kept");
}

// 6. Output check errors after the gate passed: the answer is withheld, never shown unchecked.
{
  let n = 0;
  const flaky = new MockEvalModel({
    doEvaluate: async ({ questions }) => {
      if (!("inScope" in questions)) throw new Error("jev down");
      n++;
      return {
        answers: { inScope: { type: "boolean", probability: 0.9 }, category: { type: "choice", choice: "dataset_question" } },
        warnings: [],
      };
    },
  });
  const r = await run(answering(answer), flaky);
  assert.equal(n, 1);
  assert.equal(r.text, ASK.gateUnavailable);
  console.log("PASS 6 output check error: answer withheld, fails closed");
}
