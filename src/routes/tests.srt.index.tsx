import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Target } from "lucide-react";

export const Route = createFileRoute("/tests/srt/")({
  head: () => ({
    meta: [
      { title: "SRT — Mode Selection — ForgeSSB" },
      {
        name: "description",
        content:
          "Choose Practice Mode for step-by-step coaching or Full Simulation for real SSB conditions.",
      },
      { property: "og:title", content: "Situation Reaction Test — ForgeSSB" },
      {
        property: "og:description",
        content: "Practice Mode or Full Simulation. Train the reactive mind.",
      },
    ],
  }),
  component: SrtModePage,
});

function ModeCard({
  to,
  abbr,
  title,
  description,
  bullets,
  icon,
  cta,
}: {
  to: string;
  abbr: string;
  title: string;
  description: string;
  bullets: string[];
  icon: React.ReactNode;
  cta: string;
}) {
  return (
    <Link
      to={to}
      className="group flex h-full flex-col gap-6 border border-border bg-surface-1 p-8 transition-all hover:border-gold hover:bg-surface-2 hover:shadow-[0_12px_40px_-16px_rgba(201,168,76,0.3)]"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center border border-border text-gold transition-colors group-hover:border-gold">
          {icon}
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold/70">
          {abbr}
        </span>
      </div>

      <div className="flex-1 space-y-3">
        <h3 className="font-serif text-3xl text-foreground">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>

      <ul className="space-y-2 border-t border-border/50 pt-5 text-sm text-foreground/80">
        {bullets.map((b) => (
          <li key={b} className="flex gap-3">
            <span className="mt-1.5 h-1 w-1 shrink-0 bg-gold" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2 pt-2 text-xs font-medium uppercase tracking-[0.18em] text-gold/80 transition-colors group-hover:text-gold">
        {cta}
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </div>
    </Link>
  );
}

function SrtModePage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-14 max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">
          Situation Reaction Test
        </p>
        <h1 className="mt-3 font-serif text-5xl text-foreground">Situation Reaction Test</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          60 situations. 30 seconds each. How you react defines your profile.
        </p>
      </div>

      <div className="grid gap-px bg-border md:grid-cols-2">
        <ModeCard
          to="/tests/srt/practice"
          abbr="Practice"
          title="Practice Mode"
          description="Work through situations at your own pace. Get a full OLQ assessment at the end."
          bullets={[
            "Choose 5, 10, 20, 30 or 60 situations",
            "Full OLQ assessment on completion",
            "Timed or untimed — your choice",
          ]}
          icon={<Activity className="h-6 w-6" />}
          cta="Begin Practice"
        />
        <ModeCard
          to="/tests/srt/full/instructions"
          abbr="Simulation"
          title="Full Simulation"
          description="60 situations. 30 seconds each. Your complete assessment at the end."
          bullets={[
            "60 sequential situations",
            "30-second hard timer",
            "Full OLQ assessment report",
          ]}
          icon={<Target className="h-6 w-6" />}
          cta="Read Briefing"
        />
      </div>
    </section>
  );
}
