import { createFileRoute, Link } from "@tanstack/react-router";
import { ModuleCard } from "@/components/ModuleCard";
import { StarMark } from "@/components/StarMark";
import {
  Brain,
  Image as ImageIcon,
  AlertTriangle,
  Users,
  MessageSquare,
  ScrollText,
} from "lucide-react";

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

function LandingPage() {
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

        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center px-6 py-20 text-center">
          <div className="text-gold">
            <StarMark size={56} />
          </div>

          <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.4em] text-gold/80">
            Services Selection Board · Preparation
          </p>

          <h1 className="mt-6 font-serif text-6xl font-semibold leading-[0.95] text-balance sm:text-7xl md:text-8xl">
            <span className="text-gold">Forge</span>
            <span className="text-foreground">SSB</span>
          </h1>

          <div className="mt-8 h-px w-24 bg-gold/50" />

          <p className="mt-8 max-w-xl text-balance text-base leading-relaxed text-foreground/80 sm:text-lg">
            AI-powered preparation for those who serve. Train your psyche under live
            assessment conditions and earn the bars.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              to="/tests"
              className="inline-flex items-center gap-2 border border-gold bg-gold/5 px-7 py-3.5 text-sm font-medium uppercase tracking-[0.18em] text-gold transition-all hover:bg-gold hover:text-primary-foreground"
            >
              Commence Training →
            </Link>
            <Link
              to="/tests"
              className="inline-flex items-center gap-2 border border-border px-7 py-3.5 text-sm font-medium uppercase tracking-[0.18em] text-foreground/80 transition-all hover:border-foreground/40 hover:text-foreground"
            >
              View All Modules
            </Link>
          </div>

          <div className="mt-16 flex items-center gap-8 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            <span>· Officer-grade analysis</span>
            <span className="hidden sm:inline">· Real SSB conditions</span>
            <span className="hidden md:inline">· OLQ scoring</span>
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">
              Section I
            </p>
            <h2 className="mt-3 font-serif text-4xl text-foreground">Assessment Modules</h2>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Six pillars of the Services Selection Board. Begin with the Word
              Association Test — additional modules deploy in sequence.
            </p>
          </div>
        </div>

        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
          <ModuleCard
            name="Word Association Test"
            abbreviation="WAT"
            description="60 stimulus words. 15 seconds each. Reveal the spontaneous mind."
            icon={<Brain className="h-5 w-5" />}
            to="/tests/wat"
          />
          <ModuleCard
            name="Thematic Apperception Test"
            abbreviation="TAT"
            description="Construct narratives from ambiguous imagery. Assess imagination and intent."
            icon={<ImageIcon className="h-5 w-5" />}
            locked
          />
          <ModuleCard
            name="Situation Reaction Test"
            abbreviation="SRT"
            description="60 real-world scenarios. Demonstrate judgement under pressure."
            icon={<AlertTriangle className="h-5 w-5" />}
            to="/tests/srt"
          />
          <ModuleCard
            name="Group Testing Tasks"
            abbreviation="GTO"
            description="Group discussion, planning exercise and progressive group tasks."
            icon={<Users className="h-5 w-5" />}
            locked
          />
          <ModuleCard
            name="Personal Interview"
            abbreviation="IO"
            description="One-on-one with the Interviewing Officer. AI-simulated questioning."
            icon={<MessageSquare className="h-5 w-5" />}
            locked
          />
          <ModuleCard
            name="Self Description"
            abbreviation="SD"
            description="Five lenses on character: parents, teachers, friends, peers, self."
            icon={<ScrollText className="h-5 w-5" />}
            locked
          />
        </div>
      </section>

      {/* DOCTRINE */}
      <section className="border-t border-border/60 bg-surface-1/40">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-3">
          {[
            {
              n: "I",
              h: "Real Conditions",
              p: "Timers, sequencing and pressure modelled on actual SSB protocols.",
            },
            {
              n: "II",
              h: "Officer-Like Qualities",
              p: "Fifteen OLQs scored after every full simulation. See where you stand.",
            },
            {
              n: "III",
              h: "Forged, Not Drilled",
              p: "Pattern analysis identifies blind spots. Each session sharpens the next.",
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
