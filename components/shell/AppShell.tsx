"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { MessageSquare } from "lucide-react";
import { AskView } from "@/components/ask/AskView";
import { useAsk } from "@/components/ask/AskProvider";
import { NAV, SIDEBAR } from "@/lib/copy";

const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

function NavLinks({ pathname, layout }: { pathname: string; layout: "column" | "row" }) {
  return (
    <>
      {NAV.map((n, i) => {
        const active = isActive(pathname, n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={
              layout === "column"
                ? `grid grid-cols-[28px_1fr] items-baseline border-l-2 px-5 py-[9px] text-foreground no-underline transition-colors hover:bg-signal-600/[0.08] hover:text-foreground ${
                    active ? "border-signal-600 bg-signal-600/5" : "border-transparent"
                  }`
                : `flex shrink-0 items-baseline gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-foreground no-underline hover:text-foreground ${
                    active ? "border-signal-600" : "border-transparent"
                  }`
            }
          >
            <span className="font-mono text-[11px] text-foreground/55">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-[14px] font-medium">{n.label}</span>
          </Link>
        );
      })}
    </>
  );
}

function Brand() {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-2 text-[12px] font-medium text-muted-foreground">
        <span className="size-2 rounded-full bg-signal-600" aria-hidden />
        Runbook
      </span>
      <span className="text-[18px] font-semibold leading-[1.2] tracking-[-0.02em]">{SIDEBAR.brand}</span>
      <span className="text-[12px] text-foreground/60">{SIDEBAR.sub}</span>
    </div>
  );
}

function Sidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="hidden w-[212px] shrink-0 flex-col border-r border-border pb-[18px] pt-[22px] sm:flex">
      <div className="px-5 pb-[22px]">
        <Brand />
      </div>
      <nav aria-label="Main" className="flex flex-col">
        <NavLinks pathname={pathname} layout="column" />
      </nav>
      <div className="mt-auto flex flex-col gap-1.5 border-t border-border px-5 pt-4 text-[11px] leading-[1.45] text-foreground/60">
        <span className="text-[10px] uppercase tracking-[0.1em]">{SIDEBAR.footerKicker}</span>
        {SIDEBAR.footerLines.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </aside>
  );
}

function TopBar({ pathname }: { pathname: string }) {
  return (
    <header className="shrink-0 border-b border-border sm:hidden">
      <div className="px-4 pb-1 pt-3">
        <Brand />
      </div>
      <nav aria-label="Main" className="flex overflow-x-auto px-1">
        <NavLinks pathname={pathname} layout="row" />
      </nav>
    </header>
  );
}

function AskPanel({ isAskPage }: { isAskPage: boolean }) {
  const { panelOpen, setPanelOpen } = useAsk();
  const open = isAskPage || panelOpen;

  // Escape closes the phone sheet (and the side panel) from the keyboard.
  useEffect(() => {
    if (!open || isAskPage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, isAskPage, setPanelOpen]);

  return (
    <>
      <aside
        aria-label="Ask the data"
        className={`flex min-w-0 flex-col border-l border-border bg-surface ${
          isAskPage
            ? "flex-1"
            : open
              ? "w-[380px] shrink-0 max-sm:fixed max-sm:inset-0 max-sm:z-50 max-sm:w-auto max-sm:border-l-0"
              : "w-11 shrink-0 max-sm:hidden"
        }`}
      >
        {open ? (
          <AskView variant={isAskPage ? "page" : "panel"} />
        ) : (
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            aria-label="Open the Ask the data panel"
            aria-expanded={false}
            className="flex flex-1 items-start justify-center pt-5"
          >
            <span className="text-[16px] font-semibold tracking-[0.04em] text-signal-700 [writing-mode:vertical-rl]">
              Ask the data ←
            </span>
          </button>
        )}
      </aside>
      {!open && (
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-border-strong bg-surface px-4 py-2.5 text-[13px] font-semibold text-signal-700 sm:hidden"
        >
          <MessageSquare className="size-4" strokeWidth={1.5} aria-hidden />
          Ask the data
        </button>
      )}
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAskPage = pathname === "/ask";
  const main = useRef<HTMLElement>(null);

  // The scroll box lives in the layout, so a new page would keep the old scroll position.
  useEffect(() => {
    main.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground sm:flex-row">
      <Sidebar pathname={pathname} />
      <TopBar pathname={pathname} />
      <main
        id="main-scroll"
        ref={main}
        tabIndex={-1}
        className={`relative min-w-0 flex-1 overflow-y-auto overflow-x-hidden outline-none ${isAskPage ? "hidden" : ""}`}
      >
        {children}
      </main>
      <AskPanel isAskPage={isAskPage} />
    </div>
  );
}
