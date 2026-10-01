"use client";

import Link from "next/link";
import { useXray } from "./context";

/** The route legend: which stops belong to this page, and where the next one is. Lets the SE walk the whole route. */
export function XrayLegend({ pathname }: { pathname: string }) {
  const { stops } = useXray();
  const here = stops.filter((s) => s.route === pathname);
  const lastHere = here.length ? Math.max(...here.map((s) => s.n)) : 0;
  const next = stops.find((s) => s.n > lastHere);
  const range = here.length
    ? here[0].n === lastHere
      ? `stop ${lastHere}`
      : `stops ${here[0].n}–${lastHere}`
    : null;

  return (
    <div
      data-testid="xray-legend"
      // On shell pages the sidebar owns the bottom-left corner, so the pill sits just right of it.
      className={`fixed bottom-3 z-[60] flex max-w-[calc(100vw-32px)] items-center gap-1.5 rounded-full border border-xray/50 bg-background/95 px-3 py-1 font-mono text-[11px] text-foreground/80 ${
        pathname === "/intro" ? "left-4" : "left-[224px]"
      }`}
    >
      <span className="text-xray">X-ray</span>
      {range ? <span>· {range} here</span> : <span>· no stops on this page</span>}
      {next ? (
        <span>
          · next{" "}
          <Link href={next.route} className="text-xray underline underline-offset-2 hover:text-xray">
            {next.n} → {next.route}
          </Link>
        </span>
      ) : (
        <span>· last stop</span>
      )}
    </div>
  );
}
