"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const RED = "#c0392b";
const GREY = "#7f8c8d";

export function HourChart({ data }: { data: { hour: number; fraud_rate: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="hour" interval={0} />
        <YAxis tickFormatter={pct} />
        <Tooltip formatter={(v) => pct(Number(v))} labelFormatter={(l) => `Hour ${l}`} />
        <Bar dataKey="fraud_rate" name="Fraud rate" fill={RED} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryChart({
  data,
}: {
  data: { category: string; fraud_rate: number; n: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={420}>
      <BarChart data={data} margin={{ left: 8, right: 8, bottom: 90 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="category" interval={0} angle={-45} textAnchor="end" height={100} tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={pct} />
        <Tooltip formatter={(v, name) => (name === "Fraud rate" ? pct(Number(v)) : v)} />
        <Bar dataKey="fraud_rate" name="Fraud rate" fill={RED} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AmountHistogram({
  data,
}: {
  data: { start: number; end: number; fraud: number; legit: number }[];
}) {
  const rows = data.map((b) => ({ ...b, label: `$${b.start.toFixed(0)}` }));
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={rows} margin={{ left: 8, right: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" interval={5} />
        <YAxis />
        <Tooltip
          labelFormatter={(_, p) => {
            const d = p?.[0]?.payload;
            return d ? `$${d.start.toFixed(2)} to $${d.end.toFixed(2)}` : "";
          }}
        />
        <Legend />
        <Area type="stepAfter" dataKey="legit" name="legit" stroke={GREY} fill={GREY} fillOpacity={0.6} isAnimationActive={false} />
        <Area type="stepAfter" dataKey="fraud" name="fraud" stroke={RED} fill={RED} fillOpacity={0.6} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ShapChart({ data }: { data: { feature: string; mean_abs_shap: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={460}>
      <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" />
        <YAxis type="category" dataKey="feature" width={230} interval={0} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => Number(v).toFixed(4)} />
        <Bar dataKey="mean_abs_shap" name="mean |SHAP|" fill={RED} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
