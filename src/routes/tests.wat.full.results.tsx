import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { OLQS, ratingFromScore } from "@/lib/wat-data";
import { getFullTestAnalysis } from "@/lib/anthropic";
import { supabase, updateTestAttempt, formatDisplayName } from "@/lib/supabase";
import { AnalysisLoading } from "@/components/AnalysisLoading";
import { LeaderboardTeaser } from "@/components/LeaderboardTeaser";
import { ChevronDown, Download, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/tests/wat/full/results")({
  head: () => ({
    meta: [
      { title: "Assessment Complete — WAT Results — ForgeSSB" },
      { name: "description", content: "OLQ scores and AI pattern analysis from your WAT simulation." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResultsPage,
});

type Analysis = {
  summary: string;
  olq_scores: Record<string, number>;
  pattern_analysis: string;
  improvement_areas: { area: string; current_pattern: string; recommendation: string }[];
  assessor_note: string;
};

type WatResponse = { word: string; response: string };
type AuthUser = { email?: string | null } | null;

function ResultsPage() {
  const [tableOpen, setTableOpen] = useState(true);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [responses, setResponses] = useState<WatResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser>(null);
  const [showFirstAttemptPrompt, setShowFirstAttemptPrompt] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const stored = sessionStorage.getItem("wat_responses");
        if (!stored) {
          setError("No responses found. Please complete the test first.");
          setAccessState("allowed");
          return;
        }

        const parsed: WatResponse[] = JSON.parse(stored);
        setResponses(parsed);

        const { data } = await supabase.auth.getUser();
        const authUser = (data.user as AuthUser) ?? null;
        setUser(authUser);
        if (!authUser && Number(localStorage.getItem("forgessb_attempt_count") ?? "0") === 1) {
          setShowFirstAttemptPrompt(true);
        }

        const dataAnalysis = await getFullTestAnalysis(parsed);
        setAnalysis(dataAnalysis);
        const attemptId = sessionStorage.getItem("forgessb_current_attempt_id");
        if (attemptId) {
          const olqVals = Object.values(dataAnalysis.olq_scores as Record<string, number>);
          const compositeScore = olqVals.length
            ? Math.round(olqVals.reduce((a, b) => a + b, 0) / olqVals.length)
            : undefined;
          const fullName = authUser?.user_metadata?.full_name as string | undefined;
          const displayName = fullName ? formatDisplayName(fullName) : undefined;
          await updateTestAttempt(
            attemptId,
            parsed,
            dataAnalysis as unknown as object,
            parsed.length,
            compositeScore,
            displayName
          );
        }
      } catch (err) {
        console.error(err);
        setError("Analysis failed. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  if (loading) {
    return <AnalysisLoading />;
  }

  if (error || !analysis) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-danger">
          {error ?? "Something went wrong."}
        </p>
        <Link
          to="/tests/wat/full/instructions"
          className="border border-gold px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] text-gold hover:bg-gold hover:text-primary-foreground"
        >
          Return to Instructions
        </Link>
      </div>
    );
  }

  const scores = analysis.olq_scores;
  const overall = Math.round(
    Object.values(scores).reduce((a, b) => a + b, 0) / OLQS.length
  );
  const overallRating = ratingFromScore(overall);
  const candidateName = user?.email ?? "Anonymous";

  function downloadReport() {
    const lines = [
      "ForgeSSB WAT Report",
      "===================",
      `Candidate: ${candidateName}`,
      `Date: ${new Date().toLocaleString()}`,
      "",
      "OLQ Scores",
      "----------",
      ...OLQS.map((olq) => `${olq}: ${scores[olq] ?? 0}`),
      "",
      "Pattern Analysis",
      "----------------",
      analysis.pattern_analysis,
      "",
      "Assessor Note",
      "-------------",
      analysis.assessor_note,
      "",
      "Response Log",
      "------------",
      ...responses.map((r, i) => `${i + 1}. ${r.word} -> ${r.response || "[No response]"}`),
      "",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forgessb-wat-full-report-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Header */}
      <div className="border-b border-border pb-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">
          Report · Word Association Test
        </p>
        <h1 className="mt-3 font-serif text-3xl text-foreground sm:text-5xl">Assessment Complete</h1>
        <p className="mt-3 text-base text-muted-foreground">
          Here is what your responses reveal about your OLQ profile.
        </p>
        <div className="mt-8 grid gap-px bg-border grid-cols-1 sm:grid-cols-3">
          <Stat label="Composite OLQ Score" value={`${overall}`} suffix="/ 100" />
          <Stat label="Overall Rating" value={overallRating.label} tone={overallRating.tone} />
          <Stat label="Responses Recorded" value={`${responses.length}`} suffix="of 60" />
        </div>
      </div>

      {/* Assessor Summary */}
      <div className="mt-10 border border-gold/30 bg-surface-1 p-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">
          Senior Assessor · Overall Evaluation
        </p>
        <p className="mt-4 text-base leading-relaxed text-foreground/85">{analysis.summary}</p>
        <div className="mt-4 border-t border-border/50 pt-4">
          <p className="text-sm italic text-muted-foreground">{analysis.assessor_note}</p>
        </div>
      </div>

      {/* Pattern Analysis */}
      <div className="mt-14 flex flex-col gap-px lg:grid lg:grid-cols-5">
        <div className="bg-surface-1 p-6 sm:p-8 lg:col-span-3">
          <SectionHeader number="I" title="Pattern Analysis" />
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-foreground/85">
            {analysis.pattern_analysis.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
        <div className="bg-surface-1 p-6 sm:p-8 lg:col-span-2">
          <SectionHeader number="II" title="Improvement Areas" />
          <ul className="mt-6 space-y-5 text-sm">
            {analysis.improvement_areas.map((item, i) => (
              <li key={i} className="flex gap-4 border-l border-gold/40 pl-4">
                <span className="font-mono text-xs text-gold">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="font-medium text-foreground">{item.area}</p>
                  <p className="mt-1 text-muted-foreground">{item.recommendation}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* OLQ Grid */}
      <div className="mt-16">
        <SectionHeader number="III" title="Officer-Like Qualities" subtitle="Per-attribute breakdown" />
        <div className="mt-8 grid gap-px bg-border grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {OLQS.map((olq) => {
            const score = scores[olq] ?? 0;
            const r = ratingFromScore(score);
            return (
              <div key={olq} className="bg-surface-1 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-serif text-base leading-tight text-foreground">{olq}</h3>
                  <span className="font-mono text-sm text-foreground tabular-nums">{score}</span>
                </div>
                <div className="mt-4 h-1 w-full bg-border/70">
                  <div className="h-full bg-gold transition-all" style={{ width: `${score}%` }} />
                </div>
                <p className={`mt-3 font-mono text-[10px] uppercase tracking-[0.25em] ${r.tone}`}>
                  · {r.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Response Table */}
      <div className="mt-16">
        <button
          type="button"
          onClick={() => setTableOpen((v) => !v)}
          className="flex w-full items-center justify-between border border-border bg-surface-1 px-6 py-5 text-left transition-colors hover:border-gold/50"
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">Section IV</p>
            <h2 className="mt-1 font-serif text-2xl text-foreground">Response Log</h2>
          </div>
          <ChevronDown className={`h-5 w-5 text-gold transition-transform ${tableOpen ? "rotate-180" : ""}`} />
        </button>
        {tableOpen && (
          <div className="border border-t-0 border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <tr>
                  <th className="hidden px-5 py-3 font-medium sm:table-cell">#</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Stimulus</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Your Response</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((r, i) => (
                  <tr key={i} className="border-t border-border/50 hover:bg-surface-1/60">
                    <td className="hidden px-5 py-4 font-mono text-xs text-muted-foreground sm:table-cell">
                      {String(i + 1).padStart(2, "0")}
                    </td>
                    <td className="px-4 py-3 font-serif text-base text-gold sm:px-5 sm:py-4">{r.word}</td>
                    <td className="px-4 py-3 text-foreground/90 sm:px-5 sm:py-4">
                      {r.response || <span className="text-muted-foreground italic">No response</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CTAs */}
      <div className="mt-16 flex flex-col gap-3 border-t border-border pt-10 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
        <button
          type="button"
          onClick={downloadReport}
          className="inline-flex w-full items-center justify-center gap-3 border border-gold bg-gold/5 px-7 py-3.5 text-sm font-medium uppercase tracking-[0.18em] text-gold transition-all hover:bg-gold hover:text-primary-foreground sm:w-auto"
        >
          <Download className="h-4 w-4" />
          Download Report
        </button>
        <Link
          to="/tests/wat"
          className="inline-flex w-full items-center justify-center gap-3 border border-border px-7 py-3.5 text-sm font-medium uppercase tracking-[0.18em] text-foreground/80 transition-all hover:border-foreground/40 hover:text-foreground sm:w-auto"
        >
          <RotateCcw className="h-4 w-4" />
          Attempt Again
        </Link>
      </div>

      <LeaderboardTeaser testType="wat" userScore={overall} userRating={overallRating.label} />

      {showFirstAttemptPrompt && !user && (
        <div className="mt-10 border border-gold/40 bg-surface-1/60 p-6 sm:p-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">Recommendation</p>
          <p className="mt-3 font-serif text-xl text-foreground">
            Sign in to save these results and track your progress across sessions.
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="inline-flex items-center justify-center border border-gold bg-gold/10 px-7 py-3 text-xs uppercase tracking-[0.22em] text-gold transition-all hover:bg-gold hover:text-primary-foreground"
            >
              Sign In With Google
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, suffix, tone }: { label: string; value: string; suffix?: string; tone?: string }) {
  return (
    <div className="bg-surface-1 p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
      <p className="mt-3 flex items-baseline gap-2">
        <span className={`font-serif text-4xl ${tone ?? "text-foreground"}`}>{value}</span>
        {suffix && <span className="font-mono text-xs text-muted-foreground">{suffix}</span>}
      </p>
    </div>
  );
}

function SectionHeader({ number, title, subtitle }: { number: string; title: string; subtitle?: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">Section {number}</p>
      <h2 className="mt-2 font-serif text-3xl text-foreground">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}