import Link from "next/link";
import { TierTable } from "@/components/TierTable";
import { IntroDeck } from "@/components/intro/IntroDeck";
import { INTRO_FIGS } from "@/lib/copy";
import { int, pct } from "@/lib/format";
import { DEMO_PR_URL, INTRO as C } from "@/lib/introCopy";
import { source } from "@/lib/source";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Card Fraud Analysis · Demo" };

const SLIDE = "relative flex min-h-dvh snap-start flex-col justify-center px-6 py-16 sm:px-14 lg:px-24";
const KICKER = "text-[12px] uppercase tracking-kicker text-signal-700";
const CARD = "rounded-xl border border-border bg-card";

function Big({ value, label }: { value: string; label: string }) {
  return (
    <div className={`${CARD} flex min-w-0 flex-col gap-2 px-6 py-5`}>
      <span className="text-[44px] font-semibold leading-none tracking-tighter2 text-signal-800 sm:text-[64px]">{value}</span>
      <span className="text-[14px] text-foreground/70">{label}</span>
    </div>
  );
}

export default async function IntroPage() {
  const counts = await source.headlineCounts();
  const rate = counts.fraud / counts.labeled;

  return (
    <IntroDeck>
      <section data-slide className={SLIDE} aria-labelledby="s1">
        <span className={KICKER}>{C.situation.kicker}</span>
        <h1 id="s1" className="mb-10 mt-3 max-w-[1000px] text-[32px] font-semibold leading-[1.08] tracking-tighter2 text-pretty sm:text-[52px]">
          {C.situation.title}
        </h1>
        <div className="mb-8 grid max-w-[1000px] grid-cols-1 gap-5 sm:grid-cols-3">
          <Big value={int(counts.fraud)} label={C.situation.labels.fraud} />
          <Big value={INTRO_FIGS.clusterValue} label={INTRO_FIGS.clusterLabel} />
          <Big value={pct(rate, 2)} label={C.situation.labels.rate} />
        </div>
        <p className="m-0 text-[22px] font-medium text-signal-800 sm:text-[28px]">{C.situation.closer}</p>
      </section>

      <section data-slide className={SLIDE} aria-labelledby="s2">
        <span className={KICKER}>{C.tension.kicker}</span>
        <h2 id="s2" className="mb-8 mt-3 max-w-[900px] text-[30px] font-semibold leading-[1.1] tracking-tighter2 sm:text-[44px]">
          {C.tension.title}
        </h2>
        <div className="grid max-w-[1100px] grid-cols-1 gap-5 md:grid-cols-2">
          {[C.tension.fraud, C.tension.cio].map((p) => (
            <div key={p.role} className={`${CARD} flex flex-col gap-3 px-6 py-6`}>
              <span className="text-[12px] uppercase tracking-kicker text-foreground/60">{p.role}</span>
              <p className="m-0 text-[22px] font-medium leading-[1.25] text-pretty sm:text-[26px]">&ldquo;{p.line}&rdquo;</p>
            </div>
          ))}
        </div>
        <div className="mt-5 max-w-[1100px] rounded-xl border border-signal-400 bg-signal-100 px-6 py-5">
          <span className="text-[12px] font-semibold uppercase tracking-kicker text-signal-700">{C.tension.apra.label}</span>
          <p className="m-0 mt-2 text-[18px] leading-[1.4] text-pretty sm:text-[22px]">&ldquo;{C.tension.apra.quote}&rdquo;</p>
          <p className="m-0 mt-2 text-[13px] text-foreground/70">{C.tension.apra.cite}</p>
        </div>
      </section>

      <section data-slide className={SLIDE} aria-labelledby="s3">
        <span className={KICKER}>{C.thesis.kicker}</span>
        <h2 id="s3" className="mb-6 mt-3 max-w-[1200px] text-[36px] font-semibold leading-[1.05] tracking-tightest text-pretty sm:text-[60px]">
          {C.thesis.title}
        </h2>
        <p className="m-0 max-w-[820px] text-[18px] text-foreground/80 text-pretty sm:text-[24px]">{C.thesis.sub}</p>
      </section>

      <section data-slide className={SLIDE} aria-labelledby="s4">
        <span className={KICKER}>{C.see.kicker}</span>
        <h2 id="s4" className="mb-8 mt-3 text-[30px] font-semibold tracking-tighter2 sm:text-[44px]">
          {C.see.title}
        </h2>
        <div className="grid max-w-[1200px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {C.see.cards.map((c, i) => {
            const external = c.href === "PR";
            const inner = (
              <>
                <span className="font-mono text-[12px] text-signal-700">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[19px] font-semibold leading-[1.2]">{c.title}</span>
                <span className="text-[14px] text-foreground/70">{c.text}</span>
              </>
            );
            const cls = `${CARD} flex min-w-0 flex-col gap-2 px-5 py-5 text-foreground no-underline transition-colors hover:border-border-strong hover:text-foreground`;
            return external ? (
              <a key={c.key} href={DEMO_PR_URL} target="_blank" rel="noreferrer" className={cls}>
                {inner}
              </a>
            ) : (
              <Link key={c.key} href={c.href} className={cls}>
                {inner}
              </Link>
            );
          })}
        </div>
      </section>

      <section data-slide className={SLIDE} aria-labelledby="s5">
        <span className={KICKER}>{C.tiers.kicker}</span>
        <h2 id="s5" className="mb-3 mt-3 max-w-[1000px] text-[30px] font-semibold leading-[1.1] tracking-tighter2 sm:text-[44px]">
          {C.tiers.title}
        </h2>
        <p className="mb-6 max-w-[820px] text-[16px] text-foreground/75 sm:text-[18px]">{C.tiers.sub}</p>
        <div className={`${CARD} max-w-[1200px] px-5 py-4`}>
          <TierTable large />
        </div>
      </section>

      <section data-slide className={`${SLIDE} items-start`} aria-labelledby="s6">
        <h2 id="s6" className="sr-only">
          {C.start.title}
        </h2>
        <Link
          href="/story"
          className="inline-flex items-center rounded-md bg-signal-600 px-7 py-4 text-[20px] font-semibold text-white no-underline hover:bg-signal-500 hover:text-white"
        >
          {C.start.button}
        </Link>
        <p className="m-0 mt-8 text-[13px] text-foreground/60">{C.start.footer}</p>
      </section>
    </IntroDeck>
  );
}
