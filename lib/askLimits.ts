/** Limits of the read-only query path. Kept apart from lib/askdb.ts so /governance can show them without loading DuckDB. */
export const ROW_LIMIT = 200;
export const TIMEOUT_MS = 10_000;
