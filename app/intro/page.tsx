import Link from "next/link";
import { Inline } from "@/components/Markdown";
import { TierTable } from "@/components/TierTable";
import { IntroDeck } from "@/components/intro/IntroDeck";
import { loadIntro } from "@/lib/content";
import { INTRO_FIGS } from "@/lib/copy";
import { int, pct } from "@/lib/format";
import { DEMO_PR_URL } from "@/lib/introCopy";
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
      <span className="text-[14px] text-foreground/70"><Inline>{label}</Inline></span>
    </div>
  );
}

export default async function IntroPage() {
  const C = loadIntro();
  const counts = await source.headlineCounts();
  const rate = counts.fraud / counts.labeled;

  return (
    <IntroDeck>
      <section data-slide data-xray="situation" className={SLIDE} aria-labelledby="s1">
        <span className={KICKER}><Inline>{C.situation.kicker}</Inline></span>
        <h1 id="s1" className="mb-10 mt-3 max-w-[1000px] text-[32px] font-semibold leading-[1.08] tracking-tighter2 text-pretty sm:text-[52px]">
          <Inline>{C.situation.title}</Inline>
        </h1>
        <div className="mb-8 grid max-w-[1000px] grid-cols-1 gap-5 sm:grid-cols-3">
          <Big value={int(counts.fraud)} label={C.situation.label_fraud} />
          <Big value={INTRO_FIGS.clusterValue} label={INTRO_FIGS.clusterLabel} />
          <Big value={pct(rate, 2)} label={C.situation.label_rate} />
        </div>
        <p className="m-0 text-[22px] font-medium text-signal-800 sm:text-[28px]"><Inline>{C.situation.closer}</Inline></p>
      </section>

      <section data-slide data-xray="tension" className={SLIDE} aria-labelledby="s2">
        <span className={KICKER}><Inline>{C.tension.kicker}</Inline></span>
        <h2 id="s2" className="mb-8 mt-3 max-w-[900px] text-[30px] font-semibold leading-[1.1] tracking-tighter2 sm:text-[44px]">
          <Inline>{C.tension.title}</Inline>
        </h2>
        <div className="grid max-w-[1100px] grid-cols-1 gap-5 md:grid-cols-2">
          {[
            { role: C.tension.fraud_role, line: C.tension.fraud_line },
            { role: C.tension.cio_role, line: C.tension.cio_line },
          ].map((p) => (
            <div key={p.role} className={`${CARD} flex flex-col gap-3 px-6 py-6`}>
              <span className="text-[12px] uppercase tracking-kicker text-foreground/60"><Inline>{p.role}</Inline></span>
              <p className="m-0 text-[22px] font-medium leading-[1.25] text-pretty sm:text-[26px]">&ldquo;<Inline>{p.line}</Inline>&rdquo;</p>
            </div>
          ))}
        </div>
        <div className="mt-5 max-w-[1100px] rounded-xl border border-signal-400 bg-signal-100 px-6 py-5">
          <span className="text-[12px] font-semibold uppercase tracking-kicker text-signal-700"><Inline>{C.tension.apra_label}</Inline></span>
          <p className="m-0 mt-2 text-[18px] leading-[1.4] text-pretty sm:text-[22px]">&ldquo;<Inline>{C.tension.apra_quote}</Inline>&rdquo;</p>
          <p className="m-0 mt-2 text-[13px] text-foreground/70"><Inline>{C.tension.apra_cite}</Inline></p>
        </div>
      </section>

      <section data-slide data-xray="thesis" className={SLIDE} aria-labelledby="s3">
        <span className={KICKER}><Inline>{C.thesis.kicker}</Inline></span>
        <h2 id="s3" className="mb-6 mt-3 max-w-[1200px] text-[36px] font-semibold leading-[1.05] tracking-tightest text-pretty sm:text-[60px]">
          <Inline>{C.thesis.title}</Inline>
        </h2>
        <p className="m-0 max-w-[820px] text-[18px] text-foreground/80 text-pretty sm:text-[24px]"><Inline>{C.thesis.sub}</Inline></p>
      </section>

      <section data-slide className={SLIDE} aria-labelledby="s4">
        <span className={KICKER}><Inline>{C.see.kicker}</Inline></span>
        <h2 id="s4" className="mb-8 mt-3 text-[30px] font-semibold tracking-tighter2 sm:text-[44px]">
          <Inline>{C.see.title}</Inline>
        </h2>
        <div className="grid max-w-[1200px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {C.seeCards.map((c, i) => {
            const external = c.href === "PR";
            const inner = (
              <>
                <span className="font-mono text-[12px] text-signal-700">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[19px] font-semibold leading-[1.2]"><Inline>{c.title}</Inline></span>
                <span className="text-[14px] text-foreground/70"><Inline>{c.text}</Inline></span>
                {/* The platform value behind the screen; pinned to the card bottom so the four line up. */}
                <span className="mt-auto flex flex-col gap-1 border-t border-border pt-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-signal-700"><Inline>{C.see.vercel_label}</Inline></span>
                  <span className="min-h-[5.8em] text-[14px] leading-[1.45] text-foreground/90"><Inline>{c.vercel}</Inline></span>
                </span>
              </>
            );
            // Cards 01 and 02 are told to the Head of Fraud, 03 and 04 to the CIO (x-ray stops 4 and 5).
            const cls = `${CARD} flex min-w-0 flex-col gap-2 px-5 py-5 text-foreground no-underline transition-colors hover:border-border-strong hover:text-foreground`;
            return external ? (
              <a key={c.key} href={DEMO_PR_URL} target="_blank" rel="noreferrer" className={cls} data-xray={i < 2 ? "cards-fraud" : "cards-cio"}>
                {inner}
              </a>
            ) : (
              <Link key={c.key} href={c.href} className={cls} data-xray={i < 2 ? "cards-fraud" : "cards-cio"}>
                {inner}
              </Link>
            );
          })}
        </div>
      </section>

      <section data-slide data-xray="tiers-intro" className={SLIDE} aria-labelledby="s5">
        <span className={KICKER}><Inline>{C.tiers.kicker}</Inline></span>
        <h2 id="s5" className="mb-3 mt-3 max-w-[1000px] text-[30px] font-semibold leading-[1.1] tracking-tighter2 sm:text-[44px]">
          <Inline>{C.tiers.title}</Inline>
        </h2>
        <p className="mb-6 max-w-[820px] text-[16px] text-foreground/75 sm:text-[18px]"><Inline>{C.tiers.sub}</Inline></p>
        <div className={`${CARD} max-w-[1200px] px-5 py-4`}>
          <TierTable large />
        </div>
      </section>

      <section data-slide className={`${SLIDE} items-start`} aria-labelledby="s6">
        <h2 id="s6" className="sr-only">
          <Inline>{C.start.title}</Inline>
        </h2>
        <Link
          href="/story"
          data-xray="start"
          className="inline-flex items-center rounded-md bg-signal-600 px-7 py-4 text-[20px] font-semibold text-white no-underline hover:bg-signal-500 hover:text-white"
        >
          <Inline>{C.start.button}</Inline>
        </Link>
        <p className="m-0 mt-8 text-[13px] text-foreground/60"><Inline>{C.start.footer}</Inline></p>
      </section>
    </IntroDeck>
  );
}
