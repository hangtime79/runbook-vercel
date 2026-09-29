"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";

const EXAMPLES = [
  "Which merchant categories have the highest fraud rate?",
  "Is fraud more common at night than during the day?",
  "How does fraud differ between transactions with and without a signature?",
];

const PREVIEW_ROWS = 10;

type QueryOutput =
  | { sql: string; columns: string[]; rows: unknown[][]; rowCount: number; truncated: boolean }
  | { sql: string; error: string };

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return Number.isInteger(v) ? v.toLocaleString("en-US") : String(Number(v.toPrecision(6)));
  return String(v);
}

function QueryBlock({ sql, output, errorText, pending }: {
  sql?: string;
  output?: QueryOutput;
  errorText?: string;
  pending: boolean;
}) {
  const shownSql = output?.sql ?? sql ?? "";
  const failed = errorText ?? (output && "error" in output ? output.error : undefined);
  const ok = output && !("error" in output) ? output : undefined;
  const summary = pending
    ? "Running query…"
    : failed
      ? "Query failed"
      : `Query: ${ok!.rowCount} row${ok!.rowCount === 1 ? "" : "s"}${ok!.truncated ? " (capped)" : ""}`;
  return (
    <details className="card" style={{ margin: "8px 0" }} open>
      <summary style={{ cursor: "pointer" }}>{summary}</summary>
      <pre style={{ overflowX: "auto", margin: "8px 0", fontSize: "0.85rem" }}>
        <code>{shownSql}</code>
      </pre>
      {failed && <p style={{ color: "var(--accent)", margin: 0 }}>{failed}</p>}
      {ok && ok.rows.length > 0 && (
        <div className="scroll" style={{ maxHeight: 260 }}>
          <table className="table">
            <thead>
              <tr>{ok.columns.map((c) => <th key={c}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {ok.rows.slice(0, PREVIEW_ROWS).map((r, i) => (
                <tr key={i}>
                  {r.map((v, j) => <td key={j} className={typeof v === "number" ? "num" : undefined}>{fmt(v)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {ok && ok.rowCount > PREVIEW_ROWS && (
        <p className="muted" style={{ margin: "6px 0 0", fontSize: "0.85rem" }}>
          Showing the first {PREVIEW_ROWS} of {ok.rowCount} rows{ok.truncated ? " (result capped at 200)" : ""}.
        </p>
      )}
    </details>
  );
}

export default function AskData() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat();
  const busy = status === "submitted" || status === "streaming";

  const ask = (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    sendMessage({ text: q });
    setInput("");
  };

  return (
    <div className="card">
      <strong>Ask the data</strong>
      <p className="muted" style={{ margin: "4px 0 12px" }}>
        Ask a question in plain language. The app writes a read-only SQL query, runs it on the fraud
        data and shows you the SQL it ran.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        style={{ display: "flex", gap: 8 }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          placeholder="e.g. Which hours of the day have the most fraud?"
          maxLength={1000}
          aria-label="Question"
          style={{ flex: 1, padding: "8px 10px", font: "inherit", color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 6 }}
        />
        <button type="submit" disabled={busy || !input.trim()} style={{ padding: "8px 14px", font: "inherit" }}>
          {busy ? "Thinking…" : "Ask"}
        </button>
      </form>
      {messages.length === 0 && (
        <p className="muted" style={{ margin: "10px 0 0", fontSize: "0.9rem" }}>
          Try:{" "}
          {EXAMPLES.map((q, i) => (
            <span key={q}>
              {i > 0 && " · "}
              <a href="#" onClick={(e) => { e.preventDefault(); ask(q); }}>{q}</a>
            </span>
          ))}
        </p>
      )}
      <div style={{ marginTop: messages.length ? 16 : 0 }}>
        {messages.map((m) => (
          <div key={m.id} style={{ margin: "12px 0" }}>
            {m.role === "user" ? (
              <strong>{m.parts.map((p) => (p.type === "text" ? p.text : "")).join("")}</strong>
            ) : (
              m.parts.map((p, i) => {
                if (p.type === "text") {
                  return <div key={i} style={{ whiteSpace: "pre-wrap" }}>{p.text}</div>;
                }
                if (p.type === "tool-query") {
                  return (
                    <QueryBlock
                      key={i}
                      sql={(p.input as { sql?: string } | undefined)?.sql}
                      output={p.output as QueryOutput | undefined}
                      errorText={p.state === "output-error" ? p.errorText : undefined}
                      pending={p.state === "input-streaming" || p.state === "input-available"}
                    />
                  );
                }
                return null;
              })
            )}
          </div>
        ))}
        {status === "ready" && !error && messages.at(-1)?.role === "assistant" &&
          !messages.at(-1)!.parts.some((p) => p.type === "text" && p.text.trim()) && (
          <p className="muted">No answer came back. Try asking again.</p>
        )}
        {error && (
          <p style={{ color: "var(--accent)" }}>
            Something went wrong answering that: {error.message}. Try again in a moment.
          </p>
        )}
      </div>
    </div>
  );
}
