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
