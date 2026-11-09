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
  CLOSING_LINE,
  LAPSE_LIMIT,
  MOCK_QUESTION_COUNT,
  OFFICER_NAME,
  OFFICER_SHORT,
  OPENING_QUESTION,
  getInterviewAnalysis,
  getOfficerTurn,
  lapsePoints,
  type InterviewAnalysis,
  type InterviewTurn,
} from "@/lib/interview-anthropic";
import { InterviewReport } from "@/components/results/InterviewReport";
import {
  cancelSpeech,
  speak,
  startListening,
  voiceInputSupported,
  voiceOutputSupported,
  type Listener,
} from "@/lib/voice";

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
  const [lapseCount, setLapseCount] = useState(0);
  const [closing, setClosing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(null);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const canListen = voiceInputSupported();
  // The officer stays silent for now: browser voices sound mechanical. Questions show as text.
  const canSpeak = false && voiceOutputSupported();
  const [voiceMode, setVoiceMode] = useState(canListen);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const listenerRef = useRef<Listener | null>(null);
  const cancelSpeechRef = useRef<(() => void) | null>(null);
  const spokenRef = useRef("");
  const baseDraftRef = useRef("");
  const draftRef = useRef("");
  draftRef.current = draft;
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
            const s = JSON.parse(saved) as {
              turns: InterviewTurn[];
              question: string;
              attemptId?: string;
              lapses?: number;
              finishing?: "ended" | "complete";
            };
            setTurns(s.turns);
            setQuestion(s.question);
            setLapseCount(s.lapses ?? 0);
            attemptIdRef.current = s.attemptId;
            if (s.finishing) {
              if (s.finishing === "ended") setClosing(CLOSING_LINE);
              setPhase("analysing");
              setAccess("allowed");
              void finish(s.turns, s.finishing === "ended");
              return;
            }
            spokenRef.current = `${s.turns.length}:${s.question}`;
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
    if (phase === "chat" && !waiting && !voiceMode) inputRef.current?.focus();
  }, [turns, question, waiting, phase]);

  function stopMic() {
    listenerRef.current?.stop();
    listenerRef.current = null;
    setListening(false);
  }

  function startMic() {
    if (listenerRef.current) return;
    baseDraftRef.current = draftRef.current.trim() ? `${draftRef.current.trim()} ` : "";
    setVoiceNote(null);
    const l = startListening({
      onText: (finalText, interim) =>
        setDraft((baseDraftRef.current + finalText + interim).slice(0, MAX_ANSWER_CHARS)),
      onError: (code) => {
        if (code === "not-allowed" || code === "service-not-allowed") {
          setVoiceNote("Microphone access is blocked, so you can type your answer instead.");
          setVoiceMode(false);
        } else if (code === "audio-capture") {
          setVoiceNote("No microphone was found, so you can type your answer instead.");
          setVoiceMode(false);
        } else if (code === "network") {
          setVoiceNote("Speech recognition lost its connection. Tap the microphone to try again, or type.");
        }
      },
      onEnd: () => {
        listenerRef.current = null;
        setListening(false);
      },
    });
    if (l) {
      listenerRef.current = l;
      setListening(true);
    } else {
      setVoiceNote("Voice input could not start, so you can type your answer instead.");
      setVoiceMode(false);
    }
  }

  function askAloud(text: string) {
    stopMic();
    cancelSpeechRef.current?.();
    if (!canSpeak) {
      startMic();
      return;
    }
    setSpeaking(true);
    cancelSpeechRef.current = speak(text, () => {
      setSpeaking(false);
      startMic();
    });
  }

  useEffect(() => {
    if (phase !== "chat" || !voiceMode || waiting || closing || turns.filter(isValid).length >= MOCK_QUESTION_COUNT) return;
    const key = `${turns.length}:${question}`;
    if (spokenRef.current === key) return;
    spokenRef.current = key;
    askAloud(question);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, question, turns.length, voiceMode, waiting]);

  useEffect(
    () => () => {
      listenerRef.current?.stop();
      cancelSpeechRef.current?.();
      cancelSpeech();
    },
    [],
  );

  function persist(
    nextTurns: InterviewTurn[],
    nextQuestion: string,
    lapses: number,
    finishing?: "ended" | "complete",
  ) {
    sessionStorage.setItem(
      STATE_KEY,
      JSON.stringify({ turns: nextTurns, question: nextQuestion, attemptId: attemptIdRef.current, lapses, finishing }),
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
    persist([], OPENING_QUESTION, 0);
    setPhase("chat");
  }

  async function finish(finalTurns: InterviewTurn[], endedEarly: boolean) {
    setPhase("analysing");
    setError(null);
    try {
      const result = await getInterviewAnalysis(finalTurns, endedEarly);
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

  const isValid = (t: InterviewTurn) => t.conduct !== "lapse" && t.conduct !== "serious";

  async function submit() {
    const answer = draft.trim();
    if (!answer || waiting) return;
    stopMic();
    cancelSpeechRef.current?.();
    setSpeaking(false);
    const pending = [...turns, { question, answer }];
    setTurns(pending);
    setDraft("");
    setError(null);
    await resolveTurn(pending);
  }

  // Sends the latest answer to the officer, who judges its conduct and replies.
  async function resolveTurn(pending: InterviewTurn[]) {
    setWaiting(true);
    setError(null);
    try {
      const lastIdx = pending.length - 1;
      const validBefore = pending.slice(0, lastIdx).filter(isValid).length;
      const out = await getOfficerTurn({ turns: pending, nextQuestionNumber: validBefore + 2, lapseCount });
      const updated = pending.map((t, i) =>
        i === lastIdx ? { ...t, conduct: out.conduct, conductReason: out.reason } : t,
      );
      const points = lapseCount + lapsePoints(out.conduct);
      setTurns(updated);
      setLapseCount(points);

      if (out.conduct !== "ok") {
        if (points >= LAPSE_LIMIT) {
          setClosing(CLOSING_LINE);
          persist(updated, question, points, "ended");
          if (canSpeak) cancelSpeechRef.current = speak(CLOSING_LINE, () => {});
          await finish(updated, true);
          return;
        }
        if (!out.say) throw new Error("empty reply");
        setQuestion(out.say);
        persist(updated, out.say, points);
        return;
      }

      if (validBefore + 1 >= MOCK_QUESTION_COUNT) {
        persist(updated, question, points, "complete");
        await finish(updated, false);
        return;
      }
      if (!out.say) throw new Error("empty reply");
      setQuestion(out.say);
      persist(updated, out.say, points);
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
          <h1 className="mt-3 font-serif text-3xl text-foreground sm:text-4xl">Before you enter</h1>
          <div className="mt-6 h-px w-20 bg-gold/50" />
          <p className="mt-6 text-sm leading-relaxed text-foreground/85">
            You will be interviewed by <span className="text-foreground">{OFFICER_NAME}</span>, a senior officer who has
            sat across from thousands of candidates. The officer is simulated by AI, but the room is meant to be taken
            as the real thing.
          </p>
          <ul className="mt-5 space-y-3 text-sm leading-relaxed text-foreground/85">
            <li>The interview has {MOCK_QUESTION_COUNT} questions in a fixed order: you, your family, your studies, your interests, why the forces, a failure, a decision, and the world around you. It takes 5 to 10 minutes.</li>
            <li>Address the officer as Sir. Answer in your own words, with real examples. There are no hints and no second tries.</li>
            <li>Your conduct is part of the assessment. Jokes, disrespect, abuse or nonsense are noted. Enough of them and the officer ends the interview, and that becomes your result.</li>
            <li>You get one free mock. Once you enter, it counts, so be ready, in a quiet place, sitting straight.</li>
          </ul>
          <div className="mt-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">How will you answer?</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {([true, false] as const).map((isVoice) => {
                const disabled = isVoice && !canListen;
                return (
                  <button
                    key={String(isVoice)}
                    type="button"
                    disabled={disabled}
                    onClick={() => setVoiceMode(isVoice)}
                    className={`border px-4 py-4 font-mono text-xs uppercase tracking-[0.2em] transition-all disabled:opacity-40 ${
                      voiceMode === isVoice
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-border bg-surface-1 text-foreground/70 hover:border-gold/40 hover:text-foreground"
                    }`}
                  >
                    {isVoice ? "Speak" : "Type"}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground/80">
              {canListen
                ? "Speaking uses your browser's built-in speech recognition and asks for microphone access. In Chrome the audio is processed by Google. ForgeSSB saves only the text of the conversation, never the audio. You can correct the text before you send each answer. Use headphones in a quiet place for the best result."
                : "Speaking needs Chrome, Edge or Safari. Your browser does not support it, so you will type your answers."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void begin()}
            className="mt-10 inline-flex w-full items-center justify-center gap-2 border border-gold bg-gold/10 px-7 py-3.5 text-center font-mono text-xs uppercase tracking-[0.22em] text-gold transition-all hover:bg-gold hover:text-primary-foreground sm:w-auto"
          >
            I am ready. Enter →
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
            onClick={() => void finish(turns, closing !== null)}
            className="mt-6 border border-gold bg-gold/10 px-6 py-3 font-mono text-xs uppercase tracking-[0.22em] text-gold hover:bg-gold hover:text-primary-foreground"
          >
            Try again
          </button>
        )}
      </section>
    );
  }

  const validCount = turns.filter(isValid).length;
  const answeredAll = closing !== null || validCount >= MOCK_QUESTION_COUNT;
  const number = Math.min(validCount + 1, MOCK_QUESTION_COUNT);

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
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">{OFFICER_NAME} · Interviewing Officer</p>
              <p className="mt-1 border border-border bg-surface-1 p-4 text-sm leading-relaxed text-foreground">{t.question}</p>
            </div>
            <div className="ml-auto max-w-[85%]">
              <p className="text-right font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">You</p>
              <p className="mt-1 whitespace-pre-wrap border border-gold/30 bg-gold/5 p-4 text-sm leading-relaxed text-foreground">{t.answer}</p>
            </div>
          </div>
        ))}

        {(!answeredAll || waiting) && !closing && (
          <div className="max-w-[85%]">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">{OFFICER_NAME} · Interviewing Officer</p>
            <p className="mt-1 border border-border bg-surface-1 p-4 text-sm leading-relaxed text-foreground">
              {waiting ? <span className="text-muted-foreground">The officer looks at his notes…</span> : question}
            </p>
          </div>
        )}
        {closing && (
          <div className="max-w-[85%]">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">{OFFICER_NAME} · Interviewing Officer</p>
            <p className="mt-1 border border-danger/40 bg-surface-1 p-4 text-sm leading-relaxed text-foreground">{closing}</p>
          </div>
        )}
        {error && (
          <div className="border border-danger/40 p-4 text-sm text-foreground/90">
            {error}{" "}
            <button type="button" onClick={() => void resolveTurn(turns)} className="ml-2 text-gold underline">
              Retry
            </button>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border/50 bg-background px-6 py-4">
        <div className="mx-auto w-full max-w-3xl">
          {voiceNote && <p className="mb-2 text-xs text-amber">{voiceNote}</p>}
          {voiceMode && !answeredAll && (
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={waiting || speaking}
                onClick={() => (listening ? stopMic() : startMic())}
                className={`border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] transition-all disabled:opacity-40 ${
                  listening
                    ? "border-danger bg-danger/10 text-danger"
                    : "border-gold bg-gold/10 text-gold hover:bg-gold hover:text-primary-foreground"
                }`}
              >
                {listening ? "● Listening. Tap to pause" : "Tap to speak"}
              </button>
              {canSpeak && (<button
                type="button"
                disabled={waiting}
                onClick={() => askAloud(question)}
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-gold disabled:opacity-40"
              >
                {speaking ? "Officer speaking…" : "Replay question"}
              </button>)}
              <button
                type="button"
                onClick={() => {
                  stopMic();
                  cancelSpeechRef.current?.();
                  setSpeaking(false);
                  setVoiceMode(false);
                }}
                className="ml-auto font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-gold"
              >
                Switch to typing
              </button>
            </div>
          )}
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={draft}
              maxLength={MAX_ANSWER_CHARS}
              rows={3}
              readOnly={listening}
              disabled={waiting || answeredAll}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submit();
                }
              }}
              placeholder={
                voiceMode
                  ? "Your spoken answer appears here. Fix any mistakes, then send."
                  : "Type your answer. Enter to send, Shift+Enter for a new line."
              }
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
    </div>
  );
}
