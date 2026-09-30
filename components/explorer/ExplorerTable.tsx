"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EXPLORER } from "@/lib/copy";
import { usd } from "@/lib/format";
import type { ExplorerRow } from "@/lib/source";

type FilterKey = "all" | "flagged" | "fraud" | "micro" | "hot";

// Below these wrapper widths (container queries, not viewport, so the open Ask panel counts) the
// lowest-value columns drop out, Subsector first and then Hour. Outcome, Transaction, Amount,
// Flags and Model score never hide.
const SHOW_HOUR = "hidden @[720px]:table-cell";
const SHOW_SUBSECTOR = "hidden @[900px]:table-cell";

const COLUMNS: { label: string; align: "left" | "right" | "center"; show?: string }[] = [
  { label: "Outcome", align: "left" },
  { label: "Transaction", align: "left" },
  { label: "Amount", align: "right" },
  { label: "Subsector", align: "left", show: SHOW_SUBSECTOR },
  { label: "Hour", align: "right", show: SHOW_HOUR },
  { label: "Signed", align: "center" },
  { label: "Merchant rate", align: "left" },
  { label: "Flags", align: "left" },
  { label: "Model score", align: "left" },
];

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" } as const;

export function ExplorerTable({ rows, threshold, hotMerchantRate }: {
  rows: ExplorerRow[];
  threshold: number;
  /** A merchant whose training-slice fraud rate is above this gets the HOT MERCHANT flag (3x baseline). */
  hotMerchantRate: number;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");

  const tests: Record<FilterKey, (r: ExplorerRow) => boolean> = useMemo(
    () => ({
      all: () => true,
      flagged: (r) => r.score >= threshold,
      fraud: (r) => r.authorized_flag === 0,
      micro: (r) => r.is_micro_transaction === 1,
      hot: (r) => r.merchant_fraud_rate > hotMerchantRate,
    }),
    [threshold, hotMerchantRate]
  );
  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "flagged", label: "Above threshold" },
    { key: "fraud", label: "Confirmed fraud" },
    { key: "micro", label: "Micro < $5" },
    { key: "hot", label: "Hot merchant" },
  ];

  const maxMerchantRate = useMemo(() => Math.max(...rows.map((r) => r.merchant_fraud_rate)), [rows]);
  const q = query.trim().toLowerCase();
  const shown = useMemo(
    () =>
      rows
        .filter(tests[filter])
        .filter((r) => !q || String(r.transaction_id).includes(q) || r.subsector_description?.toLowerCase().includes(q))
        .sort((a, b) => b.score - a.score),
    [rows, tests, filter, q]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <PageHeader kicker={EXPLORER.kicker} title={EXPLORER.title} />
        <div className="relative w-full max-w-[280px]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/50"
            strokeWidth={1.5}
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            placeholder="Search transaction or category"
            aria-label="Search transaction or category"
            className="h-[38px] rounded-md border-border-strong bg-background pl-9 text-[14px]"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter rows">
        {filters.map((f) => {
          const on = filter === f.key;
          return (
            <Button
              key={f.key}
              variant="outline"
              aria-pressed={on}
              onClick={() => setFilter(f.key)}
              className={`h-auto gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-normal ${
                on
                  ? "border-signal-600 bg-signal-600 text-background hover:bg-signal-600 hover:text-background"
                  : "border-border bg-transparent text-foreground hover:bg-signal-600/[0.08]"
              }`}
            >
              {f.label}
              <span className="font-mono text-[11px] opacity-75">{rows.filter(tests[f.key]).length}</span>
            </Button>
          );
        })}
        <span className="text-[12px] text-foreground/60 sm:ml-auto">
          {EXPLORER.note} · threshold {threshold} marked
        </span>
      </div>

      <div className="@container">
      <div className="max-h-[calc(100dvh-270px)] min-h-[320px] overflow-auto rounded-lg border border-border">
        <Table className="text-[13px]">
          <TableHeader>
            <TableRow className="border-0 hover:bg-transparent">
              {COLUMNS.map((c) => (
                <TableHead
                  key={c.label}
                  className={`sticky top-0 z-[1] h-auto whitespace-nowrap border-b border-border bg-background px-2.5 py-2.5 text-[10px] font-medium uppercase tracking-[0.1em] text-foreground/60 ${ALIGN[c.align]} ${c.show ?? ""}`}
                >
                  {c.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((r) => {
              const fraud = r.authorized_flag === 0;
              const hit = r.score >= threshold;
              const flags = [
                r.is_micro_transaction === 1 && "MICRO",
                r.velocity_above_1_per_hour === 1 && "VELOCITY",
                r.merchant_fraud_rate > hotMerchantRate && "HOT MERCHANT",
              ].filter(Boolean) as string[];
              return (
                <TableRow
                  key={r.transaction_id}
                  className={`border-b border-foreground/[0.07] hover:bg-signal-600/[0.07] ${hit ? "bg-signal-600/5" : ""}`}
                >
                  <TableCell className="whitespace-nowrap px-2.5 py-2">
                    <span className={`inline-flex items-center gap-1.5 text-[12px] ${fraud ? "font-semibold" : ""}`}>
                      <span className="size-2" style={{ background: fraud ? "#ff6b6f" : "#2e2e2e" }} aria-hidden />
                      {fraud ? "Fraud" : "Legit"}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-2.5 py-2 font-mono text-[12px]">{r.transaction_id}</TableCell>
                  <TableCell className="tnum whitespace-nowrap px-2.5 py-2 text-right">{usd(r.purchase_amount)}</TableCell>
                  <TableCell className={`max-w-[130px] truncate px-2.5 py-2 ${SHOW_SUBSECTOR}`} title={r.subsector_description}>{r.subsector_description}</TableCell>
                  <TableCell className={`tnum px-2.5 py-2 text-right ${SHOW_HOUR}`}>{String(r.hour).padStart(2, "0")}:00</TableCell>
                  <TableCell className="px-2.5 py-2 text-center">
                    {r.signature_provided ? <span aria-label="signed">✓</span> : <span aria-label="not signed">—</span>}
                  </TableCell>
                  <TableCell className="px-2.5 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-[52px] bg-foreground/[0.07]">
                        <div
                          className="h-full bg-signal-500"
                          style={{ width: `${Math.min(100, (r.merchant_fraud_rate / maxMerchantRate) * 100)}%` }}
                        />
                      </div>
                      <span className="tnum w-[38px] text-right text-[12px]">{r.merchant_fraud_rate.toFixed(3)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-2.5 py-2">
                    <div className="flex gap-1">
                      {flags.map((f) => (
                        <Badge
                          key={f}
                          className="h-auto whitespace-nowrap rounded-full bg-signal-100 px-1.5 py-px text-[10px] font-medium text-signal-pill"
                        >
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="px-2.5 py-2">
                    <div className="flex items-center gap-2">
                      <div className="relative h-2.5 w-[72px] bg-foreground/[0.07]">
                        <div
                          className="h-full"
                          style={{ width: `${r.score * 100}%`, background: hit ? "#e5484d" : "#454545" }}
                        />
                        <div
                          className="absolute -inset-y-0.5 border-l border-foreground"
                          style={{ left: `${threshold * 100}%` }}
                          aria-hidden
                        />
                      </div>
                      <span className={`tnum font-mono text-[12px] ${fraud ? "font-semibold" : ""}`}>{r.score.toFixed(3)}</span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {shown.length === 0 && <p className="m-0 p-6 text-foreground/60">{EXPLORER.empty}</p>}
      </div>
      </div>
    </div>
  );
}
