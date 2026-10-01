import Link from "next/link";
import { AskButton } from "@/components/ask/AskButton";
import { Figure, FigureLabel, RateBars } from "@/components/Figure";
import { OnVercel } from "@/components/story/OnVercel";
import { StoryRail } from "@/components/story/StoryRail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { loadStoryVercel } from "@/lib/content";
import { CLOSER, CHAPTERS, STORY } from "@/lib/copy";
import { loadStory } from "@/lib/story";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function StoryPage() {
  const { baseline, kpis, chapters } = await loadStory();
  const onVercel = loadStoryVercel();

  return (
    <div>
      <StoryRail items={chapters.map((c) => ({ num: c.num, short: c.short, title: c.title }))} />

      <section className="max-w-[1080px] px-4 pb-9 pt-11 sm:px-10">
        <span className="text-[11px] uppercase tracking-kicker text-signal-700">{STORY.kicker}</span>
        <h1 data-xray="underneath" className="mb-[18px] mt-2.5 max-w-[880px] text-[32px] font-semibold leading-[1.08] tracking-tighter2 text-pretty sm:text-[44px]">
          {STORY.title}
        </h1>
        <p className="mb-8 max-w-[720px] text-[17px] text-foreground/80 text-pretty">{STORY.lede}</p>
        <div data-xray="kpis" className="grid grid-cols-[repeat(auto-fit,minmax(165px,1fr))] gap-5">
          {kpis.map((k) => (
            <Figure key={k.label} className="gap-1 px-[18px] py-4">
              <span className="text-[10px] uppercase tracking-kicker text-foreground/[0.62]">{k.label}</span>
              <span
                className={`text-[38px] font-semibold leading-none tracking-tighter2 ${k.accent ? "text-signal-800" : ""}`}
              >
                {k.value}
              </span>
              <span className="text-[12px] text-foreground/[0.62]">{k.caption}</span>
            </Figure>
          ))}
        </div>
        <OnVercel text={onVercel.kpis} className="mt-5" />
      </section>

      {chapters.map((c) => (
        <section
          key={c.idx}
          id={`finding-${c.idx + 1}`}
          data-chapter={c.idx}
          data-xray={c.idx === 0 ? "merchants" : undefined}
          className="grid max-w-[1160px] grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-9 border-t border-border px-4 py-11 sm:px-10"
        >
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex items-baseline gap-2.5">
              <span className="font-mono text-[12px] text-signal-700">Finding {c.num}</span>
              <Badge className="h-auto rounded-full bg-signal-100 px-2 py-0.5 text-[11px] font-medium text-signal-pill">
                {c.owner}
              </Badge>
            </div>
            <h2 className="text-[28px] font-semibold leading-[1.15] tracking-tight2 text-pretty">{c.title}</h2>
            <OnVercel text={onVercel[CHAPTERS[c.idx].src]} />
            <div className="my-1 flex items-baseline gap-3">
              <span className="text-[56px] font-semibold leading-none tracking-tightest text-signal-800">{c.stat}</span>
              <span className="max-w-[220px] text-[14px] text-foreground/70">{c.statLabel}</span>
            </div>
            <dl className="m-0 grid grid-cols-[92px_1fr] gap-x-3.5 gap-y-1.5 text-[14px] leading-[1.5]">
              <dt className="pt-[3px] text-[10px] uppercase tracking-kicker text-foreground/60">Why</dt>
              <dd className="m-0 text-pretty">{c.why}</dd>
              <dt className="pt-[3px] text-[10px] uppercase tracking-kicker text-foreground/60">Do this</dt>
              <dd className="m-0 font-medium text-pretty">{c.action}</dd>
            </dl>
            <div className="mt-1.5 flex gap-2">
              <AskButton question={c.q} xray={c.idx === 0 ? "ask-button" : undefined} />
            </div>
          </div>
          <figure className="m-0 min-w-0">
            <Figure className="gap-2.5 px-5 pb-3.5 pt-[18px]">
              <FigureLabel>
                <span>{c.chartTitle}</span>
                <span>fraud rate</span>
              </FigureLabel>
              <RateBars rows={c.bars} axisMax={c.axisMax} baseline={baseline} />
              <figcaption className="mt-0.5 flex gap-2 text-[12px] text-foreground/65">
                <span className="mt-2 w-3.5 flex-none border-t border-dashed border-foreground" aria-hidden />
                <span className="text-pretty">{c.note}</span>
              </figcaption>
            </Figure>
          </figure>
        </section>
      ))}

      <section className="max-w-[1080px] border-t border-border px-4 pb-16 pt-10 sm:px-10">
        <span className="text-[11px] uppercase tracking-kicker text-signal-700">{CLOSER.kicker}</span>
        <h2 className="mb-2.5 mt-2 text-[34px] font-semibold">{CLOSER.title}</h2>
        <p className="mb-4 max-w-[680px] text-foreground/[0.78]">{CLOSER.body}</p>
        <div className="flex flex-wrap gap-2.5">
          <Button asChild className="h-auto rounded-md px-4 py-[9px] text-[14px] font-semibold">
            <Link href="/model">{CLOSER.model}</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-auto rounded-md border-border-strong bg-background px-3.5 py-2 text-[13px] font-medium text-foreground hover:text-foreground"
          >
            <Link href="/findings">{CLOSER.findings}</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-auto rounded-md border-border-strong bg-background px-3.5 py-2 text-[13px] font-medium text-foreground hover:text-foreground"
          >
            <Link href="/brief">{CLOSER.brief}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
