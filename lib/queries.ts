import { dataPath, query } from "./duckdb";

const gr = () => `read_parquet('${dataPath("golden_record.parquet")}')`;
const features = () => `read_parquet('${dataPath("features.parquet")}')`;

const IS_FRAUD = "(CASE WHEN authorized_flag = 0 THEN 1.0 ELSE 0.0 END)";
const HISTOGRAM_BINS = 60;

export async function headlineCounts() {
  const [row] = await query(
    `SELECT count(*)::DOUBLE AS rows,
            count(authorized_flag)::DOUBLE AS labeled,
            sum(CASE WHEN authorized_flag = 0 THEN 1 ELSE 0 END)::DOUBLE AS fraud
     FROM ${gr()}`
  );
  return row as { rows: number; labeled: number; fraud: number };
}

export async function fraudRateByHour() {
  return (await query(
    `SELECT hour(purchase_date)::INTEGER AS hour, avg(${IS_FRAUD}) AS fraud_rate
     FROM ${gr()} WHERE authorized_flag IS NOT NULL
     GROUP BY 1 ORDER BY 1`
  )) as { hour: number; fraud_rate: number }[];
}

export async function fraudRateBySubsector() {
  return (await query(
    `SELECT subsector_description AS category, avg(${IS_FRAUD}) AS fraud_rate, count(*)::DOUBLE AS n
     FROM ${gr()} WHERE authorized_flag IS NOT NULL AND subsector_description IS NOT NULL
     GROUP BY 1 ORDER BY fraud_rate DESC, category ASC LIMIT 25`
  )) as { category: string; fraud_rate: number; n: number }[];
}

/** 60 equal-width bins over [min, max]; last bin closed on the right (numpy convention). */
export async function amountHistogram() {
  const rows = await query(
    `WITH l AS (
       SELECT purchase_amount AS a, authorized_flag = 0 AS is_fraud
       FROM ${gr()} WHERE authorized_flag IS NOT NULL AND purchase_amount IS NOT NULL
     ), r AS (SELECT min(a) AS lo, max(a) AS hi FROM l)
     SELECT least(floor((a - lo) / ((hi - lo) / ${HISTOGRAM_BINS}))::INTEGER, ${HISTOGRAM_BINS - 1}) AS bin,
            any_value(lo) AS lo, any_value(hi) AS hi,
            sum(CASE WHEN is_fraud THEN 1 ELSE 0 END)::DOUBLE AS fraud,
            sum(CASE WHEN is_fraud THEN 0 ELSE 1 END)::DOUBLE AS legit
     FROM l, r GROUP BY 1 ORDER BY 1`
  );
  const lo = Number(rows[0].lo);
  const hi = Number(rows[0].hi);
  const width = (hi - lo) / HISTOGRAM_BINS;
  const fraud = new Array<number>(HISTOGRAM_BINS).fill(0);
  const legit = new Array<number>(HISTOGRAM_BINS).fill(0);
  for (const r of rows) {
    fraud[Number(r.bin)] = Number(r.fraud);
    legit[Number(r.bin)] = Number(r.legit);
  }
  const bins = fraud.map((f, i) => ({
    start: lo + i * width,
    end: lo + (i + 1) * width,
    fraud: f,
    legit: legit[i],
  }));
  return { min: lo, max: hi, bins, fraud_counts: fraud, legit_counts: legit };
}

/** 7 x 24 grid, rows Monday=0 .. Sunday=6, columns hour 0..23. null where no data. */
export async function heatmap() {
  const rows = await query(
    `SELECT (isodow(purchase_date) - 1)::INTEGER AS dow, hour(purchase_date)::INTEGER AS hour,
            avg(${IS_FRAUD}) AS fraud_rate
     FROM ${gr()} WHERE authorized_flag IS NOT NULL
     GROUP BY 1, 2`
  );
  const grid: (number | null)[][] = Array.from({ length: 7 }, () => new Array(24).fill(null));
  for (const r of rows) grid[Number(r.dow)][Number(r.hour)] = Number(r.fraud_rate);
  return grid;
}

export async function explorerRows() {
  return query(`SELECT * FROM ${features()} LIMIT 500`);
}
