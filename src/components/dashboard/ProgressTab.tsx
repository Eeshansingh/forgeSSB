import { useState } from "react";

export type OlqMovement = { name: string; baseline: number; current: number; delta: number };
export type PhaseCard = { name: string; start: number; end: number; status: "done" | "current" | "upcoming"; avgDelta: number | null };

type Props = {
  dayN: number;
  compBase: number;
  compNow: number;
  movers: OlqMovement[];
  phases: PhaseCard[];
  rank: { rank: number; total: number } | null;
};

export function ProgressTab({ dayN, compBase, compNow, movers, phases, rank }: Props) {
  const [expanded, setExpanded] = useState(false);
  const compDelta = compNow - compBase;
  const sorted = [...movers].sort((a, b) => b.delta - a.delta);
  const topGains = sorted.slice(0, 3);
  const stillDeveloping = [...movers].sort((a, b) => a.delta - b.delta).slice(0, 3);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold">Progress</p>
          <h2 className="mt-1.5 font-serif text-[26px] font-bold tracking-tight text-foreground">How far you've moved</h2>
        </div>
        {rank && (
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Journey rank <span className="text-gold">#{rank.rank}</span> of {rank.total}
          </p>
        )}
      </div>

      {/* Composite hero */}
      <div className="mb-3.5 border border-border bg-surface-1 p-5">
        <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Composite · since Day 1 calibration</p>
          <p className="font-mono text-[9px] text-muted-foreground">{dayN} sessions</p>
        </div>
        <div className="mb-1 flex items-baseline gap-2.5">
          <span className="font-serif text-[44px] font-bold leading-none text-gold">{compNow}</span>
          {compDelta !== 0 && (
            <span className="font-mono text-xs text-success">
              {compDelta > 0 ? "+" : ""}
              {compDelta} from {compBase}
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between font-mono text-[8px] text-muted-foreground">
          <span>DAY 1 · {compBase}</span>
          <span>DAY {dayN} · {compNow}</span>
        </div>
        <div className="mt-1.5 h-[3px] bg-border">
          <div className="h-full bg-gold" style={{ width: `${Math.max(2, compNow)}%` }} />
        </div>
      </div>

      {/* OLQ movement */}
      <div className="mb-3.5 border border-border bg-surface-1 p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">OLQ movement</p>
          <button type="button" onClick={() => setExpanded((v) => !v)} className="font-mono text-[9px] uppercase tracking-[0.12em] text-gold">
            {expanded ? "Show summary" : "See all 15"}
          </button>
        </div>
        {!expanded ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <MoverList label="▲ Top gains" tone="text-success" items={topGains} />
            <MoverList label="◆ Still developing" tone="text-gold" items={stillDeveloping} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2">
            {sorted.map((o) => (
              <MoverRow key={o.name} o={o} />
            ))}
          </div>
        )}
      </div>

      {/* Phase strip */}
      <div className="mb-3.5 border border-border bg-surface-1 p-5">
        <p className="mb-3.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Your progress</p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {phases.map((ph) => (
            <div
              key={ph.name}
              className={`p-3 ${ph.status === "current" ? "border border-gold bg-gold/5" : "border border-border/60"}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className={`font-serif text-sm ${ph.status === "upcoming" ? "text-muted-foreground" : "text-foreground"}`}>{ph.name}</span>
                {ph.status === "done" && <span className="text-[10px] text-success">✓</span>}
              </div>
              <p className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground">
                S{ph.start}–{ph.end}
              </p>
              <div className="h-[3px] bg-border">
                <div
                  className={ph.status === "upcoming" ? "h-full bg-border" : "h-full bg-gold"}
                  style={{ width: ph.status === "done" ? "100%" : ph.status === "current" ? "45%" : "0%" }}
                />
              </div>
              {ph.avgDelta !== null && (
                <p className="mt-1.5 font-mono text-[9px] text-success">+{ph.avgDelta}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* TAT banner */}
      <div className="flex items-center justify-between gap-4 border border-white/[0.07] p-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">TAT · Thematic Apperception Test</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">Story scores and Day 2 psych analysis will appear here once TAT launches.</p>
        </div>
        <span className="shrink-0 whitespace-nowrap border border-gold/40 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-gold">
          Coming soon
        </span>
      </div>
    </div>
  );
}

function MoverList({ label, tone, items }: { label: string; tone: string; items: OlqMovement[] }) {
  return (
    <div>
      <p className={`mb-3 font-mono text-[8px] uppercase tracking-[0.16em] ${tone}`}>{label}</p>
      <div className="flex flex-col gap-3">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">Not enough data yet.</p>
        ) : (
          items.map((o) => <MoverRow key={o.name} o={o} />)
        )}
      </div>
    </div>
  );
}

function MoverRow({ o }: { o: OlqMovement }) {
  return (
    <div>
      <div className="mb-1 flex justify-between">
        <span className="text-xs text-foreground">{o.name}</span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {o.baseline}→{o.current} <span className={o.delta > 0 ? "text-success" : "text-muted-foreground"}>{o.delta > 0 ? `+${o.delta}` : o.delta === 0 ? "—" : o.delta}</span>
        </span>
      </div>
      <div className="relative h-[3px] bg-border">
        <div className="absolute left-0 top-0 h-full bg-muted-foreground/40" style={{ width: `${o.baseline}%` }} />
        {o.delta > 0 && <div className="absolute top-0 h-full bg-gold" style={{ left: `${o.baseline}%`, width: `${o.delta}%` }} />}
      </div>
    </div>
  );
}
