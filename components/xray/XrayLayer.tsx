"use client";

import { useEffect, useRef, useState } from "react";
import { Block, Inline } from "@/components/Markdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { OBJECTION_SECTIONS, STOP_SECTIONS, type ObjectionSection, type StopSection, type XrayObjection, type XrayStop } from "@/lib/xrayTypes";
import { useXray } from "./context";

type Placed =
  | { kind: "stop"; key: string; stop: XrayStop; x: number; y: number }
  | { kind: "objection"; key: string; items: XrayObjection[]; x: number; y: number };

const CARD_CLASS =
  "z-[70] block max-h-[var(--radix-tooltip-content-available-height)] w-[420px] max-w-[calc(100vw-16px)] overflow-y-auto overscroll-contain [scrollbar-color:var(--xray)_transparent] rounded-lg border border-xray/40 bg-[#0b0f12] p-3.5 text-left text-[12.5px] leading-[1.5] text-foreground shadow-2xl";

const SIZE = 22;
const EDGE = 4;

/** Ancestors that clip their children (scroll boxes, overflow hidden), so a scrolled-away element gets no badge. */
const clipCache = new WeakMap<Element, Element[]>();
function clippers(el: Element): Element[] {
  let list = clipCache.get(el);
  if (!list) {
    list = [];
    for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (/(auto|scroll|hidden|clip)/.test(cs.overflowX + cs.overflowY)) list.push(p);
    }
    clipCache.set(el, list);
  }
  return list;
}

/** The part of the element you can actually see, as its top-left corner; null when none of it shows. */
function visibleCorner(el: Element): { x: number; y: number } | null {
  const r = el.getBoundingClientRect();
  let left = r.left;
  let top = r.top;
  let right = r.right;
  let bottom = r.bottom;
  for (const p of clippers(el)) {
    const pr = p.getBoundingClientRect();
    left = Math.max(left, pr.left);
    top = Math.max(top, pr.top);
    right = Math.min(right, pr.right);
    bottom = Math.min(bottom, pr.bottom);
  }
  left = Math.max(left, 0);
  top = Math.max(top, 0);
  right = Math.min(right, window.innerWidth);
  bottom = Math.min(bottom, window.innerHeight);
  return right - left > 1 && bottom - top > 1 ? { x: left, y: top } : null;
}

const elementIds = new WeakMap<Element, number>();
let nextElementId = 1;
const idOf = (el: Element) => {
  let id = elementIds.get(el);
  if (!id) elementIds.set(el, (id = nextElementId++));
  return id;
};

/**
 * Find every [data-xray] element in view and place one badge per stop id on it, then one "!" badge per
 * element that carries objections (several objections on one stop share one badge with a count).
 */
