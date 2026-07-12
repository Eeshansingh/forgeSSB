import { useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { OLQS, ratingFromScore, AVG_ASPIRANT_OLQ_SCORE } from "@/lib/wat-data";
import { supabase, getUserPurchase } from "@/lib/supabase";
import { downloadDataUrl, formatShareDate, generateCardPng } from "@/lib/share-image";
import { OlqRadar } from "@/components/OlqRadar";
import { ShareCard, type ShareTestType } from "@/components/ShareCard";
import { CourseUpsell } from "@/components/CourseUpsell";
import { RankContextLeaderboard } from "./RankContextLeaderboard";
import { useAspirantRank } from "@/lib/use-aspirant-rank";

// Short labels for the radar's spoke labels — matches the real 15-item OLQS list.
const SHORT_OLQ_LABEL: Record<string, string> = {
  "Effective Intelligence": "Eff. Intel",
  "Reasoning Ability": "Reasoning",
  "Organising Ability": "Organising",
  "Power of Expression": "Expression",
  "Social Adaptability": "Adaptability",
  Cooperation: "Coop.",
  "Sense of Responsibility": "Responsib.",
  Initiative: "Initiative",
  "Self Confidence": "Self Conf",
  "Speed of Decision": "Decision",
  "Ability to Influence": "Influence",
  Liveliness: "Liveliness",
  Determination: "Determ.",
  Courage: "Courage",
  Stamina: "Stamina",
};

export type PatternEvidence = { ctx: string; quote: string; read: string };
export type PatternRewrite = { weak: string; strong: string };
export type TopPattern = { title: string; body: string; evidence: PatternEvidence[]; rewrites: PatternRewrite[] };
export type OtherPattern = { title: string; body: string; means: string; tone: "strength" | "gap" };

export type ResultsAnalysis = {
  summary: string;
  olq_scores: Record<string, number>;
  pattern_analysis: string;
  top_pattern: TopPattern;
  other_patterns: OtherPattern[];
  assessor_note: string;
};

type WatResponse = { word: string; response: string };
type SrtResponse = { situation: string; response: string };
export type ReportResponse = WatResponse | SrtResponse;

function stimulusOf(r: ReportResponse): string {
  return "word" in r ? r.word : r.situation;
}

type AuthUser = { email?: string | null } | null;

export type TestResultsReportProps = {
  testType: "wat" | "srt";
  mode: "full" | "practice";
  analysis: ResultsAnalysis;
  responses: ReportResponse[];
  user: AuthUser;
  showFirstAttemptPrompt: boolean;
  onSignIn: () => void;
  showNav?: boolean;
};

// Mirrors TopNav's handleJourneyClick: signed-out or no purchase → /pricing,
// purchased Journey → the dashboard. Kept local since this is the only other
// place in the app that needs the same destination logic.
function useJourneyDestination() {
  const navigate = useNavigate();
  return async () => {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (!uid) {
      void navigate({ to: "/pricing" });
      return;
    }
    const plan = await getUserPurchase(uid);
    void navigate({ to: plan ? "/journey/dashboard" : "/pricing" });
  };
}

export function TestResultsReport({
  testType,
  mode,
  analysis,
  responses,
  user,
  showFirstAttemptPrompt,
  onSignIn,
  showNav,
}: TestResultsReportProps) {
  const olqEntries = OLQS.map((name) => ({ name, score: analysis.olq_scores[name] ?? 0 }));
  const sortedWeakest = [...olqEntries].sort((a, b) => a.score - b.score);
  const composite = Math.round(olqEntries.reduce((s, o) => s + o.score, 0) / OLQS.length);
  const rating = ratingFromScore(composite);
  const rankData = useAspirantRank(testType, composite);
  const attemptedLabel = `${responses.length} ${testType === "srt" ? "situations" : "words"}`;

  const topOlqs = [...olqEntries].sort((a, b) => b.score - a.score).slice(0, 3);
  const bottomOlqs = sortedWeakest.slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl border-x border-border/60">
      {showNav && <CompactNav />}

      <Hero
        testType={testType}
        composite={composite}
        rating={rating}
        analysis={analysis}
        rankData={rankData}
        attemptedLabel={attemptedLabel}
        radarOlqs={olqEntries.map((o) => ({ name: o.name, short: SHORT_OLQ_LABEL[o.name] ?? o.name.split(" ")[0], score: o.score }))}
        user={user}
        showFirstAttemptPrompt={showFirstAttemptPrompt}
        onSignIn={onSignIn}
      />

      <ShareSection
        testType={testType}
        mode={mode}
        composite={composite}
        olqScores={analysis.olq_scores}
        percentile={rankData.isLoggedIn ? rankData.percentile : null}
        topOlq={topOlqs[0]}
        bottomOlq={bottomOlqs[0]}
      />

      <ShapeSection topOlqs={topOlqs} bottomOlqs={bottomOlqs} attemptedLabel={attemptedLabel} />

      <PatternSection topPattern={analysis.top_pattern} otherPatterns={analysis.other_patterns} />

      <OlqAllSection sorted={sortedWeakest} />

      <RankContextLeaderboard testType={testType} userScore={composite} rankData={rankData} />

      <div className="border-t border-border/60 px-6 py-10 sm:px-10">
        <CourseUpsell lowestOlq={sortedWeakest[0]?.name} testType={testType} mode={mode} />
      </div>

      <ResponseLogSection responses={responses} attemptedLabel={attemptedLabel} />
    </div>
  );
}

