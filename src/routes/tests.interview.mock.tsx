import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  getInterviewAttemptCount,
  recordTestAttempt,
  signInWithGoogle,
  supabase,
  updateTestAttempt,
} from "@/lib/supabase";
import { getAnonymousId } from "@/lib/anonymous-id";
import { ADMIN_EMAILS } from "@/lib/auth";
import { OLQS } from "@/lib/wat-data";
import {
  MOCK_QUESTION_COUNT,
  OPENING_QUESTION,
  getInterviewAnalysis,
  getInterviewerQuestion,
  type InterviewAnalysis,
  type InterviewTurn,
} from "@/lib/interview-anthropic";
import { InterviewReport } from "@/components/results/InterviewReport";

export const Route = createFileRoute("/tests/interview/mock")({
  head: () => ({
    meta: [
      { title: "Mock Interview — ForgeSSB" },
      { name: "description", content: "A short mock SSB personal interview with an AI interviewing officer." },
    ],
  }),
  component: MockInterviewPage,
});

const COUNT_KEY = "forgessb_interview_mock_count";
const STATE_KEY = "forgessb_interview_mock_state";
const MAX_ANSWER_CHARS = 1500;

type Access = "checking" | "allowed" | "limit";
type Phase = "intro" | "chat" | "analysing" | "results";
type AuthUser = { id: string; email?: string | null } | null;

