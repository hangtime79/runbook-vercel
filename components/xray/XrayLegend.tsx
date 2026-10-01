"use client";

import { useXray } from "./context";

const STEP = "rounded-full border border-xray/50 px-2 text-[13px] leading-[18px] text-xray enabled:hover:bg-xray/15 disabled:cursor-not-allowed disabled:opacity-35";

/** The route legend: where you are in the route, with back and forward buttons ([ and ] keys) that take you to the stop. */
export function XrayLegend({ pathname }: { pathname: string }) {
  const { stops, objections, objectionsOn, setObjectionsOn, current, next: goNext, prev: goPrev } = useXray();
  const here = stops.filter((s) => s.route === pathname);
  const lastHere = here.length ? Math.max(...here.map((s) => s.n)) : 0;
  const shown = stops.find((s) => s.n === current);
  const hereIds = new Set(here.map((s) => s.id));
  const objCount = objections.filter((o) => hereIds.has(o.anchor)).length;
  const range = here.length
    ? here[0].n === lastHere
      ? `stop ${lastHere}`
      : `stops ${here[0].n}–${lastHere}`
    : null;

  return (
    <div
      data-testid="xray-legend"
      // On shell pages the sidebar owns the bottom-left corner, so the pill sits just right of it.
      className={`fixed bottom-3 z-[80] flex max-w-[calc(100vw-32px)] items-center gap-1.5 rounded-full border border-xray/50 bg-background/95 px-3 py-1 font-mono text-[11px] text-foreground/80 ${
        pathname === "/intro" ? "left-4" : "left-[224px]"
      }`}
    >
      <span className="text-xray">X-ray</span>
      <button type="button" aria-label="Previous stop" data-testid="xray-prev" disabled={current <= 1} onClick={goPrev} className={STEP}>
        ‹
      </button>
      <span data-testid="xray-position" className="max-w-[260px] truncate text-foreground">
        {current ? `${current} / ${stops.length}` : `– / ${stops.length}`}
        {shown ? ` · ${shown.title}` : ""}
      </span>
      <button type="button" aria-label="Next stop" data-testid="xray-next" disabled={current >= stops.length} onClick={goNext} className={STEP}>
        ›
      </button>
      {range ? <span>· {range} here</span> : <span>· no stops on this page</span>}
      {objCount > 0 && (
        <span className="text-xray-objection" data-testid="xray-objection-count">
          · {objCount} objection{objCount > 1 ? "s" : ""}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={objectionsOn}
        onClick={() => setObjectionsOn(!objectionsOn)}
        className={`rounded-full border px-1.5 py-px text-[10px] ${
          objectionsOn ? "border-xray-objection/70 text-xray-objection" : "border-border-strong text-foreground/55"
        }`}
      >
        Objections {objectionsOn ? "on" : "off"}
      </button>
    </div>
  );
}
