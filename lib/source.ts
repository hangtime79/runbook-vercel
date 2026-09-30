import { runReadOnlyQuery, type AskResult } from "./askdb";
import * as duck from "./duckdbSource";

/**
 * The data-source seam. Pages, the API routes and the Ask tool read data only through `source`;
 * none of them knows the engine behind it. Today that is DuckDB over the committed data/ files
 * (lib/duckdbSource.ts for the named page queries, lib/askdb.ts for the guarded free-form query).
 *
 * P3 (Snowflake via Vercel Connect): add lib/snowflakeSource.ts implementing this interface, with
 * the token from `getToken(...)` in @vercel/connect, and switch the export below on one env var.
 * The guard contract for `query` (single SELECT, read-only, row cap, timeout) must hold there too;
 * pipeline/test_guard.mts is the test to point at the new implementation.
 */
export type QueryResult = AskResult;
export type { Bucket, ExplorerRow, StoryFigures } from "./duckdbSource";

export interface DataSource {
  /** Free-form, guarded: exactly one read-only SELECT, capped rows, timeout. Never throws; errors come back in the result. */
  query(sql: string): Promise<QueryResult>;

  // Named queries behind the pages and charts.
  headlineCounts: typeof duck.headlineCounts;
  fraudRateByHour: typeof duck.fraudRateByHour;
  fraudRateBySubsector: typeof duck.fraudRateBySubsector;
  amountHistogram: typeof duck.amountHistogram;
  heatmap: typeof duck.heatmap;
  explorerRows: typeof duck.explorerRows;
  amountBands: typeof duck.amountBands;
  storyFigures: typeof duck.storyFigures;
}

export const source: DataSource = {
  query: runReadOnlyQuery,
  headlineCounts: duck.headlineCounts,
  fraudRateByHour: duck.fraudRateByHour,
  fraudRateBySubsector: duck.fraudRateBySubsector,
  amountHistogram: duck.amountHistogram,
  heatmap: duck.heatmap,
  explorerRows: duck.explorerRows,
  amountBands: duck.amountBands,
  storyFigures: duck.storyFigures,
};
