import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getSRTFullAnalysis } from "@/lib/srt-anthropic";
import { OLQS, ratingFromScore } from "@/lib/wat-data";
import { SRT_SITUATIONS } from "@/lib/srt-data";
import { getTestAttempts, recordTestAttempt, signInWithGoogle, supabase, updateTestAttempt } from "@/lib/supabase";
import { ChevronDown, Download, RotateCcw } from "lucide-react";
import { AnalysisLoading } from "@/components/AnalysisLoading";

const ADMIN_EMAILS = ["s.eeshan3333@gmail.com"];

export const Route = createFileRoute("/tests/srt/practice")({
  head: () => ({
    meta: [
      { title: "SRT Practice Mode — ForgeSSB" },
      { name: "description", content: "Practice the Situation Reaction Test and receive full AI assessment." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PracticePage,
});

const PRACTICE_COUNTS = [5, 10, 20, 30, 60] as const;
const SECONDS_PER_WORD = 30;
const ATTEMPT_COUNT_KEY = "forgessb_attempt_count";
const ANON_ID_KEY = "forgessb_anonymous_id";

type Analysis = {
  summary: string;
  olq_scores: Record<string, number>;
  pattern_analysis: string;
  improvement_areas: { area: string; current_pattern: string; recommendation: string }[];
  assessor_note: string;
};

type SrtResponse = { situation: string; response: string };
type AuthUser = { id: string; email?: string | null } | null;
type AccessState = "checking" | "allowed" | "login_required" | "attempt_limit";
type Phase = "setup" | "test" | "results";

function getAnonymousId() {
  const existing = localStorage.getItem(ANON_ID_KEY);
  if (existing) return existing;
  const generated =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(ANON_ID_KEY, generated);
  return generated;
}

function PracticePage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("setup");
  const [accessState, setAccessState] = useState<AccessState>("checking");
  const [user, setUser] = useState<AuthUser>(null);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState<string>("your account");
  const [showFirstAttemptPrompt, setShowFirstAttemptPrompt] = useState(false);

  const [wordCount, setWordCount] = useState<(typeof PRACTICE_COUNTS)[number]>(10);
  const [mode, setMode] = useState<"timed" | "untimed">("timed");
  const [situations, setSituations] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState("");
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_WORD);
  const [allResponses, setAllResponses] = useState<SrtResponse[]>([]);

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [tableOpen, setTableOpen] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const TOTAL_WORDS = situations.length;
  const situation = situations[index];
  const isLast = index >= TOTAL_WORDS - 1;
  const isTimed = mode === "timed";
  const progressPct = TOTAL_WORDS > 0 ? ((index + 1) / TOTAL_WORDS) * 100 : 0;
  const timerPct = (timeLeft / SECONDS_PER_WORD) * 100;

  useEffect(() => {
    const run = async () => {
      try {
        setWaitlistJoined(localStorage.getItem("forgessb_waitlist") === "true");
        const { data } = await supabase.auth.getUser();
        const authUser = (data.user as AuthUser) ?? null;
        setUser(authUser);
        if (authUser?.email) {
          setWaitlistEmail(authUser.email);
        }

        if (!authUser) {
          getAnonymousId();
          const rawCount = Number(localStorage.getItem(ATTEMPT_COUNT_KEY) ?? "0");
          const attemptCount = Number.isNaN(rawCount) ? 0 : rawCount;
          if (attemptCount >= 1) {
            setAccessState("login_required");
            return;
          }
          setAccessState("allowed");
          return;
        }
        if (ADMIN_EMAILS.includes(authUser.email ?? "")) {
          setAccessState("allowed");
          return;
        }

        const count = await getTestAttempts(authUser.id);
        if (count >= 3) {
          setAccessState("attempt_limit");
          return;
        }
        setAccessState("allowed");
      } catch {
        setAccessState("allowed");
      }
    };
    void run();
  }, []);

  async function notifyWaitlist() {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser?.id || !authUser?.email) return;
    setWaitlistLoading(true);
    try {
      await supabase.from("waitlist").insert({ user_id: authUser.id, email: authUser.email });
      localStorage.setItem("forgessb_waitlist", "true");
      setWaitlistJoined(true);
      setWaitlistEmail(authUser.email);
    } finally {
      setWaitlistLoading(false);
    }
  }

  useEffect(() => {
    if (phase === "test") {
      textareaRef.current?.focus();
    }
  }, [phase, index]);

  useEffect(() => {
    if (phase !== "test" || !isTimed || !situation) return;
    if (timeLeft <= 0) {
      advance();
      return;
    }
    const timer = window.setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, isTimed, timeLeft, situation]);

  useEffect(() => {
    if (phase !== "results" || !allResponses.length) return;
    const run = async () => {
      setLoadingAnalysis(true);
      try {
        const result = await getSRTFullAnalysis(allResponses);
        setAnalysis(result);
        const attemptId = sessionStorage.getItem("forgessb_current_attempt_id");
        if (attemptId) {
          await updateTestAttempt(
            attemptId,
            allResponses as unknown as { word: string; response: string }[],
            result as unknown as object,
            allResponses.length
          );
        }
      } catch {
        setError("Analysis failed. Please try again.");
      } finally {
        setLoadingAnalysis(false);
      }
    };
    void run();
  }, [phase, allResponses]);

  async function startSession() {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    const authUser = (currentUser as AuthUser) ?? null;
    setUser(authUser);

    if (authUser && ADMIN_EMAILS.includes(authUser.email ?? "")) {
      const attemptId = await recordTestAttempt(
        authUser.id,
        undefined,
        "srt_practice",
        undefined,
        undefined,
        undefined,
        authUser.email ?? undefined
      );
      if (attemptId) sessionStorage.setItem("forgessb_current_attempt_id", attemptId);
      sessionStorage.setItem("forgessb_attempt_in_progress", "true");
      sessionStorage.setItem("srt_word_count", wordCount.toString());
      const shuffled = [...SRT_SITUATIONS].sort(() => Math.random() - 0.5).slice(0, wordCount);
      setSituations(shuffled);
      setPhase("test");
      setIndex(0);
      setResponse("");
      setTimeLeft(SECONDS_PER_WORD);
      setAllResponses([]);
      setAnalysis(null);
      setError(null);
      return;
    }

    if (!authUser) {
      getAnonymousId();
      const rawCount = Number(localStorage.getItem(ATTEMPT_COUNT_KEY) ?? "0");
      const attemptCount = Number.isNaN(rawCount) ? 0 : rawCount;
      if (attemptCount >= 1) {
        setAccessState("login_required");
        return;
      }
      localStorage.setItem(ATTEMPT_COUNT_KEY, "1");
      sessionStorage.setItem("forgessb_attempt_in_progress", "true");
      setShowFirstAttemptPrompt(true);
      const attemptId = await recordTestAttempt(
        undefined,
        localStorage.getItem(ANON_ID_KEY) ?? undefined,
        "srt_practice"
      );
      if (attemptId) sessionStorage.setItem("forgessb_current_attempt_id", attemptId);
    } else {
      const count = await getTestAttempts(authUser.id);
      if (count >= 3) {
        setAccessState("attempt_limit");
        return;
      }
      const attemptId = await recordTestAttempt(
        authUser.id,
        undefined,
        "srt_practice",
        undefined,
        undefined,
        undefined,
        authUser.email ?? undefined
      );
      if (attemptId) sessionStorage.setItem("forgessb_current_attempt_id", attemptId);
      sessionStorage.setItem("forgessb_attempt_in_progress", "true");
    }

    sessionStorage.setItem("srt_word_count", wordCount.toString());
    const shuffled = [...SRT_SITUATIONS].sort(() => Math.random() - 0.5).slice(0, wordCount);
    setSituations(shuffled);
    setPhase("test");
    setIndex(0);
    setResponse("");
    setTimeLeft(SECONDS_PER_WORD);
    setAllResponses([]);
    setAnalysis(null);
    setError(null);
  }

  function advance() {
    if (!situation) return;
    const updated = [...allResponses, { situation, response: response.trim() }];
    setAllResponses(updated);
    if (isLast) {
      sessionStorage.setItem("srt_practice_responses", JSON.stringify(updated));
      setPhase("results");
      return;
    }
    setIndex((i) => i + 1);
    setResponse("");
    setTimeLeft(SECONDS_PER_WORD);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    advance();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      advance();
    }
  }

  if (accessState === "checking") {
    return (
      <section className="relative">
        <div className="absolute inset-0 grid-texture-fine opacity-60" aria-hidden="true" />
        <div className="relative mx-auto max-w-2xl px-6 py-20 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">Verifying Access</p>
          <p className="mt-4 text-foreground/80">Stand by while we validate your practice allocation.</p>
        </div>
      </section>
    );
  }

  if (accessState === "login_required") {
    return (
      <section className="mx-auto max-w-3xl px-6 py-20">
        <div className="border border-gold/40 bg-surface-1/70 p-8 sm:p-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">
            Access Control · Practice Simulation
          </p>
          <h1 className="mt-4 font-serif text-3xl text-foreground sm:text-4xl">Identity Verification Required</h1>
          <p className="mt-6 text-base leading-relaxed text-foreground/85">
            AI analysis costs money to run. Help us know who you are — sign in with Google for 3 free attempts.
          </p>
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="mt-8 inline-flex items-center justify-center border border-gold bg-gold/10 px-7 py-3.5 font-mono text-xs uppercase tracking-[0.22em] text-gold transition-all hover:bg-gold hover:text-primary-foreground"
          >
            Sign In With Google
          </button>
        </div>
      </section>
    );
  }

  if (accessState === "attempt_limit") {
    const displayEmail = waitlistEmail;
    return (
      <section className="mx-auto max-w-3xl px-6 py-20">
        <div className="border border-gold/40 bg-surface-1/70 p-8 sm:p-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">Allocation Exhausted</p>
          <h1 className="mt-4 font-serif text-3xl text-foreground sm:text-4xl">You&apos;ve used your 3 free attempts.</h1>
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-gold/80">
            Registered Account · {displayEmail}
          </p>
          {waitlistJoined ? (
            <p className="mt-6 text-base leading-relaxed text-foreground/85">
              You&apos;re on the list. We&apos;ll reach out to {displayEmail} when ForgeSSB launches paid plans.
            </p>
          ) : (
            <div className="mt-8">
              <button
                type="button"
                onClick={() => void notifyWaitlist()}
                disabled={waitlistLoading}
                className="inline-flex items-center justify-center border border-gold bg-gold/10 px-7 py-3.5 font-mono text-xs uppercase tracking-[0.22em] text-gold transition-all hover:bg-gold hover:text-primary-foreground disabled:opacity-60"
              >
                {waitlistLoading ? "Submitting..." : "Notify Me When Pricing Launches"}
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (phase === "setup") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b border-border/50 px-8 py-5">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-gold">SRT · Practice</p>
            <Link
              to="/tests/srt"
              className="border border-border bg-transparent px-3 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:border-gold/40 hover:text-foreground"
            >
              End Session
            </Link>
          </div>
        </header>
        <div className="relative flex-1 px-6 py-12">
          <div className="absolute inset-0 grid-texture opacity-30" aria-hidden="true" />
          <div className="relative mx-auto max-w-2xl">
            <section className="border border-border bg-surface-1/50 p-6 sm:p-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">Practice Mode · Setup</p>
              <h1 className="mt-3 font-serif text-3xl text-foreground sm:text-4xl">Configure Training Session</h1>
              <div className="mt-6 h-px w-20 bg-gold/50" />
              <p className="mt-6 text-sm leading-relaxed text-foreground/80">
                Select situation count and timing mode before commencing your SRT drill.
              </p>
              <div className="mt-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Situation Count</p>
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {PRACTICE_COUNTS.map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setWordCount(count)}
                      className={`border px-3 py-4 font-serif text-xl transition-all ${
                        wordCount === count
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-border bg-surface-1 text-foreground/70 hover:border-gold/40 hover:text-foreground"
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground/70">
                  After completing all situations, our AI will analyse your full response pattern and generate a comprehensive OLQ assessment.
                </p>
              </div>
              <div className="mt-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Session Mode</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(["timed", "untimed"] as const).map((sessionMode) => (
                    <button
                      key={sessionMode}
                      type="button"
                      onClick={() => setMode(sessionMode)}
                      className={`border px-4 py-4 font-mono text-xs uppercase tracking-[0.2em] transition-all ${
                        mode === sessionMode
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-border bg-surface-1 text-foreground/70 hover:border-gold/40 hover:text-foreground"
                      }`}
                    >
                      {sessionMode}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-10 border border-gold/40 bg-surface-2/50 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Session Profile</p>
                <p className="mt-2 font-serif text-2xl text-foreground">
                  {wordCount} situations · <span className="text-gold">{isTimed ? "timed (30s/situation)" : "untimed"}</span>
                </p>
              </div>
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={startSession}
                  className="inline-flex w-full items-center justify-center gap-2 border border-gold bg-gold/10 px-7 py-3 text-center text-sm font-medium uppercase tracking-[0.18em] text-gold transition-all hover:bg-gold hover:text-primary-foreground sm:w-auto"
                >
                  Commence Practice →
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "test") {
    const timerTone = timeLeft <= 5 ? "text-danger" : timeLeft <= 10 ? "text-amber" : "text-gold";
    const timerBarColour = timeLeft <= 5 ? "bg-danger" : timeLeft <= 10 ? "bg-amber" : "bg-gold";
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const timerText = `${mins}:${secs.toString().padStart(2, "0")}`;

    return (
      <div className="fixed inset-0 flex flex-col bg-background">
        <header className="border-b border-border/50 px-4 py-4 sm:px-8 sm:py-5">
          <div className="mx-auto flex max-w-5xl items-center gap-4 sm:gap-6">
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-gold">SRT · Practice Live</div>
            <div className="flex-1">
              <div className="mb-1.5 flex items-center justify-between font-mono text-xs">
                <span className="text-muted-foreground">PROGRESS</span>
                <span className="text-foreground">
                  {String(index + 1).padStart(2, "0")} / {TOTAL_WORDS}
                </span>
              </div>
              <div className="h-px w-full bg-border">
                <div className="h-full bg-gold transition-all duration-300" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Are you sure you want to end this session? Your progress will be lost.")) {
                  navigate({ to: "/tests" });
                }
              }}
              className="shrink-0 border border-border/50 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
            >
              ✕ End
            </button>
          </div>
        </header>
        <div className="relative flex flex-1 items-start justify-center overflow-y-auto px-4 py-6 sm:items-center sm:px-6">
          <div className="absolute inset-0 grid-texture opacity-40" aria-hidden="true" />
          <div className="relative w-full max-w-2xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-gold/70">Situation</p>
            <p
              key={index}
              className="animate-word-in mt-4 font-serif text-xl leading-relaxed text-foreground"
            >
              {situation}
            </p>
            <form onSubmit={handleSubmit} className="mt-6 sm:mt-8">
              <textarea
                ref={textareaRef}
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you would do..."
                rows={3}
                autoComplete="off"
                className="w-full resize-none border border-border bg-surface-1/40 px-4 py-3 font-serif text-base text-foreground placeholder:font-sans placeholder:text-sm placeholder:uppercase placeholder:tracking-[0.2em] placeholder:text-muted-foreground/70 focus:border-gold focus:bg-surface-1 focus:outline-none sm:px-5 sm:py-4 sm:text-lg"
              />
              <div className="mt-3 flex items-center justify-between gap-4">
                <p className="hidden font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:block">
                  Enter to submit · Shift+Enter for new line{isTimed ? " · Auto-advance on timer" : ""}
                </p>
                <button
                  type="submit"
                  className="border border-gold/60 bg-gold/10 px-8 py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-gold transition-colors hover:bg-gold/20 active:bg-gold/30 sm:ml-auto"
                >
                  Submit →
                </button>
              </div>
            </form>
          </div>
        </div>
        {isTimed && (
          <footer className="border-t border-border/50 px-4 py-4 sm:px-8 sm:py-6">
            <div className="mx-auto max-w-5xl">
              <div className="flex items-end justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Time Remaining</p>
                <p className={`font-mono text-4xl font-medium tabular-nums sm:text-5xl ${timerTone}`}>{timerText}</p>
              </div>
              <div className="mt-3 h-1 w-full bg-border/60">
                <div
                  className={`h-full transition-all duration-1000 ease-linear ${timerBarColour}`}
                  style={{ width: `${timerPct}%` }}
                />
              </div>
            </div>
          </footer>
        )}
      </div>
    );
  }

  if (loadingAnalysis) {
    return <AnalysisLoading />;
  }

  if (error || !analysis) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-danger">{error ?? "Something went wrong."}</p>
        <Link
          to="/tests/srt"
          className="border border-gold px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] text-gold hover:bg-gold hover:text-primary-foreground"
        >
          Return to Practice Hub
        </Link>
      </div>
    );
  }

  const scores = analysis.olq_scores;
  const overall = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / OLQS.length);
  const overallRating = ratingFromScore(overall);
  const candidateName = user?.email ?? "Anonymous";

  function downloadReport() {
    const lines = [
      "ForgeSSB SRT Practice Report",
      "============================",
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
      ...allResponses.map((r, i) => `${i + 1}. ${r.situation} -> ${r.response || "[No response]"}`),
      "",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forgessb-srt-practice-report-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="border-b border-border pb-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">Report · Practice Simulation</p>
        <h1 className="mt-3 font-serif text-3xl text-foreground sm:text-5xl">SRT Assessment Complete</h1>
        <p className="mt-3 text-base text-muted-foreground">
          SRT Practice · {allResponses.length} Responses Analysed
        </p>
        <div className="mt-8 grid grid-cols-1 gap-px bg-border sm:grid-cols-3">
          <Stat label="Composite OLQ Score" value={`${overall}`} suffix="/ 100" />
          <Stat label="Overall Rating" value={overallRating.label} tone={overallRating.tone} />
          <Stat label="Responses Recorded" value={`${allResponses.length}`} />
        </div>
      </div>
      <div className="mt-10 border border-gold/30 bg-surface-1 p-6 sm:p-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">Senior Assessor · Overall Evaluation</p>
        <p className="mt-4 text-base leading-relaxed text-foreground/85">{analysis.summary}</p>
        <div className="mt-4 border-t border-border/50 pt-4">
          <p className="text-sm italic text-muted-foreground">{analysis.assessor_note}</p>
        </div>
      </div>
      <div className="mt-14">
        <SectionHeader number="I" title="Officer-Like Qualities" subtitle="Per-attribute breakdown" />
        <div className="mt-8 grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
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
                <p className={`mt-3 font-mono text-[10px] uppercase tracking-[0.25em] ${r.tone}`}>· {r.label}</p>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-16 flex flex-col gap-px lg:grid lg:grid-cols-5">
        <div className="bg-surface-1 p-6 sm:p-8 lg:col-span-3">
          <SectionHeader number="II" title="Pattern Analysis" />
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-foreground/85">
            {analysis.pattern_analysis.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
        <div className="bg-surface-1 p-6 sm:p-8 lg:col-span-2">
          <SectionHeader number="III" title="Improvement Areas" />
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
                  <th className="px-4 py-3 font-medium sm:px-5">Situation</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Your Response</th>
                </tr>
              </thead>
              <tbody>
                {allResponses.map((r, i) => (
                  <tr key={i} className="border-t border-border/50 hover:bg-surface-1/60">
                    <td className="hidden px-5 py-4 font-mono text-xs text-muted-foreground sm:table-cell">{String(i + 1).padStart(2, "0")}</td>
                    <td className="px-4 py-3 text-sm text-foreground/80 sm:px-5 sm:py-4">{r.situation}</td>
                    <td className="px-4 py-3 text-foreground/90 sm:px-5 sm:py-4">
                      {r.response || <span className="italic text-muted-foreground">No response</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
          to="/tests/srt"
          className="inline-flex w-full items-center justify-center gap-3 border border-border px-7 py-3.5 text-sm font-medium uppercase tracking-[0.18em] text-foreground/80 transition-all hover:border-foreground/40 hover:text-foreground sm:w-auto"
        >
          <RotateCcw className="h-4 w-4" />
          Attempt Again
        </Link>
      </div>
      {showFirstAttemptPrompt && !user && (
        <div className="mt-10 border border-gold/40 bg-surface-1/60 p-6 sm:p-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">Recommendation</p>
          <p className="mt-3 font-serif text-xl text-foreground">
            Save your results and get 3 free attempts — sign in with Google
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
