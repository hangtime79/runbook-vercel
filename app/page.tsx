import AskData from "@/components/AskData";
import Markdown from "@/components/Markdown";
import { readDoc } from "@/lib/docs";

export default async function NarrativePage() {
  const narrative = await readDoc("NARRATIVE.md");
  return (
    <>
      <AskData />
      <Markdown>{narrative}</Markdown>
    </>
  );
}
