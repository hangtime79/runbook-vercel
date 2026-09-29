import Markdown from "@/components/Markdown";
import { readDoc } from "@/lib/docs";

export default async function FindingsPage() {
  return <Markdown>{await readDoc("findings.md")}</Markdown>;
}
