import { dataPath, query } from "./duckdb.ts";

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

/** Combined fraud rate for hours start..end inclusive (the /patterns overnight window). */
export async function overnightWindow(start: number, end: number) {
  const [r] = await query(
    `SELECT count(*)::DOUBLE AS n, sum(CASE WHEN authorized_flag = 0 THEN 1 ELSE 0 END)::DOUBLE AS fraud
     FROM ${gr()} WHERE authorized_flag IS NOT NULL AND hour(purchase_date) BETWEEN ${Math.trunc(start)} AND ${Math.trunc(end)}`
  );
  const n = Number(r.n);
  const fraud = Number(r.fraud);
  return { start, end, n, fraud, fraud_rate: fraud / n };
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

export type ExplorerRow = {
  transaction_id: number;
  authorized_flag: number;
  purchase_amount: number;
  subsector_description: string;
  hour: number;
  signature_provided: number;
  merchant_fraud_rate: number;
  is_micro_transaction: number;
  velocity_above_1_per_hour: number;
  score: number;
};

/** 500 scored holdout rows from data/explorer_rows.parquet, highest model score first. */
export async function explorerRows() {
  return (await query(
    `SELECT * FROM read_parquet('${dataPath("explorer_rows.parquet")}') ORDER BY score DESC, transaction_id ASC`
  )) as unknown as ExplorerRow[];
}

/** Dollar bands from findings.md Finding 2. [lo, hi): hi = null means no upper bound. */
export const AMOUNT_BANDS = [
  { label: "$2–$5", lo: 2, hi: 5 },
  { label: "$5–$10", lo: 5, hi: 10 },
  { label: "$10–$20", lo: 10, hi: 20 },
  { label: "$20–$50", lo: 20, hi: 50 },
  { label: "$50–$100", lo: 50, hi: 100 },
  { label: "$100–$250", lo: 100, hi: 250 },
  { label: "$250–$500", lo: 250, hi: 500 },
  { label: "$500–$1k", lo: 500, hi: 1000 },
  { label: "$1k+", lo: 1000, hi: null },
] as const;

export type Bucket = { label: string; n: number; fraud: number; fraud_rate: number };

/** Fraud rate per dollar band (labeled rows from $2 up; the four rows under $2 are not charted). */
export async function amountBands(): Promise<Bucket[]> {
  const cases = AMOUNT_BANDS.map((b, i) =>
    b.hi === null ? `WHEN a >= ${b.lo} THEN ${i}` : `WHEN a >= ${b.lo} AND a < ${b.hi} THEN ${i}`
  ).join(" ");
  const rows = await query(
    `SELECT CASE ${cases} END AS band, count(*)::DOUBLE AS n,
            sum(CASE WHEN authorized_flag = 0 THEN 1 ELSE 0 END)::DOUBLE AS fraud
     FROM (SELECT purchase_amount AS a, authorized_flag FROM ${gr()}
           WHERE authorized_flag IS NOT NULL AND purchase_amount >= ${AMOUNT_BANDS[0].lo})
     GROUP BY 1 ORDER BY 1`
  );
  return rows.map((r) => ({
    label: AMOUNT_BANDS[Number(r.band)].label,
    n: Number(r.n),
    fraud: Number(r.fraud),
    fraud_rate: Number(r.fraud) / Number(r.n),
  }));
}

type KeyedBucket = { key: number; n: number; fraud: number; fraud_rate: number };

async function groupedRate(sql: string): Promise<KeyedBucket[]> {
  return (await query(sql)).map((r) => ({
    key: Number(r.k),
    n: Number(r.n),
    fraud: Number(r.fraud),
    fraud_rate: Number(r.fraud) / Number(r.n),
  }));
}

/** The aggregates behind the seven Story chapters and the Findings triggers. */
export async function storyFigures() {
  const merchantRows = await query(
    `SELECT merchant_id, count(*)::DOUBLE AS n, sum(CASE WHEN authorized_flag = 0 THEN 1 ELSE 0 END)::DOUBLE AS fraud
     FROM ${gr()} WHERE authorized_flag IS NOT NULL
     GROUP BY 1 HAVING count(*) >= 50
     ORDER BY avg(${IS_FRAUD}) DESC, merchant_id ASC LIMIT 10`
  );
  const merchants = merchantRows.map((r) => ({
    merchant_id: String(r.merchant_id),
    n: Number(r.n),
    fraud: Number(r.fraud),
    fraud_rate: Number(r.fraud) / Number(r.n),
  }));

  const fraudSum = `sum(CASE WHEN authorized_flag = 0 THEN 1 ELSE 0 END)::DOUBLE AS fraud`;
  const [velocity, age, signature, travel] = await Promise.all([
    groupedRate(`SELECT least(velocity_1h_count, 4)::INTEGER AS k, count(*)::DOUBLE AS n, ${fraudSum} FROM ${features()} GROUP BY 1 ORDER BY 1`),
    groupedRate(`SELECT age_bucket::INTEGER AS k, count(*)::DOUBLE AS n, ${fraudSum} FROM ${features()} GROUP BY 1 ORDER BY 1`),
    groupedRate(`SELECT signature_provided::INTEGER AS k, count(*)::DOUBLE AS n, ${fraudSum} FROM ${gr()} WHERE authorized_flag IS NOT NULL GROUP BY 1 ORDER BY 1`),
    groupedRate(`SELECT impossible_travel_flag::INTEGER AS k, count(*)::DOUBLE AS n, ${fraudSum} FROM ${features()} GROUP BY 1 ORDER BY 1`),
  ]);

  const subsectorRows = async (dir: "DESC" | "ASC") =>
    (await query(
      `SELECT subsector_description AS category, avg(${IS_FRAUD}) AS fraud_rate, count(*)::DOUBLE AS n
       FROM ${gr()} WHERE authorized_flag IS NOT NULL AND subsector_description IS NOT NULL
       GROUP BY 1 HAVING count(*) >= 500 ORDER BY fraud_rate ${dir}, category ASC LIMIT 5`
    )) as { category: string; fraud_rate: number; n: number }[];
  const [subsectorTop, subsectorBottom] = await Promise.all([subsectorRows("DESC"), subsectorRows("ASC")]);

  const flagSplit = async (col: string) => {
    const rows = await groupedRate(
      `SELECT ${col}::INTEGER AS k, count(*)::DOUBLE AS n, ${fraudSum} FROM ${features()} GROUP BY 1 ORDER BY 1`
    );
    const off = rows.find((r) => r.key === 0)!;
    const on = rows.find((r) => r.key === 1)!;
    return { n_flagged: on.n, rate_flagged: on.fraud_rate, n_unflagged: off.n, rate_unflagged: off.fraud_rate };
  };
  const [micro, velocityFlag] = await Promise.all([flagSplit("is_micro_transaction"), flagSplit("velocity_above_1_per_hour")]);
  const [both] = await query(
    `SELECT count(*)::DOUBLE AS n, avg(${IS_FRAUD}) AS fraud_rate FROM ${features()}
     WHERE is_micro_transaction = 1 AND velocity_above_1_per_hour = 1`
  );

  return {
    merchants,
    velocity,
    age,
    signature,
    travel,
    subsectorTop,
    subsectorBottom,
    triggers: {
      micro,
      velocity: velocityFlag,
      both: { n: Number(both.n), fraud_rate: Number(both.fraud_rate) },
    },
  };
}

export type StoryFigures = Awaited<ReturnType<typeof storyFigures>>;
