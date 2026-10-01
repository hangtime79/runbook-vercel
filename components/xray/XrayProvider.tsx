"use client";

import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
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

/**
 * X-ray mode: a coaching overlay for the demo. Off by default and held only in React state, so it
 * survives client-side navigation and resets on a full reload. Toggle with the sidebar switch, the X key,
 * or ?xray=1 / ?xray=0. The stops (what each marker says) come from content/xray/*.md, loaded by the layout.
 */
export function XrayProvider({ stops, objections, children }: { stops: XrayStop[]; objections: XrayObjection[]; children: ReactNode }) {
  const [on, setOn] = useState(false);
  const [objectionsOn, setObjectionsOn] = useState(true);
  const enabled = useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP).matches,
    () => false
  );
  const pathname = usePathname();

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
      setOn((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggle = useCallback(() => setOn((v) => !v), []);
  const value = useMemo(
    () => ({ stops, objections, objectionsOn, setObjectionsOn, on, enabled, setOn, toggle }),
    [stops, objections, objectionsOn, on, enabled, toggle]
  );
  const active = on && enabled;

  return (
    <XrayContext.Provider value={value}>
      <TooltipProvider delayDuration={0}>
        {children}
        {active && <XrayLayer />}
        {active && <XrayLegend pathname={pathname} />}
        {active && pathname === "/intro" && (
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

