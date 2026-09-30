"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { UIMessage } from "ai";
import { PanelRightClose } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AnswerMeta } from "@/lib/askConfig";
import { ASK } from "@/lib/copy";
import { useAsk } from "./AskProvider";
import { Evidence, type QueryOutput } from "./Evidence";

type ToolPart = {
  type: string;
  state: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

const asToolParts = (m: UIMessage, name: string) =>
  m.parts.filter((p) => p.type === `tool-${name}`) as unknown as ToolPart[];
const textOf = (m: UIMessage) => m.parts.map((p) => (p.type === "text" ? p.text : "")).join("").trim();

/** 0 writing SQL, 1 running it, 2 summarising. Read off the tool part states of the live answer. */
function stepOf(answer: UIMessage | undefined): number {
  if (!answer) return 0;
  const queries = asToolParts(answer, "query");
  if (textOf(answer) || asToolParts(answer, "headline").length) return 2;
  if (queries.some((q) => q.state === "output-available" || q.state === "output-error")) return 2;
  if (queries.some((q) => q.state === "input-available")) return 1;
  return 0;
}

function Steps({ step }: { step: number }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-1.5 p-0 pl-7" aria-label="Progress">
      {ASK.steps.map((label, j) => (
        <li
          key={label}
          className="flex items-center gap-2 text-[13px]"
          style={{ opacity: step >= j ? 1 : 0.6 }}
          aria-current={step === j ? "step" : undefined}
        >
          <span className="w-3.5 font-mono text-[11px]" aria-hidden>
            {step > j ? "✓" : step === j ? "…" : "·"}
          </span>
          {label}
        </li>
      ))}
    </ol>
  );
}

function QueryCards({ answer, done }: { answer: UIMessage; done: boolean }) {
  const queries = asToolParts(answer, "query");
  const meta = (answer.metadata as { answer?: AnswerMeta } | undefined)?.answer;
  return (
    <>
      {queries.map((p, i) => (
        <Evidence
          key={i}
          answerMeta={done && i === queries.length - 1 ? meta : undefined}
          sql={(p.input as { sql?: string } | undefined)?.sql}
          output={p.output as QueryOutput | undefined}
          errorText={p.state === "output-error" ? p.errorText : undefined}
          pending={p.state === "input-streaming" || p.state === "input-available"}
        />
      ))}
    </>
  );
}

function Turn({ n, question, answer, live, streamError }: {
  n: number;
  question: string;
  answer: UIMessage | undefined;
  live: boolean;
  streamError: Error | undefined;
}) {
  const headline = answer
    ? (asToolParts(answer, "headline").find((p) => p.input && typeof p.input === "object")?.input as
        | { value?: string; label?: string }
        | undefined)
    : undefined;
  const text = answer ? textOf(answer) : "";
  const done = !live;

  return (
    <div className="flex flex-col gap-2.5" data-turn>
      <div className="flex items-baseline gap-2.5">
        <span className="shrink-0 font-mono text-[11px] text-signal-700">Q{n}</span>
        <h3 className="text-[19px] font-semibold leading-tight">{question}</h3>
      </div>
      {live && <Steps step={stepOf(answer)} />}
      <div className="flex flex-col gap-3 pl-7">
        {done && headline?.value && (
          <div className="flex items-baseline gap-2.5">
            <span className="text-[38px] font-semibold leading-none text-signal-800">{headline.value}</span>
            {headline.label && <span className="text-[13px] text-foreground/65">{headline.label}</span>}
          </div>
        )}
        {done && text && (
          <div className="text-[14px] leading-[1.55] text-pretty [&_li]:my-0.5 [&_p]:my-0 [&_p+p]:mt-2 [&_strong]:font-semibold [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5">
            {/* The model bolds figures with **; allow only inline emphasis and lists, no raw HTML. */}
            <ReactMarkdown allowedElements={["p", "strong", "em", "code", "ul", "ol", "li", "br"]} unwrapDisallowed>
              {text}
            </ReactMarkdown>
          </div>
        )}
        {done && !text && !streamError && (
          <p className="text-[13px] text-foreground/65">No answer came back. Try asking again.</p>
        )}
        {answer && <QueryCards answer={answer} done={done} />}
        {done && streamError && (
          <p className="text-[13px] text-signal-700" role="alert">
            Something went wrong answering that: {streamError.message}. Try again in a moment.
          </p>
        )}
      </div>
    </div>
  );
}

