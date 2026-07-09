import { Link } from "@tanstack/react-router";

type Props = {
  olqScores: { name: string; score: number }[];
};

export function PracticeTab({ olqScores }: Props) {
  const sorted = [...olqScores].sort((a, b) => a.score - b.score);

  return (
    <div>
      <div className="mb-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold">Practice Zone</p>
        <h2 className="mt-1.5 font-serif text-[26px] font-bold tracking-tight text-foreground">Practice at your own pace</h2>
        <p className="mt-2 max-w-[64ch] text-[13px] leading-relaxed text-muted-foreground">
          Each response is scored right away. You see which qualities it shows and what to work on.
        </p>
      </div>

      <div className="mb-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          to="/tests/wat/practice"
          className="flex min-h-[150px] flex-col justify-between gap-5 border border-gold bg-gradient-to-br from-gold/10 to-surface-1 p-5 no-underline"
        >
          <div>
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-gold">Word Association · WAT</p>
            <p className="mb-1.5 font-serif text-xl font-bold leading-tight text-foreground">Start a WAT set</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              A word every 15 seconds. Do as many as you want, stop anytime. Each response is scored right away.
            </p>
          </div>
          <span className="inline-flex w-fit items-center bg-gold px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#0A0E0A]">
            Begin →
          </span>
        </Link>
        <Link
          to="/tests/srt/practice"
          className="flex min-h-[150px] flex-col justify-between gap-5 border border-gold bg-gradient-to-br from-gold/10 to-surface-1 p-5 no-underline"
        >
          <div>
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-gold">Situation Reaction · SRT</p>
            <p className="mb-1.5 font-serif text-xl font-bold leading-tight text-foreground">Start an SRT set</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              A situation every 30 seconds. As many as you like. Feedback on every reaction you write.
            </p>
          </div>
          <span className="inline-flex w-fit items-center bg-gold px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#0A0E0A]">
            Begin →
          </span>
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <TrustChip label="Scored after every response" />
        <TrustChip label="Builds your progress over time" />
        <TrustChip label="Practice as many times as you like" />
      </div>

      {/* TAT coming soon */}
      <div className="relative mb-6 border border-white/10 bg-surface-1 p-5">
        <span className="absolute right-4 top-4 border border-gold/40 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-gold">
          Coming soon
        </span>
        <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
          Thematic Apperception Test · TAT · SSB Day 2
        </p>
        <p className="mb-2 font-serif text-xl font-bold text-foreground">12 pictures. 12 stories.</p>
        <p className="mb-4 max-w-[62ch] text-[13px] leading-relaxed text-muted-foreground">
          The heaviest-weighted psych test on Day 2. Patterns across all 12 stories matter more than any single one.
        </p>
        <Link to="/tests/tat" className="font-mono text-[10px] uppercase tracking-[0.14em] text-gold no-underline">
          Learn more →
        </Link>
      </div>

      {/* All 15 OLQs — tap to launch a targeted Drill */}
      <div className="mb-2.5 flex items-baseline justify-between">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Your 15 qualities</p>
        <span className="font-mono text-[9px] text-muted-foreground">weakest first</span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {sorted.map((o, i) => (
          <Link
            key={o.name}
            to="/tests/drill"
            search={{ olq: o.name }}
            className={`flex items-center justify-between border px-3.5 py-3 no-underline transition-colors ${
              i < 3 ? "border-gold/50 hover:border-gold" : "border-border hover:border-gold/40"
            }`}
          >
            <span className="text-xs text-foreground">{o.name}</span>
            <span className={`font-serif text-base font-bold ${i < 3 ? "text-gold" : "text-foreground"}`}>{o.score}</span>
          </Link>
        ))}
      </div>
      <p className="mt-3 font-mono text-[9px] text-muted-foreground">Tap a quality to start a targeted drill</p>
    </div>
  );
}

function TrustChip({ label }: { label: string }) {
  return (
    <span className="border border-border/60 px-2.5 py-1.5 font-mono text-[9px] text-muted-foreground">
      <span className="text-success">✓</span> {label}
    </span>
  );
}
