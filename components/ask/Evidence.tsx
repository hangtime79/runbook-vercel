"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { AnswerMeta } from "@/lib/askConfig";
import type { OutputVerdict, ScopeVerdict } from "@/lib/guardrails";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type QueryOutput =
  | { sql: string; columns: string[]; rows: unknown[][]; rowCount: number; truncated: boolean; ms?: number }
  | { sql: string; error: string };

const PREVIEW_ROWS = 10;

const KEYWORDS = new Set(
  ("SELECT FROM WHERE GROUP BY ORDER LIMIT HAVING AS CASE WHEN THEN ELSE END AND OR IS NOT NULL BETWEEN " +
    "DESC ASC WITH JOIN ON USING IN DISTINCT UNION ALL LIKE OVER PARTITION").split(" ")
);

/** Split SQL into keyword / number / string / other runs for highlighting. No HTML is built. */
function tokenize(sql: string): { t: string; kind: "kw" | "num" | "str" | "txt" }[] {
  return sql
    .split(/([A-Za-z_][A-Za-z_0-9]*|\d+(?:\.\d+)?|'[^']*')/)
    .filter(Boolean)
    .map((t) => {
      if (KEYWORDS.has(t.toUpperCase()) && /^[A-Za-z]+$/.test(t) && t === t.toUpperCase()) return { t, kind: "kw" as const };
      if (/^\d/.test(t)) return { t, kind: "num" as const };
      if (t.startsWith("'")) return { t, kind: "str" as const };
      return { t, kind: "txt" as const };
    });
}

/** Columns whose name says they hold a 0–1 fraction (fraud_rate, share, ratio) render as percent. */
const FRACTION_COL = /(^|_)(rate|share|ratio|proportion)(_|$)/i;
const PERCENT_COL = /(^|_)(pct|percent)(_|$)/i;

function fmt(v: unknown, column = ""): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") {
    if (PERCENT_COL.test(column)) return `${v.toFixed(2)}%`;
    if (FRACTION_COL.test(column) && v >= 0 && v <= 1) return `${(v * 100).toFixed(2)}%`;
    return Number.isInteger(v) ? v.toLocaleString("en-US") : String(Number(v.toPrecision(6)));
  }
  return String(v);
}

/** Column to size the trailing bar by: fraud_rate_pct, else the last column that is numeric in every row. */
function barColumn(columns: string[], rows: unknown[][]): number {
  const named = columns.indexOf("fraud_rate_pct");
  if (named >= 0) return named;
  for (let c = columns.length - 1; c >= 0; c--) {
    if (rows.length > 0 && rows.every((r) => typeof r[c] === "number")) return c;
  }
  return -1;
}

/**
 * The evidence for one query: always the SQL it ran (SPEC invariant 4), then the result rows,
 * or the error / refusal. The SQL stays visible in every state; "Hide SQL" is a view toggle only.
 */
/** The scope check and output check verdicts as one mono line each (same style as the answer meta line). */
function GuardLines({ scope, output }: { scope?: ScopeVerdict; output?: OutputVerdict }) {
  const p = (v: number | null) => (v === null ? "n/a" : v.toFixed(2));
  return (
    <>
      {scope?.allowed && (
        <p className="m-0 border-t border-border px-3 py-1.5 font-mono text-[11px] text-foreground/65" data-testid="scope-line">
          scope check passed · {scope.model} · p={p(scope.probability)} · {scope.ms} ms
        </p>
      )}
      {output && !output.allowed && (
        <p className="m-0 border-t border-border px-3 py-1.5 font-mono text-[11px] text-signal-700" data-testid="output-line">
          answer withheld by the output check · {output.category} · p={p(output.probability)} · {output.model} · {output.ms} ms
        </p>
      )}
    </>
  );
}

/** Shown in place of the evidence when the question never reached the answering model. */
export function ScopeCard({ scope }: { scope: ScopeVerdict }) {
  const unavailable = scope.category === "unavailable";
  return (
    <Card className="gap-0 rounded-xl border border-border bg-background py-0 ring-0" aria-label="Scope check" data-testid="scope-card">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <span className="text-[10px] font-medium uppercase tracking-kicker text-signal-700">Scope check</span>
        <span className="font-mono text-[11px] text-foreground/65">
          {unavailable
            ? `unavailable · fails closed · ${scope.model} · ${scope.ms} ms`
            : `out of scope · ${scope.category} · p=${scope.probability?.toFixed(2) ?? "n/a"} · ${scope.model} · ${scope.ms} ms`}
        </span>
      </div>
    </Card>
  );
}

