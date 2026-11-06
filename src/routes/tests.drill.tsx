import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getPracticeFeedback } from "@/lib/anthropic";
import { getSRTPracticeFeedback } from "@/lib/srt-anthropic";
import { WAT_WORDS, OLQ_WAT_WORDS, JOURNEY_TO_SCORING_OLQ } from "@/lib/wat-data";
import { SRT_SITUATIONS, OLQ_SRT_SITUATIONS } from "@/lib/srt-data";
import { supabase, getUserPurchase, recordTestAttempt, updateTestAttempt } from "@/lib/supabase";

type DrillFormat = "wat" | "srt" | "mix";
type ItemFormat = "wat" | "srt";
type DrillPhase = "setup" | "active" | "done";
type AccessState = "checking" | "allowed" | "denied";

type DrillSearch = { olq?: string; format?: DrillFormat };

type DrillItem = { format: ItemFormat; item: string };

type DrillRep = {
  format: ItemFormat;
  item: string;
  response: string;
  score: number;
  read: string;
};

export const Route = createFileRoute("/tests/drill")({
  validateSearch: (search: Record<string, unknown>): DrillSearch => ({
    olq: typeof search.olq === "string" ? search.olq : undefined,
    format:
      search.format === "wat" || search.format === "srt" || search.format === "mix"
        ? search.format
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Drill — ForgeSSB" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DrillPage,
});

const SECONDS_WAT = 15;
const SECONDS_SRT = 30;
const SINGLE_REPS = 10;
const MIX_ROUNDS = 3;
const DRILL_ATTEMPT_KEY = "forgessb_drill_attempt_id";

function average(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

function pickItems(format: ItemFormat, olq: string | undefined, count: number): string[] {
  const targeted = format === "wat" ? (olq ? OLQ_WAT_WORDS[olq] : undefined) : olq ? OLQ_SRT_SITUATIONS[olq] : undefined;
  const bank = targeted && targeted.length ? targeted : format === "wat" ? WAT_WORDS : SRT_SITUATIONS;
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(shuffled[i % shuffled.length]);
  return out;
}

function buildSequence(format: DrillFormat, olq: string | undefined): DrillItem[] {
  if (format === "mix") {
    const watItems = pickItems("wat", olq, MIX_ROUNDS);
    const srtItems = pickItems("srt", olq, MIX_ROUNDS);
    const seq: DrillItem[] = [];
    for (let i = 0; i < MIX_ROUNDS; i++) {
      seq.push({ format: "wat", item: watItems[i] });
      seq.push({ format: "srt", item: srtItems[i] });
    }
    return seq;
  }
  return pickItems(format, olq, SINGLE_REPS).map((item) => ({ format, item }));
}

function DrillPage() {
  const navigate = useNavigate();
  const { olq, format: initialFormat } = Route.useSearch();

  const [accessState, setAccessState] = useState<AccessState>("checking");
  const [phase, setPhase] = useState<DrillPhase>("setup");
  const [format, setFormat] = useState<DrillFormat>(initialFormat ?? "wat");

  const [items, setItems] = useState<DrillItem[]>([]);
  const [repIndex, setRepIndex] = useState(0);
  const [response, setResponse] = useState("");
  const [timeLeft, setTimeLeft] = useState(SECONDS_WAT);
  const [scoring, setScoring] = useState(false);
  const [reps, setReps] = useState<DrillRep[]>([]);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const olqName = olq || "Free Practice";
  const scoringOlq = olq ? (JOURNEY_TO_SCORING_OLQ[olq] ?? olq) : undefined;

  useEffect(() => {
    let settled = false;
    // Access check must never hang the UI forever. This page gates paid
    // content, so on timeout or error we fail closed (send to pricing)
    // rather than granting access.
    const failSafe = window.setTimeout(() => {
      if (!settled) void navigate({ to: "/pricing" });
    }, 8000);
    const run = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!data.user) {
          void navigate({ to: "/pricing" });
          return;
        }
        const plan = await getUserPurchase(data.user.id);
        if (plan !== "practice" && plan !== "journey") {
          void navigate({ to: "/pricing" });
          return;
        }
        setAccessState("allowed");
      } catch {
        void navigate({ to: "/pricing" });
      } finally {
        settled = true;
        window.clearTimeout(failSafe);
      }
    };
    void run();
    return () => window.clearTimeout(failSafe);
  }, [navigate]);

  useEffect(() => {
    if (phase === "active" && !scoring) inputRef.current?.focus();
  }, [phase, repIndex, scoring]);

  const current = items[repIndex];
  const totalReps = items.length;
  const isLast = repIndex >= totalReps - 1;

  useEffect(() => {
    if (phase !== "active" || !current || scoring) return;
    if (timeLeft <= 0) {
      void submitRep();
      return;
    }
    const t = window.setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft, current, scoring]);

  async function startDrill() {
    const seq = buildSequence(format, olq);
    setItems(seq);
    setRepIndex(0);
    setResponse("");
    setReps([]);
    setError(null);
    setTimeLeft(seq[0]?.format === "srt" ? SECONDS_SRT : SECONDS_WAT);
    setPhase("active");

    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const testType = format === "mix" ? "olq_drill_mix" : format === "wat" ? "olq_drill_wat" : "olq_drill_srt";
      const attemptId = await recordTestAttempt(
        data.user.id,
        undefined,
        testType,
        undefined,
        undefined,
        undefined,
        data.user.email ?? undefined
      );
      if (attemptId) sessionStorage.setItem(DRILL_ATTEMPT_KEY, attemptId);
    }
  }

  async function submitRep() {
    if (!current || scoring) return;
    setScoring(true);
    setError(null);
    try {
      const trimmed = response.trim();
      const result =
        current.format === "wat"
          ? await getPracticeFeedback(current.item, trimmed, scoringOlq)
          : await getSRTPracticeFeedback(current.item, trimmed, scoringOlq);
      const rep: DrillRep = {
        format: current.format,
        item: current.item,
        response: trimmed,
        score: typeof result.score === "number" ? result.score : 0,
        read: result.coaching_note ?? "",
      };
      const updated = [...reps, rep];
      setReps(updated);
      if (isLast) {
        await finishDrill(updated);
      } else {
        const next = items[repIndex + 1];
        setRepIndex((i) => i + 1);
        setResponse("");
        setTimeLeft(next?.format === "srt" ? SECONDS_SRT : SECONDS_WAT);
      }
    } catch {
      setError("Scoring failed. Please try again.");
    } finally {
      setScoring(false);
    }
  }

  async function finishDrill(finalReps: DrillRep[]) {
    setPhase("done");
    const attemptId = sessionStorage.getItem(DRILL_ATTEMPT_KEY);
    if (!attemptId) return;
    const watReps = finalReps.filter((r) => r.format === "wat");
    const srtReps = finalReps.filter((r) => r.format === "srt");
    const watAvg = watReps.length ? average(watReps.map((r) => r.score)) : null;
    const srtAvg = srtReps.length ? average(srtReps.map((r) => r.score)) : null;
    try {
      await updateTestAttempt(
        attemptId,
        undefined,
        { reps: finalReps, targetOlq: olq ?? null, watAvg, srtAvg } as unknown as object,
        finalReps.length
      );
    } catch (err) {
      console.error("[drill.finishDrill] updateTestAttempt failed", err);
    }
  }

  function resetToSetup() {
    setPhase("setup");
    setItems([]);
    setRepIndex(0);
    setReps([]);
    setResponse("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void submitRep();
  }

  if (accessState === "checking") {
    return (
      <section className="relative">
        <div className="absolute inset-0 grid-texture-fine opacity-60" aria-hidden="true" />
        <div className="relative mx-auto max-w-2xl px-6 py-20 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">Verifying Access</p>
        </div>
      </section>
    );
  }

  if (phase === "setup") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="border-b border-border/50 px-8 py-5">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-gold">Drill</p>
            <button
              type="button"
              onClick={() => void navigate({ to: "/journey/dashboard" })}
              className="border border-border bg-transparent px-3 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:border-gold/40 hover:text-foreground"
            >
              ← Practice
            </button>
          </div>
        </header>
        <div className="relative flex-1 px-6 py-12">
          <div className="absolute inset-0 grid-texture opacity-30" aria-hidden="true" />
          <div className="relative mx-auto max-w-2xl">
            <section className="border border-border bg-surface-1/50 p-6 sm:p-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">Drill</p>
              <h1 className="mt-3 font-serif text-3xl text-foreground sm:text-4xl">{olqName}</h1>
              <p className="mt-4 text-sm leading-relaxed text-foreground/80">
                {format === "mix" ? MIX_ROUNDS * 2 : SINGLE_REPS} reps. Scored on every response. Stop whenever you
                want.
              </p>

              <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Choose format
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <FormatCard
                  label="WAT"
                  desc="One word · 15 seconds · single clause"
                  active={format === "wat"}
                  onClick={() => setFormat("wat")}
                />
                <FormatCard
                  label="SRT"
                  desc="One situation · 30 seconds · one action"
                  active={format === "srt"}
                  onClick={() => setFormat("srt")}
                />
                <FormatCard
                  label="Mix"
                  desc="3 rounds · WAT then SRT · compare at end"
                  active={format === "mix"}
                  onClick={() => setFormat("mix")}
                />
              </div>

              {format === "mix" && (
                <div className="mt-6 border-l-2 border-gold bg-surface-2/40 py-1 pl-4">
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    Mix runs 3 rounds — each round is one WAT word then one SRT situation targeting{" "}
                    <strong className="text-foreground">{olqName}</strong>. At the end you see your WAT average vs
                    SRT average, so you know exactly which format to keep drilling.
                  </p>
                </div>
              )}

              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={() => void startDrill()}
                  className="inline-flex w-full items-center justify-center gap-2 border border-gold bg-gold/10 px-7 py-3 text-center text-sm font-medium uppercase tracking-[0.18em] text-gold transition-all hover:bg-gold hover:text-primary-foreground sm:w-auto"
                >
                  Start →
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "active" && current) {
    const secondsForFormat = current.format === "srt" ? SECONDS_SRT : SECONDS_WAT;
    const timerPct = (timeLeft / secondsForFormat) * 100;
    const timerTone = timeLeft <= 4 ? "text-danger" : timeLeft <= 8 ? "text-amber" : "text-gold";
    const timerBarColour = timeLeft <= 4 ? "bg-danger" : timeLeft <= 8 ? "bg-amber" : "bg-gold";
    const roundLabel =
      format === "mix"
        ? `Round ${Math.floor(repIndex / 2) + 1} of ${MIX_ROUNDS} · ${current.format === "wat" ? "WAT" : "SRT"}`
        : `${repIndex + 1} of ${totalReps}`;

    return (
      <div className="fixed inset-0 flex flex-col bg-background">
        <header className="border-b border-border/50 px-4 py-4 sm:px-8 sm:py-5">
          <div className="mx-auto flex max-w-5xl items-center gap-4 sm:gap-6">
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-gold">{olqName} · Drill</div>
            <div className="flex-1">
              <div className="mb-1.5 flex items-center justify-between font-mono text-xs">
                <span className="text-muted-foreground">PROGRESS</span>
                <span className="text-foreground">{roundLabel}</span>
              </div>
              <div className="h-px w-full bg-border">
                <div
                  className="h-full bg-gold transition-all duration-300"
                  style={{ width: `${((repIndex + 1) / totalReps) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </header>
        <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 sm:px-6">
          <div className="absolute inset-0 grid-texture opacity-40" aria-hidden="true" />
          <div className="relative w-full max-w-3xl">
            <p className="text-center font-mono text-[10px] uppercase tracking-[0.4em] text-gold/70">
              {current.format === "wat" ? "Stimulus" : "Situation"}
            </p>
            {current.format === "wat" ? (
              <h1
                key={repIndex}
                className="animate-word-in mt-4 text-center font-serif font-semibold uppercase leading-none text-foreground sm:mt-6"
                style={{ fontSize: "clamp(2.5rem, 11vw, 7rem)", letterSpacing: "0.05em" }}
              >
                {current.item}
              </h1>
            ) : (
              <p
                key={repIndex}
                className="animate-word-in mt-4 text-center font-serif text-2xl leading-snug text-foreground sm:mt-6 sm:text-3xl"
              >
                {current.item}
              </p>
            )}
            <form onSubmit={handleSubmit} className="mt-8 sm:mt-12">
              <input
                ref={inputRef}
                type="text"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Your response..."
                autoComplete="off"
                disabled={scoring}
                className="w-full border-b-2 border-border bg-surface-1/40 px-4 py-3 text-center font-serif text-xl text-foreground placeholder:font-sans placeholder:text-sm placeholder:uppercase placeholder:tracking-[0.2em] placeholder:text-muted-foreground/70 focus:border-gold focus:bg-surface-1 focus:outline-none disabled:opacity-50 sm:px-5 sm:py-4 sm:text-2xl"
              />
              <div className="mt-4 flex items-center justify-center gap-4">
                <button
                  type="submit"
                  disabled={scoring}
                  className="border border-gold/60 bg-gold/10 px-8 py-3 font-mono text-xs uppercase tracking-[0.2em] text-gold transition-all hover:bg-gold hover:text-primary-foreground disabled:opacity-60"
                >
                  {scoring ? "Scoring…" : "Next →"}
                </button>
              </div>
              {error && (
                <p className="mt-3 text-center font-mono text-[11px] text-danger">{error}</p>
              )}
            </form>
          </div>
        </div>
        <footer className="border-t border-border/50 px-4 py-4 sm:px-8 sm:py-6">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-end justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Time Remaining</p>
              <p className={`font-mono text-4xl font-medium tabular-nums sm:text-5xl ${timerTone}`}>{timeLeft}s</p>
            </div>
            <div className="mt-3 h-1 w-full bg-border/60">
              <div
                className={`h-full transition-all duration-1000 ease-linear ${timerBarColour}`}
                style={{ width: `${timerPct}%` }}
              />
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // done
  const watReps = reps.filter((r) => r.format === "wat");
  const srtReps = reps.filter((r) => r.format === "srt");
  const overallAvg = average(reps.map((r) => r.score));
  const watAvg = watReps.length ? average(watReps.map((r) => r.score)) : null;
  const srtAvg = srtReps.length ? average(srtReps.map((r) => r.score)) : null;
  const showMixEnd = format === "mix" && watAvg !== null && srtAvg !== null;
  let bottleneckText: string | null = null;
  if (showMixEnd && watAvg !== null && srtAvg !== null) {
    if (watAvg < srtAvg) {
      bottleneckText = `Your WAT average (${watAvg}/10) is lower than SRT (${srtAvg}/10) — that's the bottleneck. Keep drilling WAT for this quality.`;
    } else if (srtAvg < watAvg) {
      bottleneckText = `Your SRT average (${srtAvg}/10) is lower than WAT (${watAvg}/10) — that's the bottleneck. Keep drilling SRT for this quality.`;
    } else {
      bottleneckText = "WAT and SRT are running evenly for this quality — no clear bottleneck yet.";
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 px-8 py-5">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-gold">Drill · Results</p>
        </div>
      </header>
      <div className="relative px-6 py-12">
        <div className="absolute inset-0 grid-texture opacity-30" aria-hidden="true" />
        <div className="relative mx-auto max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-success">{reps.length} reps · done</p>
          <h1 className="mt-2 font-serif text-3xl text-foreground sm:text-4xl">{olqName} · Results</h1>

          <div className="mt-6 flex flex-wrap gap-3">
            <StatTile label="avg / 10" value={String(overallAvg)} tone="text-gold" />
            {showMixEnd && (
              <>
                <StatTile label="WAT avg" value={String(watAvg)} tone="text-gold" />
                <StatTile label="SRT avg" value={String(srtAvg)} tone="text-muted-foreground" />
              </>
            )}
          </div>

          {bottleneckText && (
            <div className="mt-6 border-l-2 border-gold bg-surface-2/40 py-1 pl-4">
              <p className="text-[13px] leading-relaxed text-muted-foreground">{bottleneckText}</p>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3">
            {reps.map((r, i) => (
              <div key={i} className="border border-border bg-surface-1/50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Rep {i + 1} · {r.format === "wat" ? "WAT" : "SRT"}
                  </p>
                  <p className="font-serif text-lg font-bold text-gold">{r.score}/10</p>
                </div>
                <p className="mt-2 font-serif text-base text-foreground">{r.item}</p>
                <p className="mt-2 text-sm italic text-muted-foreground">"{r.response || "[no response]"}"</p>
                {r.read && <p className="mt-2 text-[13px] leading-relaxed text-gold">↳ {r.read}</p>}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={resetToSetup}
              className="border border-gold bg-gold/10 px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] text-gold transition-all hover:bg-gold hover:text-primary-foreground"
            >
              Do more reps
            </button>
            <button
              type="button"
              onClick={() => void navigate({ to: "/journey/dashboard" })}
              className="border border-border px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-gold/40 hover:text-foreground"
            >
              ← Back to Practice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormatCard({
  label,
  desc,
  active,
  onClick,
}: {
  label: string;
  desc: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-[180px] flex-1 flex-col gap-1 border px-4 py-3 text-left transition-all ${
        active ? "border-gold bg-gold/10" : "border-border bg-surface-1 hover:border-gold/40"
      }`}
    >
      <span className="font-mono text-xs uppercase tracking-[0.14em] text-gold">{label}</span>
      <span className="text-[11px] leading-relaxed text-muted-foreground">{desc}</span>
    </button>
  );
}

function StatTile({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="border border-border bg-surface-1/50 px-4 py-3">
      <p className={`font-serif text-2xl font-bold ${tone}`}>{value}</p>
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
    </div>
  );
}
