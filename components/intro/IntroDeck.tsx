"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Full-screen deck: children are <section data-slide> elements. CSS scroll-snap does the layout, so
 * touch and a later reader scroll normally; the keyboard (arrows, PageUp/PageDown, Space, Home/End)
 * moves one section at a time. Smooth scrolling is skipped under prefers-reduced-motion.
 */
export function IntroDeck({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);

  const slides = useCallback(() => Array.from(box.current?.querySelectorAll<HTMLElement>("[data-slide]") ?? []), []);

  const goTo = useCallback(
    (i: number) => {
      const all = slides();
      const target = all[Math.max(0, Math.min(all.length - 1, i))];
      if (!target) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    },
    [slides]
  );

  useEffect(() => {
    const root = box.current;
    const all = slides();
    setCount(all.length);
    if (!root || all.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = all.indexOf(e.target as HTMLElement);
            indexRef.current = i;
            setIndex(i);
          }
        }
      },
      { root, threshold: 0.55 }
    );
    all.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [slides]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement | null;
      const onControl = !!t?.closest("a, button, input, textarea, select");
      let next: number | null = null;
      if (e.key === "ArrowDown" || e.key === "PageDown") next = indexRef.current + 1;
      else if (e.key === "ArrowUp" || e.key === "PageUp") next = indexRef.current - 1;
      else if (e.key === " " && !onControl) next = indexRef.current + (e.shiftKey ? -1 : 1);
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = slides().length - 1;
      if (next === null) return;
      e.preventDefault();
      goTo(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, slides]);

  return (
    <div
      ref={box}
      id="intro-deck"
      className="fixed inset-0 snap-y snap-proximity overflow-y-auto overflow-x-hidden bg-background text-foreground motion-safe:scroll-smooth"
    >
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-5 z-10 font-mono text-[12px] text-foreground/60"
      >
        {count > 0 && (
          <span data-testid="intro-progress">
            {index + 1}/{count}
          </span>
        )}
      </div>
    </div>
  );
}
