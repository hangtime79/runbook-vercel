"use client";

import { Bar, BarChart, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { int, pct } from "@/lib/format";

const RED = "#e5484d";
const INK = "#ededed";
const DIM = "rgba(237,237,237,0.6)";

type Band = { label: string; fraud_rate: number; n: number; highlight: boolean; strong: boolean };

/** Fraud rate per dollar band. The micro spike and the $1k+ arm are full colour; the rest recede. */
export function AmountBandChart({ bands, baseline }: { bands: Band[]; baseline: number }) {
  const max = Math.max(...bands.map((b) => b.fraud_rate));
  return (
    <div role="img" aria-label="Fraud rate by purchase amount band. The two to five dollar band spikes; so does one thousand dollars and up.">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={bands} margin={{ top: 22, right: 4, bottom: 8, left: 4 }} barCategoryGap={6}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: "#262626" }}
            interval={0}
            angle={-35}
            textAnchor="end"
            height={54}
            tick={{ fill: DIM, fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
          />
          <YAxis hide domain={[0, max * 1.08]} />
          <Tooltip
            cursor={{ fill: "rgba(237,237,237,0.06)" }}
            contentStyle={{ background: "#0f0f0f", border: "1px solid #2e2e2e", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: INK }}
            itemStyle={{ color: INK }}
            formatter={(v, _name, item) => [`${pct(Number(v))} of ${int((item.payload as Band).n)}`, "fraud rate"]}
          />
          <ReferenceLine y={baseline} stroke={INK} strokeDasharray="3 3" />
          <Bar dataKey="fraud_rate" fill={RED} isAnimationActive={false}>
            {bands.map((b) => (
              <Cell key={b.label} fill={RED} fillOpacity={b.highlight ? 1 : 0.32} />
            ))}
            <LabelList
              dataKey="fraud_rate"
              position="top"
              content={(p) => {
                const { x, y, width, index, value } = p as { x: number; y: number; width: number; index: number; value: number };
                return (
                  <text
                    x={x + width / 2}
                    y={y - 6}
                    textAnchor="middle"
                    fill={INK}
                    fontSize={11}
                    fontWeight={bands[index].strong ? 700 : 400}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {pct(value)}
                  </text>
                );
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