export function Evidence({ sql, output, errorText, pending, answerMeta, guard }: {
  /** Scope and output verdicts for this answer, shown as footer lines. */
  guard?: { scope?: ScopeVerdict; output?: OutputVerdict };
  sql?: string;
  output?: QueryOutput;
  errorText?: string;
  pending: boolean;
  /** Who answered, how long it took and what it cost; shown once the answer has finished. */
  answerMeta?: AnswerMeta;
}) {
  const [showSql, setShowSql] = useState(true);
  const shownSql = output?.sql ?? sql ?? "";
  const failed = errorText ?? (output && "error" in output ? output.error : undefined);
  const ok = output && !("error" in output) ? output : undefined;

  const meta = pending
    ? "SELECT only · running…"
    : failed
      ? "SELECT only · failed"
      : `SELECT only · ${ok!.rowCount}${ok!.truncated ? "+" : ""} row${ok!.rowCount === 1 ? "" : "s"}${
          ok!.ms !== undefined ? ` · ${ok!.ms} ms` : ""
        }`;

  const barCol = ok ? barColumn(ok.columns, ok.rows) : -1;
  const barMax = ok && barCol >= 0 ? Math.max(...ok.rows.map((r) => Number(r[barCol]) || 0), 0) : 0;
  const shown = ok ? ok.rows.slice(0, PREVIEW_ROWS) : [];

  return (
    <Card className="gap-0 rounded-xl border border-border bg-background py-0 ring-0" aria-label="Evidence">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <span className="text-[10px] font-medium uppercase tracking-kicker text-signal-700">Evidence</span>
        <span className="whitespace-nowrap font-mono text-[11px] text-foreground/65">{meta}</span>
      </div>
      {showSql && (
        <pre className="m-0 whitespace-pre-wrap break-words border-b border-border px-3 py-2.5 font-mono text-[11.5px] leading-[1.6]">
          <code>
            {tokenize(shownSql).map((tk, i) =>
              tk.kind === "kw" ? (
                <span key={i} className="font-semibold text-[#8f8f8f]">{tk.t}</span>
              ) : tk.kind === "num" ? (
                <span key={i} className="text-signal-800">{tk.t}</span>
              ) : tk.kind === "str" ? (
                <span key={i} className="text-[#8f8f8f]">{tk.t}</span>
              ) : (
                <span key={i}>{tk.t}</span>
              )
            )}
          </code>
        </pre>
      )}
      {failed && <p className="m-0 px-3 py-2 text-[12px] text-signal-700">{failed}</p>}
      {ok && shown.length > 0 && (
        <div className="overflow-x-auto">
          <Table className="text-[12px]">
            <TableHeader>
              <TableRow className="border-0 hover:bg-transparent">
                {ok.columns.map((c) => (
                  <TableHead
                    key={c}
                    className="h-auto px-2.5 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-foreground/60"
                  >
                    {c}
                  </TableHead>
                ))}
                {barCol >= 0 && <TableHead className="h-auto w-[30%] px-3 py-1.5" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((r, i) => (
                <TableRow key={i} className="border-t border-foreground/[0.07] hover:bg-transparent">
                  {r.map((v, j) => (
                    <TableCell key={j} className="tnum whitespace-nowrap px-2.5 py-1.5">{fmt(v, ok.columns[j])}</TableCell>
                  ))}
                  {barCol >= 0 && (
                    <TableCell className="px-2.5 py-1.5">
                      <div
                        className="h-1.5 bg-signal-600"
                        style={{ width: `${barMax > 0 ? (Math.max(Number(r[barCol]) || 0, 0) / barMax) * 100 : 0}%` }}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {ok && ok.rowCount > PREVIEW_ROWS && (
        <p className="m-0 px-3 pb-2 text-[11px] text-foreground/60">
          Showing the first {PREVIEW_ROWS} of {ok.rowCount} rows{ok.truncated ? " (result capped at 200)" : ""}.
        </p>
      )}
      {answerMeta && (
        <p
          className="m-0 border-t border-border px-3 py-1.5 font-mono text-[11px] text-foreground/65"
          data-testid="answer-meta"
        >
          {answerMeta.model} · {(answerMeta.ms / 1000).toFixed(1)} s · {answerMeta.inputTokens.toLocaleString("en-US")} in /{" "}
          {answerMeta.outputTokens.toLocaleString("en-US")} out ·{" "}
          {answerMeta.costUsd === null || answerMeta.costSource === null
            ? "cost n/a"
            : `$${answerMeta.costUsd.toFixed(answerMeta.costUsd < 0.01 ? 5 : 4)} (${answerMeta.costSource})`}
        </p>
      )}
      {guard && <GuardLines scope={guard.scope} output={guard.output} />}
      <div className="flex flex-wrap justify-between gap-2 border-t border-border px-3 py-1.5 text-[11px] text-foreground/60">
        <span>fraud.duckdb · opened read-only</span>
        <button
          type="button"
          onClick={() => setShowSql((s) => !s)}
          aria-expanded={showSql}
          className="rounded-sm text-signal-700 hover:text-signal-900"
        >
          {showSql ? "Hide SQL" : "Show SQL"}
        </button>
      </div>
    </Card>
  );
}
