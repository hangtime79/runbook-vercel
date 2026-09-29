import type { NextConfig } from "next";

const DUCKDB_FILES = [
  "./data/**/*.parquet",
  "./node_modules/@duckdb/node-bindings-linux-x64/libduckdb.so",
];
// /api/ask opens the read-only .duckdb file, not the parquet, and reads the docs for its prompt.
const ASK_FILES = [
  "./data/fraud.duckdb",
  "./data/docs/**/*",
  "./node_modules/@duckdb/node-bindings-linux-x64/libduckdb.so",
];
const DOC_FILES = ["./data/docs/**/*", "./data/shap_importance.json"];

const nextConfig: NextConfig = {
  // DuckDB ships a native binary; keep it out of the bundle and load it from node_modules.
  serverExternalPackages: ["@duckdb/node-api", "@duckdb/node-bindings"],
  // File tracing misses two runtime reads: the parquet (opened by DuckDB, not by JS) and
  // libduckdb.so (dlopen'd by duckdb.node, so the tracer never sees it). EVERY route that
  // uses DuckDB needs an entry, or Vercel fails with "libduckdb.so: cannot open shared object file".
  outputFileTracingIncludes: {
    "/api/stats": DUCKDB_FILES,
    "/api/ask": ASK_FILES,
    "/api/patterns": DUCKDB_FILES,
    "/patterns": DUCKDB_FILES,
    "/explorer": DUCKDB_FILES,
    "/": DOC_FILES,
    "/findings": DOC_FILES,
    "/model": DOC_FILES,
    "/api/shap": DOC_FILES,
  },
};

export default nextConfig;