/** The conversation, empty state and composer. Rendered in the side panel and on /ask. */
export function AskView({ variant }: { variant: "panel" | "page" }) {
  const { messages, busy, error, ask, modelChoice, panelOpen, setPanelOpen } = useAsk();
  const [input, setInput] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const turnCount = messages.filter((m) => m.role === "user").length;

  // A new question, and its finished answer, scroll the newest turn to the top of the panel.
  useEffect(() => {
    const turns = scroller.current?.querySelectorAll("[data-turn]");
    turns?.[turns.length - 1]?.scrollIntoView({ block: "start" });
  }, [turnCount, busy]);

  // Pair each question with the answer that follows it.
  const turns: { id: string; question: string; answer?: UIMessage }[] = [];
  for (const m of messages) {
    if (m.role === "user") turns.push({ id: m.id, question: textOf(m) });
    else if (turns.length) turns[turns.length - 1].answer = m;
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || busy) return;
    ask(input);
    setInput("");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 pb-3 pt-4">
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold leading-[1.1]">{ASK.title}</h2>
          <span className="text-[12px] text-foreground/60">{ASK.tagline}</span>
          {modelChoice && (
            <label className="mt-1.5 flex items-center gap-2 text-[11px] text-foreground/60">
              Model
              <select
                value={modelChoice.selected}
                onChange={(e) => modelChoice.select(e.currentTarget.value)}
                disabled={busy}
                aria-label="Model"
                className="min-w-0 rounded-md border border-border-strong bg-background px-2 py-1 font-mono text-[11px] text-foreground"
              >
                {modelChoice.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {variant === "panel" && panelOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPanelOpen(false)}
            aria-label="Collapse the Ask the data panel"
            className="text-muted-foreground"
          >
            <PanelRightClose strokeWidth={1.5} />
          </Button>
        )}
      </div>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-5 py-[18px]" aria-live="polite">
        <div className="mx-auto flex max-w-[760px] flex-col gap-[22px]">
          {turns.length === 0 && (
            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] uppercase tracking-[0.1em] text-foreground/60">Try one</span>
              {ASK.examples.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => ask(q)}
                  disabled={busy}
                  className="rounded-none border border-border px-3 py-2.5 text-left text-[14px] leading-[1.35] transition-colors hover:border-signal-600 hover:bg-signal-600/[0.06] disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          {turns.map((t, i) => (
            <Turn
              key={t.id}
              n={i + 1}
              question={t.question}
              answer={t.answer}
              live={busy && i === turns.length - 1}
              streamError={!busy && i === turns.length - 1 ? error : undefined}
            />
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-2 border-t border-border px-5 pb-4 pt-3">
        <div className="mx-auto flex w-full max-w-[760px] gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder={ASK.placeholder}
            maxLength={1000}
            aria-label="Question"
            className="h-[38px] min-w-0 flex-1 rounded-md border-border-strong bg-background px-3 text-[14px]"
          />
          <Button
            type="submit"
            disabled={busy || !input.trim()}
            className="h-[38px] rounded-md bg-foreground px-4 text-[13px] font-semibold text-background hover:bg-foreground/90"
          >
            Ask
          </Button>
        </div>
        <span className="mx-auto w-full max-w-[760px] text-[11px] text-foreground/60">{ASK.helper}</span>
      </form>
    </div>
  );
}
