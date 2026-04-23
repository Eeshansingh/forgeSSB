import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/tests/wat/full/instructions")({
  head: () => ({
    meta: [
      { title: "WAT Full Simulation — Briefing — ForgeSSB" },
      {
        name: "description",
        content:
          "Briefing for the WAT Full Simulation. Rules, timer protocol and OLQ assessment overview.",
      },
    ],
  }),
  component: InstructionsPage,
});

const RULES = [
  "60 words will appear one at a time.",
  "You have 15 seconds per word. Your response is recorded when the timer moves on.",
  "Write a complete sentence — not a single word or phrase.",
  "There is no going back to a previous word.",
  "Your complete OLQ assessment will be ready when you finish.",
];

const OLQ_BRIEF = [
  { name: "Officer-Like Qualities (OLQs)", text: "Fifteen attributes the SSB Board observes — from Effective Intelligence and Initiative to Courage and Determination. Your responses are scored against each." },
  { name: "What we measure", text: "Tone, agency, constructiveness, leadership signals and emotional regulation under load — not vocabulary." },
  { name: "What you receive", text: "A complete OLQ scorecard, response-by-response AI commentary, pattern analysis and prioritised improvement areas." },
];

const OLQ_EXPLAINER = [
  {
    q: "What are OLQs?",
    a: "Officer-Like Qualities are fifteen psychological attributes that the Services Selection Board uses to evaluate whether a candidate has the potential to lead soldiers under pressure. They were developed from decades of military psychology research and cover the full spectrum of effective leadership — from raw cognitive ability and decisiveness to social cohesion and physical courage.",
  },
  {
    q: "Why does the SSB use them?",
    a: "The SSB needs a consistent, bias-resistant framework that works across five days and four test formats. OLQs give assessors a shared vocabulary: rather than \"he seemed confident,\" they record a score against Self Confidence. This lets different assessors compare notes precisely and spot candidates who perform well under structured pressure but collapse in unstructured tasks — or vice versa.",
  },
  {
    q: "How does the AI score your WAT responses?",
    a: "Each word-association response is a micro-sample of your instinctive thought. The AI reads the tone (agency vs. helplessness), action orientation (constructive vs. passive), social signals (inclusive vs. isolating), and emotional register (regulated vs. reactive). Patterns across all responses are then mapped to each OLQ. A response like \"Fear → Face it head-on\" scores differently on Courage and Self Confidence than \"Fear → Avoid when possible\" — even though both are grammatically complete.",
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
          A word will appear on screen. You have 15 seconds to write the first complete sentence that comes to mind. Your honest reaction — not the best answer. That is what the Board reads. Do not overthink it.
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
            to="/tests/wat/full/setup"
            className="inline-flex items-center gap-3 border border-gold bg-gold/10 px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] text-gold transition-all hover:bg-gold hover:text-primary-foreground"
          >
            I Am Ready — Commence Assessment →
          </Link>
          <Link
            to="/tests/wat"
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
          >
            ← Stand Down
          </Link>
        </div>
      </div>
    </section>
  );
}
