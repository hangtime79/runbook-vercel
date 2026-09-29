import Markdown from "@/components/Markdown";
import { readDoc } from "@/lib/docs";

export default async function NarrativePage() {
  const narrative = await readDoc("NARRATIVE.md");
  return (
    <>
      <div className="card">
        <strong>Ask the analysis</strong>
        <p className="muted" style={{ margin: "4px 0 0" }}>
          Coming in P2: ask questions of the data in plain language.
        </p>
      </div>
      <Markdown>{narrative}</Markdown>
    </>
  );
}
