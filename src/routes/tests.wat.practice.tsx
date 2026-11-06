import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getFullTestAnalysis } from "@/lib/anthropic";
import { WAT_WORDS } from "@/lib/wat-data";
import { getTestAttempts, getUserPurchase, recordTestAttempt, signInWithGoogle, supabase, updateTestAttempt } from "@/lib/supabase";
import { AnalysisLoading } from "@/components/AnalysisLoading";
import { TestResultsReport, type ResultsAnalysis } from "@/components/results/TestResultsReport";
import { ADMIN_EMAILS } from '../lib/auth'

export const Route = createFileRoute("/tests/wat/practice")({
  head: () => ({
    meta: [
      { title: "WAT Practice Mode — ForgeSSB" },
      { name: "description", content: "Practice the Word Association Test and receive full AI assessment." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PracticePage,
});

const PRACTICE_COUNTS = [5, 10, 20, 30, 60] as const;
const SECONDS_PER_WORD = 15;
const ATTEMPT_COUNT_KEY = "forgessb_attempt_count";
const ANON_ID_KEY = "forgessb_anonymous_id";

type WatResponse = { word: string; response: string };
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
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [accessState, setAccessState] = useState<AccessState>("checking");
  const [user, setUser] = useState<AuthUser>(null);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState<string>("your account");
  const [showFirstAttemptPrompt, setShowFirstAttemptPrompt] = useState(false);

  const [wordCount, setWordCount] = useState<(typeof PRACTICE_COUNTS)[number]>(10);
  const [mode, setMode] = useState<"timed" | "untimed">("timed");
  const [words, setWords] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState("");
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_WORD);
  const [allResponses, setAllResponses] = useState<WatResponse[]>([]);

  const [analysis, setAnalysis] = useState<ResultsAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const TOTAL_WORDS = words.length;
  const word = words[index];
  const isLast = index >= TOTAL_WORDS - 1;
  const isTimed = mode === "timed";
  const progressPct = TOTAL_WORDS > 0 ? ((index + 1) / TOTAL_WORDS) * 100 : 0;
  const timerPct = (timeLeft / SECONDS_PER_WORD) * 100;

  useEffect(() => {
    let settled = false;
    // Access check must never hang the UI forever (e.g. a stuck Supabase auth
    // call) — fail open to "allowed" after a timeout, same as the catch below.
    const failSafe = window.setTimeout(() => {
      if (!settled) setAccessState("allowed");
    }, 8000);
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
        const plan = await getUserPurchase(authUser.id);
        if (count >= 3 && !plan) {
          setAccessState("attempt_limit");
          return;
        }
        setAccessState("allowed");
      } catch {
        setAccessState("allowed");
      } finally {
        settled = true;
        window.clearTimeout(failSafe);
      }
    };
    void run();
    return () => window.clearTimeout(failSafe);
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
      inputRef.current?.focus();
    }
  }, [phase, index]);

  useEffect(() => {
    if (phase !== "test" || !isTimed || !word) return;
    if (timeLeft <= 0) {
      advance();
      return;
    }
    const timer = window.setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, isTimed, timeLeft, word]);

  useEffect(() => {
    if (phase !== "results" || !allResponses.length) return;
    const run = async () => {
      setLoadingAnalysis(true);
      try {
        const result = (await getFullTestAnalysis(allResponses)) as ResultsAnalysis;
        setAnalysis(result);
        const attemptId = sessionStorage.getItem("forgessb_current_attempt_id");
        if (attemptId) {
          const updated = await updateTestAttempt(
            attemptId,
            allResponses,
            result as unknown as object,
            allResponses.length
          );
          console.log("[wat_practice.results] updateTestAttempt result", updated);
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
        "wat_practice",
        undefined,
        undefined,
        undefined,
        authUser.email ?? undefined
      );
      if (attemptId) sessionStorage.setItem("forgessb_current_attempt_id", attemptId);
      sessionStorage.setItem("forgessb_attempt_in_progress", "true");
      const shuffled = [...WAT_WORDS].sort(() => Math.random() - 0.5).slice(0, wordCount);
      setWords(shuffled);
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
        "wat_practice"
      );
      if (attemptId) sessionStorage.setItem("forgessb_current_attempt_id", attemptId);
    } else {
      const count = await getTestAttempts(authUser.id);
      const plan = await getUserPurchase(authUser.id);
      if (count >= 3 && !plan) {
        setAccessState("attempt_limit");
        return;
      }
      const attemptId = await recordTestAttempt(
        authUser?.id,
        undefined,
        "wat_practice",
        undefined,
        undefined,
        undefined,
        authUser?.email ?? undefined
      );
      if (attemptId) sessionStorage.setItem("forgessb_current_attempt_id", attemptId);
      sessionStorage.setItem("forgessb_attempt_in_progress", "true");
    }

    const shuffled = [...WAT_WORDS].sort(() => Math.random() - 0.5).slice(0, wordCount);
    setWords(shuffled);
    setPhase("test");
    setIndex(0);
    setResponse("");
    setTimeLeft(SECONDS_PER_WORD);
    setAllResponses([]);
    setAnalysis(null);
    setError(null);
  }

  function advance() {
    if (!word) return;
    const updated = [...allResponses, { word, response: response.trim() }];
    setAllResponses(updated);
    if (isLast) {
      sessionStorage.setItem("wat_practice_responses", JSON.stringify(updated));
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
            Account Required
          </p>
          <h1 className="mt-4 font-serif text-3xl text-foreground sm:text-4xl">Save your progress</h1>
          <p className="mt-6 text-base leading-relaxed text-foreground/85">
            Sign in to track your OLQ profile across sessions and pick up where you left off.
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
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">Free Assessments Used</p>
          <h1 className="mt-4 font-serif text-3xl text-foreground sm:text-4xl">You have completed your 3 free assessments.</h1>
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-gold/80">
            Registered Account · {displayEmail}
          </p>
          {waitlistJoined ? (
            <p className="mt-6 text-base leading-relaxed text-foreground/85">
              You are on the list. We will be in touch at {displayEmail}.
            </p>
          ) : (
            <div className="mt-8">
              <button
                type="button"
                onClick={() => void notifyWaitlist()}
                disabled={waitlistLoading}
                className="inline-flex items-center justify-center border border-gold bg-gold/10 px-7 py-3.5 font-mono text-xs uppercase tracking-[0.22em] text-gold transition-all hover:bg-gold hover:text-primary-foreground disabled:opacity-60"
              >
                {waitlistLoading ? "Submitting..." : "Notify me"}
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
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-gold">WAT · Practice</p>
            <Link
              to="/tests/wat"
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
                Select word count and timing mode before commencing your WAT drill.
              </p>
              <div className="mt-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Word Count</p>
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
                  After completing all words, our AI will analyse your full response pattern and generate a comprehensive OLQ assessment.
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
                  {wordCount} words · <span className="text-gold">{isTimed ? "timed (15s/word)" : "untimed"}</span>
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
    const timerTone = timeLeft <= 4 ? "text-danger" : timeLeft <= 8 ? "text-amber" : "text-gold";
    const timerBarColour = timeLeft <= 4 ? "bg-danger" : timeLeft <= 8 ? "bg-amber" : "bg-gold";
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const timerText = `${mins}:${secs.toString().padStart(2, "0")}`;

    return (
      <div className="fixed inset-0 flex flex-col bg-background">
        <header className="border-b border-border/50 px-4 py-4 sm:px-8 sm:py-5">
          <div className="mx-auto flex max-w-5xl items-center gap-4 sm:gap-6">
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-gold">WAT · Practice Live</div>
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
              onClick={() => setShowEndConfirm(true)}
              className="shrink-0 border border-border/50 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
            >
              ✕ End
            </button>
          </div>
          {showEndConfirm && (
            <div className="mt-3 flex flex-col gap-3 border-t border-border/50 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-mono text-[11px] text-muted-foreground">
                End this session? Your progress will be lost.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate({ to: "/tests" })}
                  className="border border-gold bg-gold/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-gold transition-all hover:bg-gold hover:text-primary-foreground"
                >
                  Yes, End Session
                </button>
                <button
                  type="button"
                  onClick={() => setShowEndConfirm(false)}
                  className="px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </header>
        <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 sm:px-6">
          <div className="absolute inset-0 grid-texture opacity-40" aria-hidden="true" />
          <div className="relative w-full max-w-3xl">
            <p className="text-center font-mono text-[10px] uppercase tracking-[0.4em] text-gold/70">Stimulus</p>
            <h1
              key={index}
              className="animate-word-in mt-4 text-center font-serif font-semibold uppercase leading-none text-foreground sm:mt-6"
              style={{ fontSize: "clamp(2.5rem, 11vw, 7rem)", letterSpacing: "0.05em" }}
            >
              {word}
            </h1>
            <form onSubmit={handleSubmit} className="mt-8 sm:mt-12">
              <input
                ref={inputRef}
                type="text"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Your response..."
                autoComplete="off"
                className="w-full border-b-2 border-border bg-surface-1/40 px-4 py-3 text-center font-serif text-xl text-foreground placeholder:font-sans placeholder:text-sm placeholder:uppercase placeholder:tracking-[0.2em] placeholder:text-muted-foreground/70 focus:border-gold focus:bg-surface-1 focus:outline-none sm:px-5 sm:py-4 sm:text-2xl"
              />
              <div className="mt-4 flex items-center justify-center gap-4">
                <p className="hidden font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:block">
                  Press Enter to submit{isTimed ? " · Auto-advance on timer" : ""}
                </p>
                <button
                  type="submit"
                  className="sm:hidden border border-gold/60 bg-gold/10 px-8 py-3 font-mono text-xs uppercase tracking-[0.2em] text-gold active:bg-gold/20"
                >
                  Submit →
                </button>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:hidden">
                  {isTimed ? "Auto-advances on timer" : "Manual advance on submit"}
                </p>
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
          to="/tests/wat"
          className="border border-gold px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] text-gold hover:bg-gold hover:text-primary-foreground"
        >
          Return to Practice Hub
        </Link>
      </div>
    );
  }

  return (
    <TestResultsReport
      testType="wat"
      mode="practice"
      analysis={analysis}
      responses={allResponses}
      user={user}
      showFirstAttemptPrompt={showFirstAttemptPrompt}
      onSignIn={() => void signInWithGoogle()}
      showNav
    />
  );
}
