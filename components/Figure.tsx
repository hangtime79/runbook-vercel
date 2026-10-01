import type { ComponentProps, ReactNode } from "react";
import { Card } from "@/components/ui/card";

/** The README's Card surface: 1px border, 12px radius, #0f0f0f. */
export function Figure({ children, className = "", ...rest }: { children: ReactNode; className?: string } & Omit<ComponentProps<"div">, "children" | "className">) {
  // `rest` carries data-xray (the demo coaching marker) onto the card itself.
  return (
    <Card className={`min-w-0 gap-2.5 rounded-xl border border-border bg-card py-0 ring-0 ${className}`} {...rest}>
      {children}
    </Card>
  );
}

/** Uppercase 11px label row above a chart. */
export function FigureLabel({ children }: { children: ReactNode }) {
  return <div className="flex justify-between gap-3 text-[11px] uppercase tracking-[0.1em] text-foreground/60">{children}</div>;
}

/** Horizontal rate bars with a dashed baseline marker. Used by Story chapters and the category chart. */
export function RateBars({ rows, axisMax, baseline, rowClass = "text-[13px]", labelWidth = 132, barHeight = 16 }: {
  rows: { label: string; value: number; highlight: boolean; mono?: boolean; suffix?: string }[];
  axisMax: number;
  baseline: number;
  rowClass?: string;
  labelWidth?: number;
  barHeight?: number;
}) {
  return (
    <div className="flex flex-col gap-[5px]">
      {rows.map((b) => (
        <div
          key={b.label}
          className={`grid items-center gap-2.5 ${rowClass}`}
          style={{ gridTemplateColumns: `minmax(0,${labelWidth}px) 1fr 56px` }}
        >
          <span className={`truncate ${b.mono ? "font-mono text-[11px]" : ""}`} title={b.label}>
            {b.label}
          </span>
          <div className="relative bg-foreground/5" style={{ height: barHeight }}>
            <div
              className="absolute inset-y-0 left-0 bg-signal-600"
              style={{ width: `${Math.min(100, (b.value / axisMax) * 100)}%`, opacity: b.highlight ? 1 : 0.32 }}
            />
            <div
              className="absolute -inset-y-[3px] border-l border-dashed border-foreground"
              style={{ left: `${(baseline / axisMax) * 100}%` }}
              aria-hidden
            />
          </div>
          <span className={`tnum text-right ${b.highlight ? "font-semibold" : ""}`}>{(b.value * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}
