"use client";

import { useEffect, useState } from "react";
import { STORY } from "@/lib/copy";

type RailItem = { num: string; short: string; title: string };

/**
 * Sticky chapter rail: seven segments, lit up to the active chapter. The active chapter is the
 * last one whose top has crossed the upper 45% of the scroll box, tracked with an
 * IntersectionObserver rooted at the layout's scroll container.
 */
export function StoryRail({ items }: { items: RailItem[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = document.getElementById("main-scroll");
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter]"));
    if (!root || sections.length === 0) return;
    const inBand = new Set<number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = Number((e.target as HTMLElement).dataset.chapter);
          if (e.isIntersecting) inBand.add(i);
          else inBand.delete(i);
        }
        // Nothing in the band (hero, closer): keep the last active chapter.
        if (inBand.size) setActive(Math.max(...inBand));
      },
      { root, rootMargin: "0px 0px -55% 0px", threshold: 0 }
    );
    sections.forEach((sec) => io.observe(sec));
    return () => io.disconnect();
  }, []);

  const go = (i: number) => {
    const root = document.getElementById("main-scroll");
    const el = document.querySelector<HTMLElement>(`[data-chapter="${i}"]`);
    if (!root || !el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.scrollTo({ top: el.offsetTop - 50, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <nav
      aria-label="Chapters"
      className="sticky top-0 z-[5] flex items-center gap-3.5 border-b border-border bg-background/[0.92] px-4 py-2.5 backdrop-blur-[6px] sm:px-10"
    >
      <span className="hidden flex-none text-[10px] uppercase tracking-kicker text-foreground/60 sm:inline">
        {STORY.railLabel}
      </span>
      <div className="flex min-w-0 flex-1 gap-1">
        {items.map((r, i) => (
          <a
            key={r.num}
            href={`#finding-${i + 1}`}
            title={r.title}
            aria-current={i === active ? "true" : undefined}
            onClick={(e) => {
              e.preventDefault();
              go(i);
            }}
            className="flex min-w-0 flex-1 flex-col gap-1 text-foreground no-underline hover:text-foreground"
            style={{ opacity: i <= active ? 1 : 0.4 }}
          >
            <span className="h-[3px] bg-signal-600" />
            <span className="truncate font-mono text-[10px]">
              {r.num}
              <span className="hidden sm:inline"> {r.short}</span>
            </span>
          </a>
        ))}
      </div>
    </nav>
  );
}
