import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/tests/srt/full/instructions")({
  head: () => ({
    meta: [
      { title: "SRT Full Simulation — Briefing — ForgeSSB" },
      {
        name: "description",
        content:
          "Briefing for the SRT Full Simulation. Rules, timer protocol and OLQ assessment overview.",
      },
    ],
  }),
  component: InstructionsPage,
});

const RULES = [
  "60 situations will appear one at a time.",
  "You have 30 seconds per situation.",
  "Write what you would actually do — practical, decisive, in your own words.",
  "There is no going back.",
  "Your complete OLQ assessment will be ready when you finish.",
];

const OLQ_BRIEF = [
  {
    name: "Officer-Like Qualities (OLQs)",
    text: "Fifteen attributes the SSB Board observes — from Effective Intelligence and Initiative to Courage and Determination. Your reactions to each situation are scored against all fifteen.",
  },
  {
    name: "What we measure",
    text: "Whether you ACT or OBSERVE. Whether your response is practical or theoretical. Whether you show initiative, moral courage, decisiveness, and concern for others — not just yourself.",
  },
  {
    name: "What you receive",
    text: "A complete OLQ scorecard, full behavioural pattern analysis across all situations, identification of your dominant response style, and prioritised improvement areas.",
  },
];

const OLQ_EXPLAINER = [
  {
    q: "What are OLQs?",
    a: "Officer-Like Qualities are fifteen psychological attributes that the Services Selection Board uses to evaluate whether a candidate has the potential to lead soldiers under pressure. They were developed from decades of military psychology research and cover the full spectrum of effective leadership — from raw cognitive ability and decisiveness to social cohesion and physical courage.",
  },
  {
    q: "Why does the SSB use SRT?",
    a: "SRT bypasses rehearsed answers. When faced with a real situation under time pressure, candidates reveal how they actually think — not how they want to be seen. The SSB uses SRT alongside WAT and TAT to triangulate personality across different formats. A candidate who writes well in WAT but freezes or hedges in SRT reveals a gap between aspiration and instinct.",
  },
  {
    q: "How does the AI score your SRT responses?",
    a: "Each situation response is analysed for action-orientation (do you act or observe?), practicality (is your solution achievable by a real person?), moral consistency (do you do the right thing when it costs something?), and team orientation (do you think of others, not just yourself?). These signals map to each of the 15 OLQs. A response like 'I will assess the situation and decide' scores differently on Speed of Decision than 'I immediately take charge and direct others to their positions' — even if both are grammatically correct.",
  },
];

function InstructionsPage() {
  return (
    <section className="relative">
      <div className="absolute inset-0 grid-texture-fine opacity-60" aria-hidden="true" />
      <div className="relative mx-auto max-w-3xl px-6 py-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">
          Full Simulation
        </p>
        <h1 className="mt-3 font-serif text-5xl text-foreground">Briefing</h1>
        <div className="mt-6 h-px w-20 bg-gold/50" />

        <p className="mt-8 text-base leading-relaxed text-foreground/80">
          A situation will appear. You have 30 seconds. Write what you would do — two to three lines, practical and decisive. The Board wants to see how you think, not what sounds right.
        </p>

        <div className="mt-12">
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-gold">
            § Protocol
          </h2>
          <ol className="mt-5 space-y-4">
            {RULES.map((r, i) => (
              <li
                key={i}
                className="flex gap-5 border-l border-gold/30 bg-surface-1/40 p-5"
              >
                <span className="font-mono text-sm text-gold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm leading-relaxed text-foreground/85">{r}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-14">
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-gold">
            § Assessment
          </h2>
          <div className="mt-5 space-y-4">
            {OLQ_BRIEF.map((o) => (
              <div key={o.name} className="border border-border bg-surface-1 p-5">
                <h3 className="font-serif text-lg text-foreground">{o.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{o.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14">
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-gold">
            § Understanding OLQs
          </h2>
          <div className="mt-5 space-y-4">
            {OLQ_EXPLAINER.map((item) => (
              <div key={item.q} className="border border-border bg-surface-1 p-5">
                <h3 className="font-serif text-lg text-foreground">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center gap-4 border-t border-border pt-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            By proceeding you accept the conditions of assessment
          </p>
          <Link
            to="/tests/srt/full/setup"
            className="inline-flex items-center gap-3 border border-gold bg-gold/10 px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] text-gold transition-all hover:bg-gold hover:text-primary-foreground"
          >
            I Am Ready — Commence Assessment →
          </Link>
          <Link
            to="/tests/srt"
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
          >
            ← Stand Down
          </Link>
        </div>
      </div>
    </section>
  );
}
