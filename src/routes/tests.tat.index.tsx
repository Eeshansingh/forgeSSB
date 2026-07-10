import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/tests/tat/")({
  head: () => ({
    meta: [
      { title: "Thematic Apperception Test — Coming Soon — ForgeSSB" },
      {
        name: "description",
        content: "The heaviest-weighted psych test on Day 2. Twelve pictures, twelve stories, one pattern.",
      },
    ],
  }),
  component: TatPage,
});

const STRUCTURE = [
  { n: "01", label: "Background", body: "What led to this moment", accent: false },
  { n: "02", label: "Situation", body: "What is happening — read the picture", accent: false },
  { n: "03", label: "Outcome ← most weight", body: "How your hero resolved it", accent: true, note: "How your hero begins matters more than how he ends." },
];

const RULES = [
  "Write in past tense. Named hero, your age and sex.",
  "Hero takes methodical action — plans, executes, achieves.",
  "Successful resolution always. No tragic endings.",
  "Don't force military settings. Everyday scenarios are fine.",
  "Group involvement where possible — not a lone wolf.",
  "Realistic challenges only. No superhuman feats.",
];

function TatPage() {
  return (
    <div>
      <div className="mx-auto max-w-4xl px-6 pt-6">
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
          Tests · <span className="text-gold">Thematic Apperception Test</span>
        </p>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center sm:py-20">
        <div className="mb-7 inline-flex items-center gap-2 border border-gold px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          <span className="whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.2em] text-gold">Coming Soon</span>
        </div>
        <p className="mb-3.5 font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground">Psychology · SSB Day 2</p>
        <h1 className="font-serif text-[38px] font-bold leading-[1.04] text-foreground sm:text-[58px]">
          Thematic Apperception Test
        </h1>
        <p className="mt-2.5 font-mono text-[11px] uppercase tracking-[0.26em] text-gold">TAT</p>
        <p className="mx-auto mt-6 max-w-[52ch] text-base leading-relaxed text-muted-foreground">
          The heaviest-weighted psych test on Day 2. The psychologist reads your hero as you — twelve pictures,
          twelve stories, one pattern.
        </p>
        <div className="mt-10 inline-flex flex-wrap justify-center gap-8">
          <Stat label="Format" value="12 pictures" note="11 scenes + 1 blank" />
          <div className="w-px bg-border" />
          <Stat label="Per picture" value="30s + 4min" note="View then write" />
          <div className="w-px bg-border" />
          <Stat label="Total" value="~60 min" note="Heaviest weight" />
        </div>
      </section>

      {/* Structure */}
      <section className="border-y border-border bg-surface-1 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="mb-6 text-center font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
            Every story · same structure
          </p>
          <div className="mb-7 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {STRUCTURE.map((s) => (
              <div key={s.n} className={`border-t-2 pt-3.5 ${s.accent ? "border-gold" : "border-gold/30"}`}>
                <span className={`font-mono text-[9px] uppercase tracking-[0.18em] ${s.accent ? "text-gold" : "text-muted-foreground"}`}>
                  {s.n} · {s.label}
                </span>
                <p className="mt-2 text-sm leading-relaxed text-foreground">{s.body}</p>
                {s.note && <p className="mt-1 text-xs italic leading-relaxed text-muted-foreground">{s.note}</p>}
              </div>
            ))}
          </div>
          <div className="mx-auto max-w-xl border-t border-border/60 pt-5 text-center">
            <p className="font-serif text-lg italic leading-relaxed text-foreground">
              "Your hero is how the psychologist sees you. One story does not decide anything. The pattern across
              all twelve does."
            </p>
          </div>
        </div>
      </section>

      {/* Rules */}
      <section className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <p className="mb-5 font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground">Story rules</p>
        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          {RULES.map((r) => (
            <div key={r} className="flex items-start gap-2.5 border-b border-border/60 py-2.5">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
              <span className="text-[13.5px] leading-relaxed text-foreground">{r}</span>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-2.5 py-2.5">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full border border-muted-foreground" />
          <span className="text-[13.5px] italic leading-relaxed text-muted-foreground">
            Blank picture (12th): commit to a vivid scene fast. Hesitation signals weak imagination.
          </span>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="relative border border-gold bg-surface-1 p-6 sm:p-9">
          <div className="absolute -top-px left-0 right-0 h-0.5 bg-gradient-to-r from-gold to-gold/20" />
          <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.28em] text-gold">What to practice now</p>
          <p className="mb-6 max-w-[56ch] text-sm leading-relaxed text-foreground">
            WAT and SRT are available now. Both build the same instincts TAT will test. A good place to start.
          </p>
          <div className="mb-6 flex flex-wrap gap-2.5">
            <Link
              to="/tests/wat"
              className="inline-flex items-center gap-2 bg-gold px-6 py-3.5 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-[#0A0E0A] no-underline"
            >
              WAT — Start now →
            </Link>
            <Link
              to="/tests/srt"
              className="inline-flex items-center gap-2 border border-border px-6 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground no-underline"
            >
              SRT — Start now →
            </Link>
          </div>
          <div className="border-t border-border pt-5">
            <p className="mb-2 font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
              TAT is part of the 30-day journey
            </p>
            <p className="mb-3 max-w-[56ch] text-xs leading-relaxed text-muted-foreground">
              Sessions 22, 23 and 26 include simulated psych days with TAT integrated once it ships.
            </p>
            <Link to="/pricing" className="font-mono text-[9px] uppercase tracking-[0.14em] text-gold no-underline">
              View 30-day journey →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div>
      <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="font-serif text-2xl font-bold text-gold">{value}</p>
      <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">{note}</p>
    </div>
  );
}
