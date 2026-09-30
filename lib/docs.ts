import fs from "node:fs/promises";
import path from "node:path";

export async function readDoc(name: string): Promise<string> {
  try {
    return await fs.readFile(path.join(process.cwd(), "data", "docs", name), "utf8");
  } catch {
    return `*Missing document: \`${name}\`*`;
  }
}

export type ShapRow = { feature: string; mean_abs_shap: number };

export async function readShapImportance(): Promise<ShapRow[]> {
  const raw = await fs.readFile(path.join(process.cwd(), "data", "shap_importance.json"), "utf8");
  return JSON.parse(raw);
}

export type ModelSummary = {
  holdout: { auc: number; pr_auc: number; best_round: number; max_rounds: number; rows: number; prevalence: number };
  cv: { auc_mean: number; auc_std: number; pr_auc_mean: number; pr_auc_std: number };
  operating_point: { threshold: number; precision: number; recall: number };
  confusion: { tn: number; fp: number; fn: number; tp: number };
  n_features: number;
  diagnostics: {
    leakage_ceiling: number;
    underfit_floor: number;
    cv_std_limit: number;
    checks: { n: number; label: string; status: "PASS" | "FLAG" }[];
    overall: "PASS" | "FLAG";
  };
  shap_directions: Record<string, string>;
};

export async function readModelSummary(): Promise<ModelSummary> {
  const raw = await fs.readFile(path.join(process.cwd(), "data", "model_summary.json"), "utf8");
  return JSON.parse(raw);
}
