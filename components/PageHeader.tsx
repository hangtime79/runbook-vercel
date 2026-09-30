import type { ReactNode } from "react";

/** Shared header for every route except Story: kicker, H1, lede. */
export function PageHeader({ kicker, title, lede, children }: {
  kicker: string;
  title: string;
  lede?: string;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-kicker text-signal-700">{kicker}</span>
      <h1 className="text-[36px] font-semibold leading-[1.1] tracking-tight2">{title}</h1>
      {lede && <p className="max-w-[680px] text-[15px] text-foreground/75 text-pretty">{lede}</p>}
      {children}
    </header>
  );
}

/** Page frame: gutters and max width from the README (40px / 1160). */
export function Page({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className={`flex flex-col gap-10 px-4 pb-16 pt-10 sm:px-10 ${wide ? "" : "max-w-[1160px]"}`}>{children}</div>
  );
}
