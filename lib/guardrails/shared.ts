import {
  experimental_evaluate as evaluate,
  type Experimental_EvaluationModel as EvaluationModel,
  type Experimental_EvaluationQuestion as EvaluationQuestion,
  type LanguageModelMiddleware,
} from "ai";

// Kept free of "@/" imports so pipeline/test_scope_gate.mts can run it with plain node.

/** What one evaluation-model call cost and how long it took; the UI shows both. */
export type GuardCall = {
  model: string;
  ms: number;
  inputTokens: number;
  outputTokens: number;
  /** USD: the gateway's reported cost when present, else tokens x the list price in config.json. */
  costUsd: number;
};

export type ScopeVerdict = GuardCall & {
  allowed: boolean;
  /** What Jev says the question is asking for (dataset_question, code_request, ...), or "unavailable". */
  category: string;
  /** P(the question can be answered from this dataset). Null when the check failed. */
  probability: number | null;
};

export type OutputVerdict = GuardCall & {
  allowed: boolean;
  category: string;
  probability: number | null;
};

/**
 * Per-request record the guardrails write their verdicts into. The route creates one per request,
 * hands it to the stack and reads it back into the UI message metadata: a language model
 * middleware cannot attach message metadata itself, so this is how the verdicts reach the client.
 */
export type GuardContext = {
  scope?: ScopeVerdict;
  output?: OutputVerdict;
};

export type GuardrailOptions = {
  /** Evaluation model: a gateway id string, or a model instance (the tests pass a mock). */
  model: EvaluationModel;
  timeoutMs: number;
  usdPerMillionTokens: number;
};

export type Guardrail = (ctx: GuardContext, opts: GuardrailOptions & Record<string, unknown>) => LanguageModelMiddleware;

/** Run one evaluation with a hard timeout and report cost. Throws on error or timeout: callers fail closed. */
export async function judge<const Q extends Record<string, EvaluationQuestion>>(
  opts: GuardrailOptions,
  state: Parameters<typeof evaluate>[0]["state"],
  questions: Q,
  abortSignal?: AbortSignal
) {
  const t0 = performance.now();
  const timeout = AbortSignal.timeout(opts.timeoutMs);
  const r = await evaluate({
    model: opts.model,
    state,
    questions,
    maxRetries: 1,
    abortSignal: abortSignal ? AbortSignal.any([abortSignal, timeout]) : timeout,
    // No prompt training on any plan. ZDR is deliberately not requested: the team is on Hobby (ASK_ZDR=0).
    providerOptions: { gateway: { disallowPromptTraining: true } },
  });
  const inputTokens = r.usage.inputTokens ?? 0;
  const outputTokens = r.usage.outputTokens ?? 0;
  const reported = Number((r.providerMetadata?.gateway as { cost?: unknown } | undefined)?.cost);
  const call: GuardCall = {
    model: typeof opts.model === "string" ? opts.model : opts.model.modelId,
    ms: Math.round(performance.now() - t0),
    inputTokens,
    outputTokens,
    costUsd: Number.isFinite(reported) ? reported : ((inputTokens + outputTokens) * opts.usdPerMillionTokens) / 1_000_000,
  };
  return { answers: r.answers, call };
}

const usage = {
  inputTokens: { total: 0, noCache: 0, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 0, text: 0, reasoning: undefined },
};

/** A finished model result that holds only `text`, for a guardrail that answers in the model's place. */
export function textResult(text: string) {
  return {
    content: [{ type: "text" as const, text }],
    finishReason: { unified: "stop" as const, raw: undefined },
    usage,
    warnings: [],
  };
}

/** The same, as a stream. */
export function textStream(text: string, id = "guard") {
  return new ReadableStream({
    start(c) {
      c.enqueue({ type: "stream-start", warnings: [] });
      c.enqueue({ type: "text-start", id });
      c.enqueue({ type: "text-delta", id, delta: text });
      c.enqueue({ type: "text-end", id });
      c.enqueue({ type: "finish", finishReason: { unified: "stop", raw: undefined }, usage });
      c.close();
    },
  });
}