function CompactNav() {
  const goJourney = useJourneyDestination();
  return (
    <nav className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/60 bg-background/90 px-4 backdrop-blur-md sm:px-6">
      <Link to="/" className="flex items-center gap-2 font-serif text-base font-semibold no-underline">
        <span className="text-gold">★</span>
        <span>
          <span className="text-gold">Forge</span>
          <span className="text-foreground">SSB</span>
        </span>
      </Link>
      <div className="flex items-center gap-0.5">
        <Link to="/tests" className="px-2 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground no-underline hover:text-foreground sm:px-2.5">
          Tests
        </Link>
        <Link to="/leaderboard/wat" className="px-2 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground no-underline hover:text-foreground sm:px-2.5">
          <span className="hidden sm:inline">Leaderboard</span>
          <span className="sm:hidden">Ranks</span>
        </Link>
        <button
          type="button"
          onClick={() => void goJourney()}
          className="ml-1 flex items-center gap-1.5 border border-border px-2 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground transition-colors hover:border-gold/40 sm:px-2.5"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          <span className="hidden sm:inline">My Journey</span>
          <span className="sm:hidden">Journey</span>
        </button>
      </div>
    </nav>
  );
}

function Hero({
  testType,
  composite,
  rating,
  analysis,
  rankData,
  attemptedLabel,
  radarOlqs,
  user,
  showFirstAttemptPrompt,
  onSignIn,
}: {
  testType: "wat" | "srt";
  composite: number;
  rating: { label: string; tone: string };
  analysis: ResultsAnalysis;
  rankData: ReturnType<typeof useAspirantRank>;
  attemptedLabel: string;
  radarOlqs: { name: string; short: string; score: number }[];
  user: AuthUser;
  showFirstAttemptPrompt: boolean;
  onSignIn: () => void;
}) {
  const goJourney = useJourneyDestination();
  const testLabel = testType === "srt" ? "SRT" : "WAT";

  return (
    <div className="border-b border-border bg-surface-1">
      <div className="flex flex-col gap-8 px-5 py-9 sm:flex-row sm:items-start sm:px-10 sm:py-12">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">{testLabel} · Complete</p>
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.22em] text-gold">Your result</p>
          <div className="mt-2.5 flex items-baseline gap-3">
            <span className="font-serif text-[64px] font-bold leading-[0.9] tracking-tight text-foreground sm:text-[80px]">
              {composite}
            </span>
            <div>
              <span className="font-mono text-sm text-muted-foreground">/ 100</span>
              <p className={`mt-1 font-mono text-[9px] uppercase tracking-[0.14em] ${rating.tone}`}>{rating.label}</p>
            </div>
          </div>
          {rankData.isLoggedIn && rankData.percentile !== null ? (
            <p className="mt-3 text-[13px] text-muted-foreground">
              Better than <span className="text-gold">{rankData.percentile}%</span> of aspirants this week ·{" "}
              <span className="text-foreground">{attemptedLabel}</span> recorded
            </p>
          ) : (
            <p className="mt-3 text-[13px] text-muted-foreground">
              <span className="text-foreground">{attemptedLabel}</span> recorded
            </p>
          )}
          <blockquote className="mt-4 border-l-2 border-gold pl-4">
            <p className="font-serif text-[17px] italic leading-relaxed text-foreground">"{analysis.assessor_note}"</p>
          </blockquote>

          {showFirstAttemptPrompt && !user && (
            <div className="mt-5 flex items-center gap-3 border border-border px-4 py-3">
              <span className="text-gold">★</span>
              <p className="flex-1 text-[12.5px] leading-relaxed text-muted-foreground">
                Sign in to save this report and track your progress across sessions.
              </p>
              <button
                type="button"
                onClick={onSignIn}
                className="shrink-0 whitespace-nowrap border border-gold/40 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-gold transition-colors hover:bg-gold/10"
              >
                Sign in →
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => void goJourney()}
            className="mt-5 flex w-full items-center justify-between gap-4 bg-gold px-6 py-4 text-left"
          >
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#0A0E0A]/70">Your natural next step</p>
              <p className="mt-1 font-serif text-lg font-bold leading-tight text-[#0A0E0A]">Start the 30-Day Journey →</p>
            </div>
            <span className="shrink-0 font-serif text-3xl text-[#0A0E0A]/60">30</span>
          </button>
        </div>

        <div className="w-full shrink-0 sm:w-[280px]">
          <OlqRadar olqs={radarOlqs} avgScore={AVG_ASPIRANT_OLQ_SCORE} />
          <div className="mt-2 flex justify-center gap-5">
            <span className="flex items-center gap-1.5 font-mono text-[9px] text-muted-foreground">
              <span className="inline-block h-0 w-3.5 border-t border-dashed border-muted-foreground" />
              Avg aspirant
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[9px] text-gold">
              <span className="inline-block h-0.5 w-3.5 bg-gold" />
              You
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShareSection({
  testType,
  mode,
  composite,
  olqScores,
  percentile,
  topOlq,
  bottomOlq,
}: {
  testType: "wat" | "srt";
  mode: "full" | "practice";
  composite: number;
  olqScores: Record<string, number>;
  percentile: number | null;
  topOlq?: { name: string; score: number };
  bottomOlq?: { name: string; score: number };
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const shareTestType: ShareTestType = mode === "full" ? (testType === "wat" ? "wat_full" : "srt_full") : testType === "wat" ? "wat_practice" : "srt_practice";
  const date = formatShareDate();
  const filename = `forgessb-${shareTestType.replace("_", "-")}-score.png`;
  const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://forgessb.com";
  const shareText = `I scored ${composite}/100 on my ForgeSSB ${testType.toUpperCase()} assessment.`;

  async function handleDownload() {
    setBusy(true);
    setErr(null);
    try {
      if (!cardRef.current) throw new Error("not ready");
      const dataUrl = await generateCardPng(cardRef.current);
      downloadDataUrl(dataUrl, filename);
    } catch {
      setErr("Could not generate image. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleCopyLink() {
    void navigator.clipboard.writeText(shareUrl);
  }

  function handleWhatsApp() {
    // WhatsApp's wa.me scheme only supports pre-filled text + a link, not an attached
    // image — the PNG has to be downloaded separately and shared manually on mobile.
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const PREVIEW = 220;
  const scale = PREVIEW / 1080;

  return (
    <div className="border-t border-border/60 bg-surface-1 px-5 py-10 sm:px-10">
      <div className="mb-4">
        {percentile !== null && (
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-gold">
            Your score beats {percentile}% of all aspirants this week
          </p>
        )}
        <h2 className="mt-1 font-serif text-xl font-bold text-foreground">Share your score — your squad should see this.</h2>
      </div>

      <div className="mb-4 flex flex-col gap-4 border border-gold bg-gradient-to-br from-surface-2 to-background p-5 sm:flex-row sm:items-center">
        <div style={{ width: PREVIEW, height: PREVIEW, overflow: "hidden", flexShrink: 0, outline: "1px solid rgba(201,168,76,0.2)" }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: 1080, height: 1080, pointerEvents: "none" }}>
            <ShareCard testType={shareTestType} compositeScore={composite} olqScores={olqScores} date={date} />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2.5">
          {topOlq && <MiniStat label="Top quality" name={topOlq.name} score={topOlq.score} tone="text-success" />}
          {bottomOlq && <MiniStat label="Focus area" name={bottomOlq.name} score={bottomOlq.score} tone="text-gold" />}
        </div>
      </div>

      {err && <p className="mb-3 font-mono text-[10px] text-danger">{err}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleWhatsApp}
          className="flex items-center gap-2 bg-[#25D366] px-4.5 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-white"
        >
          WhatsApp
        </button>
        <button
          type="button"
          onClick={handleCopyLink}
          className="flex items-center gap-2 border border-gold px-4.5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-gold transition-colors hover:bg-gold/10"
        >
          Copy link
        </button>
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={busy}
          className="flex items-center gap-2 border border-border px-4.5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-gold/40 disabled:opacity-50"
        >
          {busy ? "Generating…" : "Download card"}
        </button>
      </div>

      {/* Hidden full-size rasterization target — the visible preview above is scaled via CSS transform */}
      <div style={{ position: "fixed", left: -9999, top: 0, width: 1080, height: 1080, pointerEvents: "none", zIndex: -1 }}>
        <ShareCard ref={cardRef} testType={shareTestType} compositeScore={composite} olqScores={olqScores} date={date} />
      </div>
    </div>
  );
}

function MiniStat({ label, name, score, tone }: { label: string; name: string; score: number; tone: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border border-gold/30 bg-gold/5 px-3.5 py-2.5">
      <div>
        <p className="font-mono text-[7px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <p className="mt-0.5 font-serif text-[13px] text-foreground">{name}</p>
      </div>
      <span className={`font-serif text-xl font-bold ${tone}`}>{score}</span>
    </div>
  );
}

function ShapeSection({
  topOlqs,
  bottomOlqs,
  attemptedLabel,
}: {
  topOlqs: { name: string; score: number }[];
  bottomOlqs: { name: string; score: number }[];
  attemptedLabel: string;
}) {
  return (
    <div className="border-t border-border/60 px-5 py-10 sm:px-10">
      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-gold">Your profile</p>
      <h2 className="mt-1.5 font-serif text-2xl font-bold text-foreground">What we found in your {attemptedLabel} responses</h2>
      <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <p className="mb-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-success">◆ Your strengths</p>
          {topOlqs.map((o) => {
            const r = ratingFromScore(o.score);
            const note = r.label === "Excellent" ? "Board-ready — this is an asset." : "Solid foundation to build on.";
            return (
              <div key={o.name} className="flex items-center gap-3 border-l-2 border-success bg-surface-1 px-3.5 py-3">
                <span className="w-9 shrink-0 font-serif text-[22px] font-bold text-success">{o.score}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-foreground">{o.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{note}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          <p className="mb-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-gold">▲ Focus areas</p>
          {bottomOlqs.map((o) => {
            const note = o.score < 56 ? "Costing you the most marks right now." : "Needs deliberate practice.";
            return (
              <div key={o.name} className="flex items-center gap-3 border-l-2 border-gold bg-surface-1 px-3.5 py-3">
                <span className="w-9 shrink-0 font-serif text-[22px] font-bold text-gold">{o.score}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-foreground">{o.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{note}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PatternSection({ topPattern, otherPatterns }: { topPattern: TopPattern; otherPatterns: OtherPattern[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-border/60 px-5 py-10 sm:px-10">
      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-gold">The pattern to fix first</p>
      <h2 className="mt-1.5 font-serif text-2xl font-bold text-foreground">{topPattern.title}</h2>
      <p className="mt-1.5 max-w-[64ch] text-[13px] leading-relaxed text-muted-foreground">{topPattern.body}</p>

      <p className="mb-2 mt-5 font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">What we saw</p>
      <div className="flex flex-col gap-2">
        {topPattern.evidence.map((e, i) => (
          <div key={i} className="border-l-2 border-gold/40 bg-surface-1 p-3.5">
            <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground">{e.ctx}</p>
            <p className="mt-1 font-serif text-[13.5px] italic leading-relaxed text-foreground">"{e.quote}"</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-gold">↳ {e.read}</p>
          </div>
        ))}
      </div>

      <p className="mb-2 mt-5 font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">Say this instead</p>
      <div className="flex flex-col gap-2">
        {topPattern.rewrites.map((rw, i) => (
          <div key={i} className="border border-border bg-surface-1 p-3.5">
            <p className="text-[12.5px] leading-relaxed text-muted-foreground line-through">{rw.weak}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-gold">→ {rw.strong}</p>
          </div>
        ))}
      </div>

      {otherPatterns.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-5 flex w-full items-center justify-between border border-border px-4 py-3 text-left"
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              {open ? "Hide other patterns" : `+ ${otherPatterns.length} more patterns identified`}
            </span>
            <span className="text-muted-foreground">{open ? "–" : "+"}</span>
          </button>
          {open && (
            <div className="mt-2.5 flex flex-col gap-2.5">
              {otherPatterns.map((p, i) => (
                <div
                  key={i}
                  className={`border border-border bg-surface-1 p-4 ${p.tone === "strength" ? "border-l-2 border-l-success" : "border-l-2 border-l-gold"}`}
                >
                  <p className="font-serif text-base font-semibold text-foreground">{p.title}</p>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{p.body}</p>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-foreground">
                    <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-gold">Fix · </span>
                    {p.means}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OlqAllSection({ sorted }: { sorted: { name: string; score: number }[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? sorted : sorted.slice(0, 6);
  return (
    <div className="border-t border-border/60 px-5 py-10 sm:px-10">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-gold">All 15 qualities</p>
          <h2 className="font-serif text-[22px] font-bold text-foreground">Weakest to strongest</h2>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="border border-border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-gold/40"
        >
          {expanded ? "Show fewer" : "See all 15"}
        </button>
      </div>
      <div className="flex flex-col gap-2.5">
        {visible.map((o, i) => {
          const r = ratingFromScore(o.score);
          return (
            <div key={o.name}>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`w-6 font-mono text-[10px] uppercase tracking-[0.1em] ${r.tone}`}>{i + 1}</span>
                  <span className="text-[13px] text-foreground">{o.name}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className={`font-mono text-[9px] uppercase tracking-[0.1em] ${r.tone}`}>{r.label}</span>
                  <span className="w-8 text-right font-serif text-lg font-bold text-foreground">{o.score}</span>
                </div>
              </div>
              <div className="h-[3px] bg-border">
                <div
                  className={o.score >= 75 ? "h-full bg-success" : "h-full bg-gold opacity-70"}
                  style={{ width: `${o.score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResponseLogSection({ responses, attemptedLabel }: { responses: ReportResponse[]; attemptedLabel: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-border/60 px-5 py-10 sm:px-10">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between text-left">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Response log · {attemptedLabel}</p>
          <h2 className="font-serif text-xl font-semibold text-foreground">Your responses</h2>
        </div>
        <span className="font-mono text-base text-muted-foreground">{open ? "–" : "+"}</span>
      </button>
      {open && (
        <div className="mt-3.5 border border-border">
          {responses.map((r, i) => (
            <div key={i} className="grid grid-cols-[24px_1fr_1fr] gap-3 border-b border-border/60 px-3.5 py-2.5 last:border-b-0">
              <span className="pt-0.5 font-mono text-[9px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              <span className="font-serif text-sm font-semibold text-gold">{stimulusOf(r)}</span>
              <span className="text-[13px] leading-relaxed text-foreground">
                {r.response || <span className="italic text-muted-foreground">No response</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
