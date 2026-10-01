import type { NextConfig } from "next";
import { validateAllContent } from "./lib/content.ts";

// Build gate: a bad edit to content/ (the intro deck, the x-ray cards) stops `next build` here, with the
// file and field in the message, instead of surfacing as a runtime error on the live site.
validateAllContent();

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
const DOC_FILES = ["./data/docs/**/*", "./data/*.json"];
// Pages that read both: DuckDB over the parquet and the docs / JSON exports.
const DUCKDB_AND_DOCS = [...DUCKDB_FILES, ...DOC_FILES];

// content/*.md is read with fs at request time (layout and /intro), so the file tracer never sees it.
const CONTENT_FILES = ["./content/**/*.md"];

const nextConfig: NextConfig = {
  // The app opens on the demo intro; the Story lives at /story.
  async redirects() {
    return [{ source: "/", destination: "/intro", permanent: true }];
  },
  // DuckDB ships a native binary; keep it out of the bundle and load it from node_modules.
  serverExternalPackages: ["@duckdb/node-api", "@duckdb/node-bindings"],
  // File tracing misses two runtime reads: the parquet (opened by DuckDB, not by JS) and
  // libduckdb.so (dlopen'd by duckdb.node, so the tracer never sees it). EVERY route that
  // uses DuckDB needs an entry, or Vercel fails with "libduckdb.so: cannot open shared object file".
  outputFileTracingIncludes: {
    // Every page renders the layout, which loads the x-ray stops; /intro also loads its deck text.
    "/*": CONTENT_FILES,
    "/api/stats": DUCKDB_FILES,
    "/api/story": DUCKDB_FILES,
    "/api/ask": ASK_FILES,
    "/api/patterns": DUCKDB_FILES,
    "/patterns": DUCKDB_FILES,
    "/explorer": DUCKDB_FILES,
    "/story": DUCKDB_AND_DOCS,
    "/intro": DUCKDB_FILES,
    "/findings": DUCKDB_AND_DOCS,
    "/model": DOC_FILES,
    "/brief": DOC_FILES,
    "/api/shap": DOC_FILES,
  },
};

export default nextConfig;
