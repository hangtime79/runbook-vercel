import models from "./askModels.json";
import prices from "../data/model_prices.json";

/**
 * Model policy for "Ask the data", server side. The allowlist is lib/askModels.json (also read by
 * pipeline/export_web_data.py to export list prices). Nothing here reads a credential.
 */

export const ALLOWED_MODELS: readonly { id: string; label: string }[] = models.models;
export const DEFAULT_MODEL: string = models.default;

/** Per-request gateway options: zero data retention and no prompt training (docs: AI Gateway ZDR). */
export function gatewayOptions() {
  // Fail closed: ZDR is on unless ASK_ZDR=0. A Hobby-plan team cannot use ZDR (the gateway answers
  // 403), so local work on such a key sets ASK_ZDR=0; the /governance page shows the real state.
  // No-training is free on every plan (docs: disallow prompt training), so it stays on without ZDR.
  const zdr = process.env.ASK_ZDR !== "0";
  return zdr ? { zeroDataRetention: true, disallowPromptTraining: true } : { disallowPromptTraining: true };
}

export const zdrEnabled = () => process.env.ASK_ZDR !== "0";
export const modelSwitchEnabled = () => process.env.ASK_DEMO_MODEL_SWITCH === "1";

/**
 * Which model answers. The env default (ASK_MODEL) applies unless it is off the allowlist.
 * The request body may choose only when the demo switch is on and the id is on the allowlist;
 * ASK_ALLOW_MODEL_OVERRIDE (local eval) may pick anything.
 */
export function pickModel(requested: unknown): string {
  const requestedId = typeof requested === "string" ? requested : "";
  if (process.env.ASK_ALLOW_MODEL_OVERRIDE === "1" && requestedId) return requestedId;
  const envModel = process.env.ASK_MODEL;
  const base = ALLOWED_MODELS.some((m) => m.id === envModel) ? (envModel as string) : DEFAULT_MODEL;
  if (modelSwitchEnabled() && ALLOWED_MODELS.some((m) => m.id === requestedId)) return requestedId;
  return base;
}

/** List-price estimate in USD from data/model_prices.json; null when the model has no price. */
export function estimateCost(model: string, inputTokens = 0, outputTokens = 0): number | null {
  const p = (prices.usd_per_token as Record<string, { input: number; output: number }>)[model];
  return p ? inputTokens * p.input + outputTokens * p.output : null;
}

export type AnswerMeta = {
  model: string;
  ms: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number | null;
  /** "gateway" = reported by AI Gateway for the request; "list price" = tokens x catalogue price. */
  costSource: "gateway" | "list price" | null;
};
