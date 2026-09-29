import { ShapChart } from "@/components/Charts";
import Markdown from "@/components/Markdown";
import { readDoc, readShapImportance } from "@/lib/docs";

export default async function ModelPage() {
  const [metrics, shap, importance] = await Promise.all([
    readDoc("metrics.md"),
    readDoc("shap.md"),
    readShapImportance(),
  ]);
  const top15 = importance.slice(0, 15).reverse(); // horizontal bars: largest at the top
  return (
    <>
      <h1>Detection Model</h1>
      <Markdown>{metrics}</Markdown>
      <h2>Global feature importance (mean |SHAP|)</h2>
      <ShapChart data={top15} />
      <Markdown>{shap}</Markdown>
    </>
  );
}
