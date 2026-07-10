import { useState } from "react";
import type { JourneyInsights } from "@/lib/anthropic";

type Props = {
  loading: boolean;
  error: string | null;
  insights: JourneyInsights | null;
  notEnoughData: boolean;
  onDrill: (olq: string) => void;
};

export function InsightsTab({ loading, error, insights, notEnoughData, onDrill }: Props) {
  if (notEnoughData) {
    return (
      <div>
        <Header />
        <div className="border border-border bg-surface-1 p-7 text-center">
          <p className="font-serif text-lg text-foreground">Not enough sessions yet.</p>
          <p className="mx-auto mt-2 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
            Complete a few more sessions and write real reflections — patterns need something to work with. Check back after
            Day 3 or so.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <Header />
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Analysing your sessions…</p>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div>
        <Header />
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-danger">{error ?? "Something went wrong."}</p>
      </div>
    );
  }

  return (
    <div>
      <Header count={insights.focus_areas.length} />

      <div className="mb-5 flex flex-col gap-2.5">
        {insights.focus_areas.map((f, i) => (
          <FocusAreaCard key={f.olq} f={f} index={i} onDrill={() => onDrill(f.olq)} />
        ))}
      </div>

      <div className="mb-5 border-l-2 border-gold/30 pl-4">
        <p className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">How your pattern reads overall</p>
        <p className="font-serif text-[15px] italic leading-relaxed text-foreground">"{insights.board_read}"</p>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <p className="mb-2.5 font-mono text-[8px] uppercase tracking-[0.16em] text-success">◆ Your spine — keep these</p>
          <div className="flex flex-wrap gap-1.5">
            {insights.strengths.map((s) => (
              <span key={s} className="border border-border px-2.5 py-1 text-xs text-foreground">
                {s}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2.5 font-mono text-[8px] uppercase tracking-[0.16em] text-gold">▲ Costing you marks</p>
          <div className="flex flex-wrap gap-1.5">
            {insights.gaps.map((g) => (
              <span key={g} className="border border-gold/30 px-2.5 py-1 text-xs text-foreground">
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>

      {insights.session_insights.length > 0 && (
        <div>
          <p className="mb-3.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">What each session showed</p>
          <div className="relative flex flex-col gap-4 pl-4">
            <div className="absolute bottom-1.5 left-[3px] top-1.5 w-px bg-border" />
            {insights.session_insights.map((s, i) => (
              <div key={i} className="relative">
                <span className="absolute -left-4 top-1 h-[7px] w-[7px] rounded-full bg-gold" />
                <p className="mb-1 font-mono text-[8px] uppercase tracking-[0.14em] text-gold">
                  Day {s.day} · {s.olq}
                </p>
                <p className="text-[13px] leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Header({ count }: { count?: number }) {
  return (
    <div className="mb-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold">Insights</p>
      <h2 className="mt-1.5 font-serif text-[26px] font-bold tracking-tight text-foreground">What to work on next</h2>
      <p className="mt-2 max-w-[64ch] text-[13px] leading-relaxed text-muted-foreground">
        The patterns we noticed in your answers, most important first. What happened, why it matters, and what to try next.
        {count !== undefined && ` ${count} ${count === 1 ? "quality" : "qualities"} · most important first`}
      </p>
    </div>
  );
}

function FocusAreaCard({ f, index, onDrill }: { f: JourneyInsights["focus_areas"][number]; index: number; onDrill: () => void }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div className="border-l-2 border-gold border-y border-r border-border bg-surface-1">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3.5 p-4 text-left">
        <span className="w-8 shrink-0 font-serif text-2xl font-bold text-gold">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <p className="mb-1 font-mono text-[8px] uppercase tracking-[0.14em] text-gold">
            {String(index + 1).padStart(2, "0")} · {f.priority} · {f.tag}
          </p>
          <p className="font-serif text-lg font-semibold leading-tight text-foreground">{f.title}</p>
        </div>
        <span className="shrink-0 font-mono text-lg text-gold">{open ? "–" : "+"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="mb-2.5 font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">What we saw — and how it reads</p>
          <div className="mb-4 flex flex-col gap-2">
            {f.evidence.map((e, i) => (
              <div key={i} className="border-l-2 border-gold/40 bg-background/40 p-3">
                <p className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground">{e.ctx}</p>
                <p className="mb-1.5 font-serif text-[13.5px] italic leading-relaxed text-foreground">"{e.quote}"</p>
                <p className="text-[11px] leading-relaxed text-gold">↳ {e.read}</p>
              </div>
            ))}
          </div>

          <p className="mb-2 font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">Say this instead</p>
          <div className="mb-4 flex flex-col gap-2">
            {f.rewrites.map((rw, i) => (
              <div key={i} className="bg-background/40 p-3">
                <p className="mb-1.5 text-xs leading-relaxed text-muted-foreground line-through">{rw.weak}</p>
                <p className="text-[13px] leading-relaxed text-gold">→ {rw.strong}</p>
              </div>
            ))}
          </div>

          <p className="mb-2 font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">Your practice plan</p>
          <p className="mb-4 text-[13px] leading-relaxed text-foreground">{f.plan}</p>

          <button type="button" onClick={onDrill} className="inline-flex items-center gap-2 bg-gold px-4.5 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#0A0E0A]">
            Drill {f.olq} →
          </button>
        </div>
      )}
    </div>
  );
}
