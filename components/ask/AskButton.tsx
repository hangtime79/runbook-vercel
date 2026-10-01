"use client";

import { Button } from "@/components/ui/button";
import { useAsk } from "./AskProvider";

/** A Story chapter's "Ask:" button. Sends the question to the shared chat and opens the panel. */
export function AskButton({ question, xray }: { question: string; xray?: string }) {
  const { ask, busy } = useAsk();
  return (
    <Button
      variant="outline"
      onClick={() => ask(question)}
      disabled={busy}
      data-xray={xray}
      className="h-auto whitespace-normal rounded-md border-border-strong bg-background px-3.5 py-2 text-left text-[13px] font-medium text-foreground hover:bg-signal-600/8"
    >
      Ask: “{question}”
    </Button>
  );
}