function MockInterviewPage() {
  const [access, setAccess] = useState<Access>("checking");
  const [user, setUser] = useState<AuthUser>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [turns, setTurns] = useState<InterviewTurn[]>([]);
  const [question, setQuestion] = useState(OPENING_QUESTION);
  const [draft, setDraft] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(null);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const attemptIdRef = useRef<string | undefined>(undefined);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setWaitlistJoined(localStorage.getItem("forgessb_waitlist_interview") === "true");
        const { data } = await supabase.auth.getUser();
        const authUser = (data.user as AuthUser) ?? null;
        setUser(authUser);

        const saved = sessionStorage.getItem(STATE_KEY);
        if (saved) {
          try {
            const s = JSON.parse(saved) as { turns: InterviewTurn[]; question: string; attemptId?: string };
            setTurns(s.turns);
            setQuestion(s.question);
            attemptIdRef.current = s.attemptId;
            setPhase("chat");
            setAccess("allowed");
            return;
          } catch {
            sessionStorage.removeItem(STATE_KEY);
          }
        }

        if (authUser && ADMIN_EMAILS.includes(authUser.email ?? "")) {
          setAccess("allowed");
          return;
        }
        const used = authUser
          ? await getInterviewAttemptCount(authUser.id)
          : Number(localStorage.getItem(COUNT_KEY) ?? "0") || 0;
        setAccess(used >= 1 ? "limit" : "allowed");
      } catch {
        setAccess("allowed");
      }
    };
    void run();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    if (phase === "chat" && !waiting) inputRef.current?.focus();
  }, [turns, question, waiting, phase]);

  function persist(nextTurns: InterviewTurn[], nextQuestion: string) {
    sessionStorage.setItem(
      STATE_KEY,
      JSON.stringify({ turns: nextTurns, question: nextQuestion, attemptId: attemptIdRef.current }),
    );
  }

  async function begin() {
    setError(null);
    if (!user) {
      getAnonymousId();
      localStorage.setItem(COUNT_KEY, "1");
    }
    try {
      attemptIdRef.current = await recordTestAttempt(
        user?.id,
        user ? undefined : getAnonymousId(),
        "interview_mock",
      );
    } catch {
      attemptIdRef.current = undefined;
    }
    persist([], OPENING_QUESTION);
    setPhase("chat");
  }

  async function finish(finalTurns: InterviewTurn[]) {
    setPhase("analysing");
    setError(null);
    try {
      const result = await getInterviewAnalysis(finalTurns);
      setAnalysis(result);
      const scores = OLQS.map((o) => result.olq_scores?.[o] ?? 0);
      const composite = Math.round(scores.reduce((a, b) => a + b, 0) / OLQS.length);
      if (attemptIdRef.current) {
        try {
          await updateTestAttempt(
            attemptIdRef.current,
            finalTurns.map((t) => ({ word: t.question, response: t.answer })),
            result as unknown as object,
            finalTurns.length,
            composite,
          );
        } catch {
          // The report is still shown if saving fails.
        }
      }
      sessionStorage.removeItem(STATE_KEY);
      setPhase("results");
    } catch {
      setError("The report could not be generated. Your answers are kept. Try again.");
    }
  }

  async function submit() {
    const answer = draft.trim();
    if (!answer || waiting) return;
    const nextTurns = [...turns, { question, answer }];
    setTurns(nextTurns);
    setDraft("");
    setError(null);
    if (nextTurns.length >= MOCK_QUESTION_COUNT) {
      persist(nextTurns, question);
      await finish(nextTurns);
      return;
    }
    await askNext(nextTurns);
  }

  async function askNext(nextTurns: InterviewTurn[]) {
    setWaiting(true);
    try {
      const q = await getInterviewerQuestion(nextTurns, nextTurns.length + 1);
      setQuestion(q);
      persist(nextTurns, q);
    } catch {
      setError("The officer could not reply. Try again.");
    } finally {
      setWaiting(false);
    }
  }

  async function notifyWaitlist() {
    if (!user?.email) return;
    try {
      await supabase.from("waitlist").insert({ user_id: user.id, email: user.email, source: "interview" });
      localStorage.setItem("forgessb_waitlist_interview", "true");
      setWaitlistJoined(true);
    } catch {
      // ignore
    }
  }

  if (access === "checking") {
    return (
      <section className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">Preparing</p>
        <p className="mt-4 text-foreground/80">Getting your interview ready.</p>
      </section>
    );
  }

  if (access === "limit") {
    return (
      <section className="mx-auto max-w-3xl px-6 py-20">
        <div className="border border-gold/40 bg-surface-1/70 p-8 sm:p-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">Free mock used</p>
          <h1 className="mt-4 font-serif text-3xl text-foreground sm:text-4xl">You have done your free mock interview.</h1>
          <p className="mt-6 text-base leading-relaxed text-foreground/85">
            Full interview plans with detailed reports are coming. {user ? "Join the list and we will tell you first." : "Sign in to keep your report and join the list."}
          </p>
          <div className="mt-8">
            {!user ? (
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                className="inline-flex items-center justify-center border border-gold bg-gold/10 px-7 py-3.5 font-mono text-xs uppercase tracking-[0.22em] text-gold transition-all hover:bg-gold hover:text-primary-foreground"
              >
                Sign In With Google
              </button>
            ) : waitlistJoined ? (
              <p className="text-base text-foreground/85">You are on the list. We will email {user.email}.</p>
            ) : (
              <button
                type="button"
                onClick={() => void notifyWaitlist()}
                className="inline-flex items-center justify-center border border-gold bg-gold/10 px-7 py-3.5 font-mono text-xs uppercase tracking-[0.22em] text-gold transition-all hover:bg-gold hover:text-primary-foreground"
              >
                Notify me
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (phase === "results" && analysis) {
    return (
      <InterviewReport analysis={analysis} isSignedIn={!!user} onSignIn={() => void signInWithGoogle()}>
        {user && !waitlistJoined && (
          <section className="mt-6 border border-border bg-surface-1/60 p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold">Full interviews</p>
            <p className="mt-3 text-sm leading-relaxed text-foreground/85">
              Longer interviews with a detailed report are coming. Join the list and we will tell you first.
            </p>
            <button
              type="button"
              onClick={() => void notifyWaitlist()}
              className="mt-5 inline-flex items-center justify-center border border-gold bg-gold/10 px-6 py-3 font-mono text-xs uppercase tracking-[0.22em] text-gold transition-all hover:bg-gold hover:text-primary-foreground"
            >
              Notify me
            </button>
          </section>
        )}
        <div className="mt-8 text-center">
          <Link to="/tests" className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground hover:text-gold">
            ← Back to tests
          </Link>
        </div>
      </InterviewReport>
    );
  }

  if (phase === "intro") {
    return (
      <section className="mx-auto max-w-2xl px-6 py-16">
        <div className="border border-border bg-surface-1/50 p-8 sm:p-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">Mock Interview</p>
          <h1 className="mt-3 font-serif text-3xl text-foreground sm:text-4xl">Before you begin</h1>
          <div className="mt-6 h-px w-20 bg-gold/50" />
          <ul className="mt-6 space-y-3 text-sm leading-relaxed text-foreground/85">
            <li>The officer will ask {MOCK_QUESTION_COUNT} questions, one at a time. It takes 5 to 8 minutes.</li>
            <li>Answer the way you would out loud: in your own words, with real examples.</li>
            <li>There is no going back and no hints. The report comes at the end.</li>
            <li>You do not need to prepare or fill in any form.</li>
          </ul>
          <button
            type="button"
            onClick={() => void begin()}
            className="mt-10 inline-flex w-full items-center justify-center gap-2 border border-gold bg-gold/10 px-7 py-3.5 text-center font-mono text-xs uppercase tracking-[0.22em] text-gold transition-all hover:bg-gold hover:text-primary-foreground sm:w-auto"
          >
            Enter the room →
          </button>
        </div>
      </section>
    );
  }

  if (phase === "analysing") {
    return (
      <section className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">
          {error ? "Report not ready" : "Thank you. That will be all."}
        </p>
        <p className="mt-4 text-foreground/80">
          {error ?? "The officer is making notes. This can take up to 30 seconds."}
        </p>
        {error && (
          <button
            type="button"
            onClick={() => void finish(turns)}
            className="mt-6 border border-gold bg-gold/10 px-6 py-3 font-mono text-xs uppercase tracking-[0.22em] text-gold hover:bg-gold hover:text-primary-foreground"
          >
            Try again
          </button>
        )}
      </section>
    );
  }

  const answeredAll = turns.length >= MOCK_QUESTION_COUNT;
  const number = Math.min(turns.length + 1, MOCK_QUESTION_COUNT);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50 px-6 py-5">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-gold">
            Mock Interview · Question {number} of {MOCK_QUESTION_COUNT}
          </p>
          <Link
            to="/tests/interview"
            onClick={() => sessionStorage.removeItem(STATE_KEY)}
            className="border border-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:border-gold/40 hover:text-foreground"
          >
            End
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-6 py-8">
        {turns.map((t, i) => (
          <div key={i} className="space-y-4">
            <div className="max-w-[85%]">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">Interviewing Officer</p>
              <p className="mt-1 border border-border bg-surface-1 p-4 text-sm leading-relaxed text-foreground">{t.question}</p>
            </div>
            <div className="ml-auto max-w-[85%]">
              <p className="text-right font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">You</p>
              <p className="mt-1 whitespace-pre-wrap border border-gold/30 bg-gold/5 p-4 text-sm leading-relaxed text-foreground">{t.answer}</p>
            </div>
          </div>
        ))}

        {!answeredAll && (
          <div className="max-w-[85%]">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">Interviewing Officer</p>
            <p className="mt-1 border border-border bg-surface-1 p-4 text-sm leading-relaxed text-foreground">
              {waiting ? <span className="text-muted-foreground">The officer is thinking…</span> : question}
            </p>
          </div>
        )}
        {error && (
          <div className="border border-danger/40 p-4 text-sm text-foreground/90">
            {error}{" "}
            <button type="button" onClick={() => void askNext(turns)} className="ml-2 text-gold underline">
              Retry
            </button>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border/50 bg-background px-6 py-4">
        <div className="mx-auto flex w-full max-w-3xl items-end gap-3">
          <textarea
            ref={inputRef}
            value={draft}
            maxLength={MAX_ANSWER_CHARS}
            rows={3}
            disabled={waiting || answeredAll}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
            placeholder="Type your answer. Enter to send, Shift+Enter for a new line."
            className="min-h-[76px] flex-1 resize-none border border-border bg-surface-1 p-3 text-sm text-foreground outline-none focus:border-gold/60 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => void submit()}
            disabled={waiting || answeredAll || !draft.trim()}
            className="border border-gold bg-gold/10 px-5 py-3 font-mono text-xs uppercase tracking-[0.22em] text-gold transition-all hover:bg-gold hover:text-primary-foreground disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
