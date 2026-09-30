import type { LanguageModelMiddleware } from "ai";
import config from "./config.json" with { type: "json" };
import { outputCheck } from "./outputCheck.ts";
import { scopeGate } from "./scopeGate.ts";
import type { Guardrail, GuardContext, GuardrailOptions } from "./shared.ts";

export type { GuardContext, OutputVerdict, ScopeVerdict } from "./shared.ts";

// Gateway-level guardrails are not used. AI Gateway has a permission for them (`aiGatewayGuardrails`)
// but it is undocumented, and a virtual model config resolves to one model with provider routing
// and failure fallback: it cannot chain a check into an answer. If Vercel documents gateway
// guardrails, they would replace this stack and only this file would change.

/** Every guardrail the config can name. Adding one is a new file here plus an id in config.json. */
const REGISTRY: Record<string, Guardrail> = { scopeGate, outputCheck };

export const createGuardContext = (): GuardContext => ({});

/**
 * The stack for one request, in the order config.json lists it. wrapLanguageModel makes the FIRST
 * entry the outermost wrapper: it sees the call first and, if it answers itself (the scope gate's
 * refusal), nothing inside it runs. So scopeGate goes before outputCheck, which sits directly
 * around the answering model and sees its raw answer.
 *
 * `overrides` is for tests and the eval only: a mock evaluation model, other thresholds.
 */
export function buildGuardrails(
  ctx: GuardContext,
  { skip = [], overrides = {} }: { skip?: string[]; overrides?: Partial<GuardrailOptions> & Record<string, unknown> } = {}
): LanguageModelMiddleware[] {
  const base: GuardrailOptions = {
    model: config.model,
    timeoutMs: config.timeoutMs,
    usdPerMillionTokens: config.usdPerMillionTokens,
  };
  return config.guardrails
    .filter((id) => !skip.includes(id))
    .map((id) => {
      const make = REGISTRY[id];
      if (!make) throw new Error(`Unknown guardrail "${id}" in lib/guardrails/config.json`);
      const own = (config as unknown as Record<string, object>)[id] ?? {};
      return make(ctx, { ...base, ...own, ...overrides });
    });
}
