import { createFileRoute, Link } from "@tanstack/react-router";
import { ModuleCard } from "@/components/ModuleCard";
import { Brain, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { JourneyCTA } from "@/components/JourneyCTA";
import { weeklyAspirantCount, weeklyTopScore } from "@/lib/hero-stats";

const HERO_PREVIEW_OLQS = [
  { name: "Cooperation", score: 79, tone: "text-success" },
  { name: "Determination", score: 78, tone: "text-success" },
  { name: "Speed of Decision", score: 55, tone: "text-gold" },
  { name: "Power of Expression", score: 52, tone: "text-gold" },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ForgeSSB — AI-powered SSB preparation" },
      {
        name: "description",
        content:
          "Train for SSB with real-time AI feedback on WAT, TAT, SRT and more. Built for Indian defence aspirants.",
      },
      { property: "og:title", content: "ForgeSSB — Forged Under Pressure" },
      {
        property: "og:description",
        content: "AI-powered SSB preparation for those who serve.",
      },
    ],
  }),
  component: LandingPage,
});

const HOW_IT_WORKS = [
  {
    n: "01",
    h: "Write",
    p: "A word (or situation) appears. You have 15–30 seconds. Write the first complete sentence that comes to mind — your honest instinct, not the \"best\" answer.",
  },
  {
    n: "02",
    h: "Analyse",
    p: "The AI reads tone, agency, action-orientation and social signals across all your responses. Each one maps to OLQs. Patterns form across the set.",
  },
  {
    n: "03",
    h: "Know",
    p: "You get a composite OLQ score, your top strengths, your focus areas, and the one pattern to fix first — with the exact response evidence behind it.",
  },
];

function LandingPage() {
  const aspirantCount = weeklyAspirantCount();
  const topScore = weeklyTopScore();

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 grid-texture opacity-60" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" aria-hidden="true" />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,168,76,0.08),transparent_60%)]"
          aria-hidden="true"
        />

        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-10 px-6 py-16 sm:py-20 lg:flex-row lg:py-24">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">
                Free · 10 words · 2 minutes
              </span>
            </div>

            <h1 className="mt-5 font-serif text-4xl font-semibold leading-[1.05] text-balance sm:text-6xl">
              Find out what the SSB board sees in you.
            </h1>

            <p className="mt-6 max-w-[46ch] text-balance text-base leading-relaxed text-foreground/80 sm:text-lg">
              Write one sentence per word. Our AI maps 15 Officer-Like Qualities from your instinctive responses —
              the same framework the Board uses.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/tests"
                className="inline-flex items-center justify-center gap-2 border border-gold bg-gold px-7 py-3.5 text-sm font-medium uppercase tracking-[0.18em] text-[#0A0E0A] transition-all hover:opacity-90"
              >
                Start free assessment →
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center gap-2 border border-border px-7 py-3.5 text-sm font-medium uppercase tracking-[0.18em] text-foreground/80 transition-all hover:border-foreground/40 hover:text-foreground"
              >
                Start 30-Day Journey · ₹300
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[11px] tracking-[0.08em] text-muted-foreground">
              <span>
                <span className="text-gold">{aspirantCount.toLocaleString()}</span> aspirants tested this week
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">NDA · CDS · AFCAT · TA</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">
                Top score this week: <span className="text-gold">{topScore}</span>
              </span>
            </div>
          </div>

          <div className="hidden w-[320px] shrink-0 border border-gold bg-surface-1 lg:block">
            <div className="border-b border-border bg-gold/5 px-4 py-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-gold">Your result · 2 min from now</p>
            </div>
            <div className="p-4">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-5xl font-bold leading-none text-gold">64</span>
                <span className="font-mono text-[11px] text-muted-foreground">/ 100 · Top 29%</span>
              </div>
              <p className="mt-2.5 font-mono text-[9px] uppercase tracking-[0.12em] text-success">Strong Recommended</p>

              <div className="mt-4 flex flex-col gap-2.5">
                {HERO_PREVIEW_OLQS.map((o) => (
                  <div key={o.name}>
                    <div className="mb-1 flex justify-between">
                      <span className="text-[11px] text-foreground">{o.name}</span>
                      <span className={`font-mono text-[10px] ${o.tone}`}>{o.score}</span>
                    </div>
                    <div className="h-0.5 bg-border">
                      <div className={`h-full ${o.tone === "text-success" ? "bg-success" : "bg-gold"} opacity-70`} style={{ width: `${o.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-l-2 border-gold/40 pl-2.5">
                <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-gold">Pattern identified</p>
                <p className="mt-1 font-serif text-xs italic leading-relaxed text-foreground">
                  "You hedge under time pressure — the instinct is sound."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-border/40 px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="mb-8 font-mono text-[11px] uppercase tracking-[0.35em] text-gold">How it works · 3 steps</p>
          <div className="grid grid-cols-1 gap-9 sm:grid-cols-3">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.n}>
                <div className="mb-2.5 flex items-center gap-3">
                  <span className="font-mono text-[26px] font-bold leading-none text-gold/40">{s.n}</span>
                  <span className="font-serif text-lg text-foreground">{s.h}</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-10">
          <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-gold">The tests</p>
          <h2 className="mt-2.5 font-serif text-4xl text-foreground">The three psychology tests</h2>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Practice under real conditions. After every session, see which qualities to focus on.
          </p>
        </div>

        <div className="grid gap-px bg-border sm:grid-cols-3">
          <ModuleCard
            name="Word Association Test"
            abbreviation="WAT"
            description="One word. Fifteen seconds. Sixty rounds."
            icon={<Brain className="h-5 w-5" />}
            to="/tests/wat"
          />
          <ModuleCard
            name="Situation Reaction Test"
            abbreviation="SRT"
            description="60 situations. 30 seconds each."
            icon={<AlertTriangle className="h-5 w-5" />}
            to="/tests/srt"
          />
          <ModuleCard
            name="Thematic Apperception Test"
            abbreviation="TAT"
            description="12 pictures. 12 stories. Heaviest-weighted psych test."
            icon={<ImageIcon className="h-5 w-5" />}
            to="/tests/tat"
            locked
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-b border-border py-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50">
            Also coming: GTO tasks, Personal Interview, Self Description
          </p>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-gold">TAT is coming next</span>
        </div>
      </section>

      {/* 30-DAY JOURNEY CTA */}
      <JourneyCTA />

      {/* DOCTRINE */}
      <section className="border-t border-border/60 bg-surface-1/40">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-3">
          {[
            {
              n: "I",
              h: "Real Conditions",
              p: "Timers, sequencing and pressure modelled on actual SSB protocols. The board does not slow down for you.",
            },
            {
              n: "II",
              h: "Officer-Like Qualities",
              p: "Fifteen attributes the Board scores after every simulation. You see exactly where you stand.",
            },
            {
              n: "III",
              h: "Forged, Not Drilled",
              p: "Pattern analysis identifies blind spots. Each session builds on the last — a training programme, not a test bank.",
            },
          ].map((b) => (
            <div key={b.n} className="border-l border-gold/30 pl-6">
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-gold">
                Doctrine {b.n}
              </p>
              <h3 className="mt-3 font-serif text-2xl text-foreground">{b.h}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{b.p}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
