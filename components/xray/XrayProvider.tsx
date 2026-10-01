"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useAsk } from "@/components/ask/AskProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { XrayObjection, XrayStop } from "@/lib/xrayTypes";
import { XrayContext } from "./context";
import { XrayLayer } from "./XrayLayer";
import { XrayLegend } from "./XrayLegend";

// A desktop rehearsal tool: under 768px the mode is disabled.
const DESKTOP = "(min-width: 768px)";
function subscribeDesktop(cb: () => void) {
  const mq = window.matchMedia(DESKTOP);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** True when the key press belongs to a text field, so typing "x" there never toggles the mode. */
function inTextField(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  return !!el?.closest?.('input, textarea, select, [contenteditable=""], [contenteditable="true"]');
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Resolves with the first element matching any selector, checked now and on every DOM change, or null at the timeout. */
function waitForElement(selectors: string[], timeoutMs: number): Promise<Element | null> {
  const find = () => {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  };
  return new Promise((resolve) => {
    const hit = find();
    if (hit) return resolve(hit);
    const mo = new MutationObserver(() => {
      const el = find();
      if (el) {
        mo.disconnect();
        window.clearTimeout(timer);
        resolve(el);
      }
    });
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-xray", "data-xray-standin"] });
    const timer = window.setTimeout(() => {
      mo.disconnect();
      resolve(find());
    }, timeoutMs);
  });
}

/** Resolves when scrolling stops: the scrollend event where it exists, otherwise a 700 ms wait. */
function scrollSettled(): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener("scrollend", finish, true);
      resolve();
    };
    if ("onscrollend" in window) window.addEventListener("scrollend", finish, true);
    window.setTimeout(finish, 700);
  });
}

/**
 * X-ray mode: a coaching overlay for the demo. Off by default and held only in React state, so it
 * survives client-side navigation and resets on a full reload. Toggle with the sidebar switch, the X key,
 * or ?xray=1 / ?xray=0. The stops (what each marker says) come from content/xray/*.md, loaded by the layout.
 */
export function XrayProvider({ stops, objections, children }: { stops: XrayStop[]; objections: XrayObjection[]; children: ReactNode }) {
  const [on, setOnState] = useState(false);
  const [active, setActiveRaw] = useState<number | null>(null);
  // The stop the legend and [ ] keys count from. It moves the moment goTo starts, so quick key presses keep stepping forward.
  const [cursor, setCursor] = useState<number | null>(null);
  const setActive = useCallback((n: number | null) => {
    setActiveRaw(n);
    if (n !== null) setCursor(n);
  }, []);
  const setOn = useCallback((v: boolean) => {
    setOnState(v);
    if (!v) setActiveRaw(null);
  }, []);
  const [objectionsOn, setObjectionsOn] = useState(true);
  const enabled = useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP).matches,
    () => false
  );
  const pathname = usePathname();
  const router = useRouter();
  const { setPanelOpen } = useAsk();
  const run = useRef(0);
  const moving = useRef(false);

  // ?xray=1 turns it on, ?xray=0 turns it off. Read once, from the address bar, not useSearchParams (which forces Suspense).
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("xray");
    if (v === "1") setOn(true);
    else if (v === "0") setOn(false);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "x" || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.repeat) return;
      if (inTextField(e.target)) return;
      setOnState((v) => {
        if (v) setActiveRaw(null);
        return !v;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // goTo: page, panel, element, scroll, then pin the card. A newer goTo cancels an older one.
  const goTo = useCallback(
    async (n: number) => {
      const stop = stops.find((s) => s.n === n);
      if (!stop) return;
      const me = ++run.current;
      moving.current = true;
      setActiveRaw(null);
      setCursor(n);
      if (stop.route !== window.location.pathname) router.push(stop.route);
      if (stop.panel) setPanelOpen(true);
      const own = `[data-xray~="${stop.id}"]`;
      const stand = stop.standIn ? [`[data-xray~="${stop.standIn}"]`, `[data-xray-standin~="${stop.standIn}"]`] : [];
      let el = await waitForElement([own], stand.length ? 600 : 3000);
      if (me !== run.current) return;
      if (!el && stand.length) el = await waitForElement(stand, 3000);
      if (me !== run.current) return;
      if (el) {
        el.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" });
        await scrollSettled();
        if (me !== run.current) return;
      }
      moving.current = false;
      setActiveRaw(n);
    },
    [stops, router, setPanelOpen]
  );

  const firstHere = stops.find((s) => s.route === pathname)?.n ?? 0;
  const current = cursor ?? firstHere;
  const next = useCallback(() => void goTo(Math.min(stops.length, current + 1)), [goTo, stops.length, current]);
  const prev = useCallback(() => void goTo(Math.max(1, current - 1)), [goTo, current]);

  // Leaving the cursor's page by hand (the sidebar) drops the cursor, so the legend counts from this page again.
  useEffect(() => {
    if (cursor === null || moving.current) return;
    if (stops.find((s) => s.n === cursor)?.route !== pathname) setCursor(null);
  }, [pathname, cursor, stops]);

  // [ and ] step through the stops; Escape unpins the card first (and so does not also close the Ask panel).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!on || !enabled) return;
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.repeat) return;
      if (e.key === "Escape") {
        if (active === null) return;
        e.stopPropagation();
        setActiveRaw(null);
        return;
      }
      if (e.key !== "[" && e.key !== "]") return;
      if (inTextField(e.target)) return;
      if (e.key === "]" && current < stops.length) next();
      if (e.key === "[" && current > 1) prev();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [on, enabled, active, current, stops.length, next, prev]);

  // A click anywhere outside a badge, a card or the legend unpins the card.
  useEffect(() => {
    if (active === null) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (!t?.closest?.("[data-xray-badge], [data-xray-objection], [data-slot=tooltip-content], [data-testid=xray-legend]")) setActiveRaw(null);
    };
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, [active]);

  const toggle = useCallback(() => setOn(!on), [on, setOn]);
  const value = useMemo(
    () => ({ stops, objections, objectionsOn, setObjectionsOn, on, enabled, setOn, toggle, active, setActive, current, goTo, next, prev }),
    [stops, objections, objectionsOn, on, enabled, setOn, toggle, active, current, goTo, next, prev]
  );
  const showing = on && enabled;

  return (
    <XrayContext.Provider value={value}>
      <TooltipProvider delayDuration={0}>
        {children}
        {showing && <XrayLayer />}
        {showing && <XrayLegend pathname={pathname} />}
        {showing && pathname === "/intro" && (
          // /intro has no sidebar, so a tiny pill says the mode is on (and clicking it turns it off).
          <button
            type="button"
            onClick={toggle}
            aria-label="X-ray is on. Turn it off."
            className="fixed right-4 top-3 z-[60] rounded-full border border-xray/60 bg-background/90 px-2.5 py-0.5 font-mono text-[11px] text-xray"
          >
            X-ray on
          </button>
        )}
      </TooltipProvider>
    </XrayContext.Provider>
  );
}