function place(stops: XrayStop[], objections: XrayObjection[]): Placed[] {
  const byId = new Map(stops.map((s) => [s.id, s]));
  const objByAnchor = new Map<string, XrayObjection[]>();
  for (const o of objections) objByAnchor.set(o.anchor, [...(objByAnchor.get(o.anchor) ?? []), o]);
  const found: { key: string; stop: XrayStop; el: number; x: number; y: number }[] = [];
  const foundObj: { key: string; items: XrayObjection[]; n: number; el: number; x: number; y: number }[] = [];
  document.querySelectorAll("[data-xray]").forEach((el) => {
    const corner = visibleCorner(el);
    if (!corner) return;
    const items: XrayObjection[] = [];
    let first = Infinity;
    for (const id of (el.getAttribute("data-xray") ?? "").split(/\s+/).filter(Boolean)) {
      const stop = byId.get(id);
      if (stop) found.push({ key: `${id}#${idOf(el)}`, stop, el: idOf(el), x: corner.x, y: corner.y });
      const objs = objByAnchor.get(id);
      if (stop && objs) {
        items.push(...objs);
        first = Math.min(first, stop.n);
      }
    }
    if (items.length) foundObj.push({ key: `obj:${items[0].anchor}#${idOf(el)}`, items, n: first, el: idOf(el), x: corner.x, y: corner.y });
  });
  found.sort((a, b) => a.stop.n - b.stop.n || a.el - b.el);
  foundObj.sort((a, b) => a.n - b.n || a.el - b.el);

  // Put each badge in the gutter just left of its element, level with its top edge. Where there is no
  // room (the sidebar, a full-screen slide) it sits just above the element's top-left corner instead. It
  // stays on screen, and slides right past any badge already there (which also lays several stops on one
  // element out in a row). Objection badges go last, so they land after the stop badges in the same row.
  const placed: Placed[] = [];
  const maxX = window.innerWidth - SIZE - EDGE;
  const maxY = window.innerHeight - SIZE - EDGE;
  const spot = (fx: number, fy: number) => {
    const gutter = fx - SIZE - 4;
    const inGutter = gutter >= EDGE;
    let x = Math.min(Math.max(inGutter ? gutter : fx - 4, EDGE), maxX);
    const y = Math.min(Math.max(inGutter ? fy : fy - SIZE - 2, EDGE), maxY);
    while (placed.some((p) => Math.abs(p.x - x) < SIZE + 2 && Math.abs(p.y - y) < SIZE + 2) && x < maxX) x += SIZE + 4;
    return { x: Math.round(x), y: Math.round(y) };
  };
  for (const f of found) placed.push({ kind: "stop", key: f.key, stop: f.stop, ...spot(f.x, f.y) });
  for (const f of foundObj) placed.push({ kind: "objection", key: f.key, items: f.items, ...spot(f.x, f.y) });
  return placed;
}

const same = (a: Placed[], b: Placed[]) =>
  a.length === b.length && a.every((p, i) => p.key === b[i].key && p.x === b[i].x && p.y === b[i].y);

const LABEL: Record<StopSection, string> = {
  What: "What it is",
  Tell: "Tell",
  Say: "Say",
  "Head of Fraud": "Head of Fraud",
  CIO: "CIO",
  Show: "Show",
  "Leave the app": "Leave the app",
  Craft: "Craft",
  "Watch out": "Watch out",
};

const OBJ_LABEL: Record<ObjectionSection, string> = {
  "They say": "They say",
  "Why they ask": "Why they ask",
  Answer: "Answer",
  Show: "Show",
  "Don't say": "Don't say",
  Sources: "Sources",
};

