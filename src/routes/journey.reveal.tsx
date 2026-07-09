import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, getJourneyProfile, getAllSessions, getBaselineScores, getUserRank, hasJourneyAccess } from "@/lib/supabase";
import type { SessionRow } from "@/lib/supabase";
import { JOURNEY } from "@/lib/journey-content";
import { JOURNEY_OLQS, scoreOf } from "@/lib/dashboard-content";

export const Route = createFileRoute("/journey/reveal")({
  head: () => ({
    meta: [
      { title: "Day 30 Reveal — ForgeSSB" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RevealPage,
});

type Row = { name: string; baseline: number; now: number; delta: number };

function RevealPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [completeCount, setCompleteCount] = useState(0);
  const [rank, setRank] = useState<{ rank: number; total: number } | null>(null);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        void navigate({ to: "/" });
        return;
      }
      const [access, profile, sessions, baseline, userRank] = await Promise.all([
        hasJourneyAccess(data.user.id),
        getJourneyProfile(data.user.id),
        getAllSessions(data.user.id),
        getBaselineScores(data.user.id),
        getUserRank(data.user.id),
      ]);
      if (!access) {
        void navigate({ to: "/pricing" });
        return;
      }
      if (!profile) {
        void navigate({ to: "/journey/onboarding" });
        return;
      }

      const complete = sessions.filter((s: SessionRow) => s.status === "complete").length;
      setCompleteCount(complete);
      setRank(userRank);

      if (baseline) {
        const built: Row[] = JOURNEY_OLQS.map((name) => {
          const b = baseline[name] ?? 50;
          const best = sessions.reduce<number | undefined>((acc, s) => {
            const v = scoreOf(s.practice_scores, name);
            return v !== undefined && (acc === undefined || v > acc) ? v : acc;
          }, undefined);
          const now = best ?? b;
          return { name, baseline: b, now, delta: now - b };
        });
        setRows(built);
      }
      setLoading(false);
    };
    void run();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Loading</p>
      </div>
    );
  }

  const d1 = rows.length ? Math.round(rows.reduce((s, r) => s + r.baseline, 0) / rows.length) : 0;
  const d30 = rows.length ? Math.round(rows.reduce((s, r) => s + r.now, 0) / rows.length) : 0;
  const growth = d30 - d1;
  const topMover = [...rows].sort((a, b) => b.delta - a.delta)[0] ?? null;
  const percentile = rank ? Math.round(((rank.total - rank.rank) / rank.total) * 100) : null;
  const reveal = JOURNEY.find((s) => s.session_number === 30);
  const missionText = reveal?.mission ?? "";

  return (
    <section className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold">Day 30 · Reveal</p>
      <h1 className="mt-2 font-serif text-4xl font-bold text-foreground sm:text-5xl">You made it.</h1>
      <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
        {completeCount} of 30 sessions completed. Your OLQ profile, Day 1 and Day 30, side by side.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-px bg-border sm:grid-cols-3">
        <Stat label="Day 1 composite" value={String(d1)} />
        <Stat label="Day 30 composite" value={String(d30)} tone={growth >= 0 ? "text-success" : "text-danger"} suffix={growth !== 0 ? `${growth > 0 ? "+" : ""}${growth}` : undefined} />
        <Stat label="Rank among completers" value={percentile !== null ? `Top ${100 - percentile}%` : "—"} />
      </div>

      {topMover && topMover.delta > 0 && (
        <div className="mt-6 border-l-2 border-gold bg-surface-1 p-5">
          <p className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.16em] text-gold">Biggest movement</p>
          <p className="font-serif text-lg text-foreground">
            {topMover.name} — {topMover.baseline} → {topMover.now}{" "}
            <span className="text-success">+{topMover.delta}</span>
          </p>
        </div>
      )}

      <div className="mt-8">
        <p className="mb-3.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">All 15 qualities — Day 1 vs Day 30</p>
        <div className="flex flex-col gap-3.5">
          {rows.map((r) => (
            <div key={r.name}>
              <div className="mb-1 flex justify-between">
                <span className="text-xs text-foreground">{r.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {r.baseline} → {r.now} <span className={r.delta > 0 ? "text-success" : "text-muted-foreground"}>{r.delta > 0 ? `+${r.delta}` : r.delta === 0 ? "—" : r.delta}</span>
                </span>
              </div>
              <div className="relative h-[3px] bg-border">
                <div className="absolute left-0 top-0 h-full bg-muted-foreground/40" style={{ width: `${r.baseline}%` }} />
                {r.delta > 0 && <div className="absolute top-0 h-full bg-gold" style={{ left: `${r.baseline}%`, width: `${r.delta}%` }} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {missionText && (
        <div className="mt-10 border border-gold/40 bg-surface-1 p-6">
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-gold">What's next</p>
          <p className="text-sm leading-relaxed text-foreground">{missionText}</p>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/journey/dashboard" className="border border-gold/40 px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] text-gold no-underline">
          ← Back to dashboard
        </Link>
      </div>
    </section>
  );
}

function Stat({ label, value, tone, suffix }: { label: string; value: string; tone?: string; suffix?: string }) {
  return (
    <div className="bg-surface-1 p-5">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 flex items-baseline gap-2">
        <span className={`font-serif text-3xl font-bold ${tone ?? "text-foreground"}`}>{value}</span>
        {suffix && <span className={`font-mono text-xs ${tone ?? "text-muted-foreground"}`}>{suffix}</span>}
      </p>
    </div>
  );
}
