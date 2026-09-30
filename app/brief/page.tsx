import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Page, PageHeader } from "@/components/PageHeader";
import { readDoc } from "@/lib/docs";

export const runtime = "nodejs";

export const metadata = { title: "The full brief · Card Fraud Analysis" };

// Dark-mode prose for the Phase 9 brief (NARRATIVE.md); no typography plugin is installed.
const PROSE =
  "max-w-[760px] text-[15px] leading-[1.65] text-foreground/85 " +
  "[&_h1]:hidden [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-[28px] [&_h2]:font-semibold [&_h2]:leading-[1.15] [&_h2]:tracking-tight2 [&_h2]:text-foreground " +
  "[&_h3]:mb-2 [&_h3]:mt-7 [&_h3]:text-[19px] [&_h3]:font-semibold [&_h3]:text-foreground " +
  "[&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 " +
  "[&_strong]:font-semibold [&_strong]:text-foreground [&_hr]:my-8 [&_hr]:border-border " +
  "[&_code]:rounded-sm [&_code]:bg-foreground/10 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[13px] " +
  "[&_table]:my-5 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:text-[13px] " +
  "[&_th]:border-b [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-[11px] [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-[0.08em] [&_th]:text-foreground/60 " +
  "[&_td]:border-b [&_td]:border-foreground/[0.07] [&_td]:px-3 [&_td]:py-2 " +
  "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-signal-600 [&_blockquote]:pl-4 [&_blockquote]:text-foreground/75";

export default async function BriefPage() {
  const md = await readDoc("NARRATIVE.md");
  return (
    <Page>
      <PageHeader kicker="Phase 9 · Narrative" title="The full brief" lede="The written analysis behind the Story, as delivered to the data scientist walking into the meeting." />
      <article className={PROSE}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
      </article>
    </Page>
  );
}