function ObjectionCard({ items }: { items: XrayObjection[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((o, i) => (
        <div key={o.id} className={`flex flex-col gap-2.5 ${i > 0 ? "border-t border-border-strong pt-3" : ""}`}>
          <span className="font-mono text-[11px] text-xray-objection">
            Objection · {o.who} · {o.theme}
          </span>
          <div className="text-[15px] font-semibold leading-[1.25] text-foreground">
            <Inline>{o.title}</Inline>
          </div>
          {OBJECTION_SECTIONS.map((name) => {
            const text = o.sections[name];
            if (!text) return null;
            const small = name === "Sources";
            return (
              <div key={name} className="flex flex-col gap-0.5">
                <span
                  className={`font-mono text-[10px] uppercase tracking-[0.12em] ${name === "Don't say" ? "text-amber-300" : "text-foreground/55"}`}
                >
                  {OBJ_LABEL[name]}
                </span>
                <Block
                  className={
                    name === "Answer"
                      ? "border-l-2 border-xray-objection/70 pl-2.5 text-foreground"
                      : small
                        ? "text-[11px] leading-[1.4] text-foreground/55"
                        : "text-foreground/85"
                  }
                >
                  {text}
                </Block>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Card({ stop }: { stop: XrayStop }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] text-xray">
          {String(stop.n).padStart(2, "0")} · {stop.act} · {stop.beat}
        </span>
        <span
          className={`rounded-full border px-2 py-px font-mono text-[10px] ${
            stop.fast === "keep" ? "border-xray/60 text-xray" : "border-border-strong text-foreground/55"
          }`}
        >
          Fast run: {stop.fast}
        </span>
      </div>
      <div className="text-[15px] font-semibold leading-[1.25] text-foreground">
        <Inline>{stop.title}</Inline>
      </div>
      {STOP_SECTIONS.map((name) => {
        const text = stop.sections[name];
        if (!text) return null;
        return (
          <div key={name} className="flex flex-col gap-0.5">
            <span
              className={`font-mono text-[10px] uppercase tracking-[0.12em] ${
                name === "Watch out" ? "text-amber-300" : name === "Leave the app" ? "text-xray" : "text-foreground/55"
              }`}
            >
              {LABEL[name]}
            </span>
            <Block className={name === "Say" ? "border-l-2 border-xray/70 pl-2.5 text-foreground" : "text-foreground/85"}>{text}</Block>
          </div>
        );
      })}
    </div>
  );
}

/**
 * The glowing numbered markers. One fixed, click-through overlay holds a badge per stop on every
 * [data-xray] element in view; hovering (or focusing) a badge opens its card. The page is rescanned on
 * DOM changes (the Ask panel's cards appear later), scroll (capture, so the deck and the main scroll box count) and resize.
 */
export function XrayLayer() {
  const { stops, objections, objectionsOn } = useXray();
  const [badges, setBadges] = useState<Placed[]>([]);
  const overlay = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const run = () => {
      frame = 0;
      const next = place(stops, objectionsOn ? objections : []);
      setBadges((prev) => (same(prev, next) ? prev : next));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(run);
    };
    const mo = new MutationObserver((records) => {
      // Our own badges and the open card are not the page changing.
      if (records.some((r) => !overlay.current?.contains(r.target) && !(r.target as Element).closest?.("[data-slot=tooltip-content]"))) {
        schedule();
      }
    });
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-xray", "class", "style", "hidden"] });
    window.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("resize", schedule);
    const poll = window.setInterval(schedule, 600); // catches layout that moves without a DOM change (fonts, charts)
    schedule();
    return () => {
      mo.disconnect();
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
      window.clearInterval(poll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [stops, objections, objectionsOn]);

  return (
    <div ref={overlay} data-xray-layer className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {badges.map((b) =>
        b.kind === "stop" ? (
          <Tooltip key={b.key}>
            <TooltipTrigger asChild>
              <button
                type="button"
                data-xray-badge={b.stop.n}
                aria-label={`X-ray stop ${b.stop.n}: ${b.stop.title}`}
                className="xray-badge pointer-events-auto absolute left-0 top-0"
                style={{ transform: `translate(${b.x}px, ${b.y}px)` }}
              >
                {b.stop.n}
              </button>
            </TooltipTrigger>
            <TooltipContent arrow={false} side="bottom" align="start" sideOffset={8} collisionPadding={8} className={CARD_CLASS}>
              <Card stop={b.stop} />
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip key={b.key}>
            <TooltipTrigger asChild>
              <button
                type="button"
                data-xray-objection={b.items[0].anchor}
                data-count={b.items.length}
                aria-label={`${b.items.length} objection${b.items.length > 1 ? "s" : ""}: ${b.items.map((o) => o.title).join("; ")}`}
                className="xray-objection pointer-events-auto absolute left-0 top-0"
                style={{ transform: `translate(${b.x}px, ${b.y}px)` }}
              >
                {b.items.length > 1 ? `!${b.items.length}` : "!"}
              </button>
            </TooltipTrigger>
            <TooltipContent
              arrow={false}
              side="bottom"
              align="start"
              sideOffset={8}
              collisionPadding={8}
              className={CARD_CLASS.replace("border-xray/40", "border-xray-objection/50")}
            >
              <ObjectionCard items={b.items} />
            </TooltipContent>
          </Tooltip>
        )
      )}
    </div>
  );
}
