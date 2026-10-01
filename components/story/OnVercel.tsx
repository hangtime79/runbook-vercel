import { Inline } from "@/components/Markdown";

/** A quiet "On Vercel" line under a heading: the platform fact behind what is on screen. Text lives in content/story/. */
export function OnVercel({ text, className = "" }: { text: string; className?: string }) {
  return (
    <p className={`m-0 flex max-w-[720px] items-start gap-2 text-[13px] leading-[1.45] text-foreground/60 ${className}`} data-testid="on-vercel">
      <svg aria-hidden viewBox="0 0 76 65" className="mt-[3px] h-[11px] w-[12px] flex-none fill-current text-foreground/70">
        <path d="M37.59.25l36.95 64H.64l36.95-64z" />
      </svg>
      <span className="text-pretty">
        <Inline>{text}</Inline>
      </span>
    </p>
  );
}
