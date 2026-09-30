"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { pct } from "@/lib/format";

const RED = "#e5484d";
const INK = "#ededed";
const DIM = "rgba(237,237,237,0.6)";

/** Fraud rate by hour. Overnight hours are full colour, the rest recede; dashed line is the baseline. */
export function HourChart({ data, baseline, windowStart, windowEnd, windowLabel }: {
  data: { hour: number; fraud_rate: number }[];
  baseline: number;
  windowStart: number;
  windowEnd: number;
  /** Annotation text over the window, e.g. "OVERNIGHT WINDOW · 15.6% combined, hours 2–6". */
  windowLabel: string;
}) {
  const top = Math.ceil(Math.max(...data.map((d) => d.fraud_rate)) * 20) / 20; // next 5% step
  const ticks = Array.from({ length: Math.round(top / 0.05) + 1 }, (_, i) => i * 0.05);
  return (
    <div role="img" aria-label={`Fraud rate by hour of day. Hours ${windowStart} to ${windowEnd} run highest.`}>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 24, right: 8, bottom: 0, left: 0 }} barCategoryGap={3}>
          <CartesianGrid vertical={false} stroke="#262626" />
          <XAxis
            dataKey="hour"
            tickLine={false}
            axisLine={{ stroke: "#262626" }}
            tick={{ fill: DIM, fontSize: 11, fontFamily: "var(--font-geist-mono)" }}
            interval={0}
          />
          <YAxis
            domain={[0, top]}
            ticks={ticks}
            tickFormatter={(v: number) => (v === 0 ? "0" : `${Math.round(v * 100)}%`)}
            tickLine={false}
            axisLine={false}
            width={40}
            tick={{ fill: DIM, fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: "rgba(237,237,237,0.06)" }}
            contentStyle={{ background: "#0f0f0f", border: "1px solid #2e2e2e", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: INK }}
            itemStyle={{ color: INK }}
            labelFormatter={(h) => `${h}:00`}
            formatter={(v) => [pct(Number(v)), "fraud rate"]}
          />
          <ReferenceArea
            x1={windowStart}
            x2={windowEnd}
            fill={RED}
            fillOpacity={0.09}
            ifOverflow="visible"
            label={{ value: windowLabel, position: "top", fill: "#ff8a8d", fontSize: 11, letterSpacing: "0.08em" }}
          />
          <ReferenceLine
            y={baseline}
            stroke={INK}
            strokeDasharray="3 3"
            label={{ value: `baseline ${pct(baseline, 2)}`, position: "insideTopRight", fill: INK, fontSize: 11 }}
          />
          <Bar dataKey="fraud_rate" fill={RED} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.hour} fill={RED} fillOpacity={d.hour >= windowStart && d.hour <= windowEnd ? 1 : 0.32} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
