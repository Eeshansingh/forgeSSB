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
  OPENING_QUESTION,
  getInterviewAnalysis,
  getOfficerTurn,
  lapsePoints,
  type InterviewAnalysis,
  type InterviewTurn,
} from "@/lib/interview-anthropic";
import { InterviewReport } from "@/components/results/InterviewReport";
import { OfficeScene, ROOM } from "@/components/interview/OfficeScene";
import { startListening, voiceInputSupported, type Listener } from "@/lib/voice";

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
const OFFICER_PLATE = "Col R. Menon";

type Access = "checking" | "allowed" | "limit";
type Phase = "intro" | "chat" | "analysing" | "results";
type AuthUser = { id: string; email?: string | null } | null;

const btnPrimary =
  "inline-flex h-[54px] items-center justify-center gap-3 rounded-[4px] px-6 text-[18px] font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";
const btnSecondary =
  "inline-flex h-[50px] items-center justify-center rounded-[4px] border px-5 text-[17px] transition-colors hover:bg-black/5 disabled:opacity-40";

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  );
}

function formatClock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

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
  const [voiceMode, setVoiceMode] = useState(canListen);
  const [listening, setListening] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [chestNo] = useState(() => 9 + Math.floor(Math.random() * 28));
  const [micHeard, setMicHeard] = useState<string | null>(null);
  const [micTesting, setMicTesting] = useState(false);
  const listenerRef = useRef<Listener | null>(null);
  const baseDraftRef = useRef("");
  const draftRef = useRef("");
  draftRef.current = draft;
  const attemptIdRef = useRef<string | undefined>(undefined);
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
              startedAt?: number;
              finishing?: "ended" | "complete";
            };
            setTurns(s.turns);
            setQuestion(s.question);
            setLapseCount(s.lapses ?? 0);
            if (s.startedAt) setStartedAt(s.startedAt);
            attemptIdRef.current = s.attemptId;
            setAccess("allowed");
            if (s.finishing) {
              if (s.finishing === "ended") setClosing(CLOSING_LINE);
              void finish(s.turns, s.finishing === "ended");
              return;
            }
            setPhase("chat");
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
    if (phase !== "chat") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "chat" && !waiting && !voiceMode) inputRef.current?.focus();
  }, [question, waiting, phase, voiceMode]);

  useEffect(() => () => listenerRef.current?.stop(), []);

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
          setVoiceNote("Microphone access is blocked, so type your answer instead.");
          setVoiceMode(false);
        } else if (code === "audio-capture") {
          setVoiceNote("No microphone was found, so type your answer instead.");
          setVoiceMode(false);
        } else if (code === "network") {
          setVoiceNote("Speech recognition lost its connection. Press Resume to try again, or type.");
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
      setVoiceNote("Voice input could not start, so type your answer instead.");
      setVoiceMode(false);
    }
  }

  function testMic() {
    if (micTesting) return;
    setMicHeard(null);
    setMicTesting(true);
    let heard = "";
    const l = startListening({
      onText: (finalText, interim) => {
        heard = (finalText + interim).trim();
        setMicHeard(heard);
        if (finalText.trim()) {
          l?.stop();
        }
      },
      onError: (code) => {
        if (code === "not-allowed" || code === "service-not-allowed" || code === "audio-capture") {
          setMicHeard("");
          setVoiceMode(false);
          setVoiceNote("Microphone access is blocked or missing, so you will type your answers.");
        }
      },
      onEnd: () => setMicTesting(false),
    });
    if (!l) {
      setMicTesting(false);
      setVoiceMode(false);
      return;
    }
    window.setTimeout(() => l.stop(), 7000);
  }

  function persist(
    nextTurns: InterviewTurn[],
    nextQuestion: string,
    lapses: number,
    finishing?: "ended" | "complete",
  ) {
    sessionStorage.setItem(
      STATE_KEY,
      JSON.stringify({
        turns: nextTurns,
        question: nextQuestion,
        attemptId: attemptIdRef.current,
        lapses,
        startedAt,
        finishing,
      }),
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
    const t = Date.now();
    setStartedAt(t);
    setNow(t);
    sessionStorage.setItem(
      STATE_KEY,
      JSON.stringify({ turns: [], question: OPENING_QUESTION, attemptId: attemptIdRef.current, lapses: 0, startedAt: t }),
    );
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
      setError("The report could not be prepared. Your answers are kept.");
    }
  }

  const isValid = (t: InterviewTurn) => t.conduct !== "lapse" && t.conduct !== "serious";

  async function submit() {
    const answer = draft.trim();
    if (!answer || waiting) return;
    stopMic();
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
      setError("The officer could not reply.");
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

  function leave() {
    stopMic();
    sessionStorage.removeItem(STATE_KEY);
  }

  const pageStyle = { background: ROOM.paper, color: ROOM.ink, fontFamily: ROOM.sans };

  if (access === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center px-6" style={pageStyle}>
        <p className="text-[18px]" style={{ color: ROOM.inkSoft }}>Getting the room ready…</p>
      </div>
    );
  }

  if (access === "limit") {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-16" style={pageStyle}>
        <div className="w-full max-w-[620px] border p-8 sm:p-10" style={{ borderColor: ROOM.ruleStrong, background: ROOM.paperLight }}>
          <h1 className="m-0 text-[30px] font-bold leading-tight">You have had your free mock interview.</h1>
          <p className="mt-4 text-[17px] leading-relaxed" style={{ color: ROOM.inkSoft }}>
            Full interviews with a detailed report are coming.{" "}
            {user ? "Join the list and we will tell you first." : "Sign in to keep your report and join the list."}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            {!user ? (
              <button type="button" onClick={() => void signInWithGoogle()} className={btnPrimary} style={{ background: ROOM.ink, color: ROOM.paper }}>
                Sign in with Google
              </button>
            ) : waitlistJoined ? (
              <p className="m-0 text-[17px]">You are on the list. We will email {user.email}.</p>
            ) : (
              <button type="button" onClick={() => void notifyWaitlist()} className={btnPrimary} style={{ background: ROOM.ink, color: ROOM.paper }}>
                Notify me
              </button>
            )}
            <Link to="/tests" className="text-[16px] underline underline-offset-4" style={{ color: ROOM.ink }}>
              Back to tests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "results" && analysis) {
    return (
      <div className="min-h-screen bg-background text-foreground">
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
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="flex min-h-screen flex-col" style={pageStyle}>
        <header className="flex h-[52px] shrink-0 flex-wrap items-center justify-between gap-4 border-b px-5 md:px-7" style={{ borderColor: ROOM.rule }}>
          <p className="m-0 text-[15px]">
            <strong>ForgeSSB</strong> <span style={{ color: ROOM.inkMuted }}>· Personal interview, mock</span>
          </p>
          <Link to="/tests/interview" className="text-[15px] underline underline-offset-4" style={{ color: ROOM.ink }}>
            Back
          </Link>
        </header>

        <main className="flex flex-1 flex-wrap">
          <section aria-label="The corridor outside the interview room" className="relative hidden min-h-[640px] min-w-0 overflow-hidden md:block" style={{ flex: "999 1 520px", background: ROOM.wall }}>
            <div aria-hidden="true" className="absolute bottom-[120px] left-0 right-0 h-[230px]" style={{ background: "#6E8B74", borderTop: "6px solid #5B7862" }} />
            <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-[120px]" style={{ background: "#B9AE99", borderTop: "2px solid #A39880" }} />
            <div aria-hidden="true" className="absolute left-[7%] top-[70px] w-[200px] p-[10px]" style={{ background: "#8C6A49" }}>
              <div className="flex flex-col gap-2 p-[10px]" style={{ background: "#C9B79A" }}>
                <p className="m-0 px-3 py-[10px] text-[12px] leading-[1.45]" style={{ background: "#FBF9F3", fontFamily: ROOM.typed, transform: "rotate(-1.5deg)" }}>
                  Candidates will wait in silence and enter only when called.
                </p>
                <p className="m-0 px-3 py-2 text-[11px] leading-[1.4]" style={{ background: "#F3EEDF", fontFamily: ROOM.typed, transform: "rotate(1deg)" }}>
                  Board 2 · Interviews today: Ch. No. 9 to 36
                </p>
              </div>
            </div>
            <div className="absolute bottom-[120px] left-1/2 h-[520px] w-[300px] -translate-x-1/2 px-3 pt-3" style={{ background: "#5A3F2A" }}>
              <div className="relative flex h-full w-full flex-col gap-[18px] px-7 py-6" style={{ background: "#7A5838" }}>
                <div className="mx-5 mb-1 mt-1 py-2 text-center" style={{ background: "#151513" }}>
                  <p className="m-0 text-[14px] font-bold" style={{ color: "#F4F1E8" }}>Interviewing Officer</p>
                  <p className="m-0 text-[11px]" style={{ color: "#C9C4B8" }}>Board 2</p>
                </div>
                <div className="flex-1" style={{ border: "2px solid #694A2F" }} />
                <div className="flex-1" style={{ border: "2px solid #694A2F" }} />
                <div aria-hidden="true" className="absolute right-[22px] top-[54%] h-2 w-[26px] rounded-[2px]" style={{ background: "#B5B9BC" }} />
              </div>
              <div aria-hidden="true" className="absolute bottom-0 left-3 right-3 h-[3px]" style={{ background: "#FFF6D8" }} />
            </div>
            <div aria-hidden="true" className="absolute bottom-[120px] left-[9%] w-[260px]">
              <div className="h-[14px]" style={{ background: ROOM.wood }} />
              <div className="flex justify-between px-4">
                <div className="h-[48px] w-3" style={{ background: "#4E3624" }} />
                <div className="h-[48px] w-3" style={{ background: "#4E3624" }} />
              </div>
            </div>
            <div aria-hidden="true" className="absolute bottom-[120px] right-[8%] flex flex-col items-center">
              <div className="flex gap-2">
                {[0, 1].map((i) => (
                  <div key={i} className="flex h-[38px] w-[34px] items-center justify-center" style={{ background: "#B8322A", borderRadius: "0 0 14px 14px" }}>
                    <span className="text-[9px] font-bold" style={{ color: "#F6E9D8" }}>FIRE</span>
                  </div>
                ))}
              </div>
              <div className="mt-1 h-[6px] w-[94px]" style={{ background: "#3E3A33" }} />
              <div className="flex w-[80px] justify-between">
                <div className="h-[70px] w-1" style={{ background: "#3E3A33" }} />
                <div className="h-[70px] w-1" style={{ background: "#3E3A33" }} />
              </div>
            </div>
          </section>

          <section className="flex w-full flex-col gap-5 px-5 py-8 md:max-w-[560px] md:px-12 md:py-10" style={{ flex: "1 1 440px" }}>
            <div>
              <p className="m-0 text-[15px]" style={{ color: ROOM.inkMuted }}>Chest No. {chestNo}</p>
              <h1 className="m-0 mt-2 text-[32px] font-bold leading-[1.12] md:text-[36px]">Wait outside. You will be called in.</h1>
            </div>
            <p className="m-0 text-[17px] leading-[1.6]" style={{ color: "#36332D" }}>
              {OFFICER_NAME} will interview you: {MOCK_QUESTION_COUNT} questions, about ten minutes. He is played by AI, but
              treat the room as real. He has your file and he notices how you carry yourself.
            </p>
            <ul className="m-0 flex flex-col gap-2 pl-5 text-[16px] leading-[1.5]" style={{ color: "#36332D" }}>
              <li>Address him as Sir. Answer in your own words, with real examples.</li>
              <li>Jokes, disrespect or nonsense are noted. Enough of them and he ends the interview, and that is your result.</li>
              <li>Once you knock, this counts as your one free mock.</li>
            </ul>

            {canListen && voiceMode && (
              <div className="flex flex-col gap-3 border px-5 py-4" style={{ borderColor: ROOM.ruleStrong, background: ROOM.paperLight }}>
                <p className="m-0 text-[17px] font-bold">Check your microphone first</p>
                <p className="m-0 text-[16px] leading-[1.5]" style={{ color: "#36332D" }}>
                  Say it the way you will at the door: <em>May I come in, Sir?</em>
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <button type="button" onClick={testMic} disabled={micTesting} className={btnSecondary} style={{ borderColor: ROOM.ink, color: ROOM.ink }}>
                    <span className="mr-2"><MicIcon /></span>
                    {micTesting ? "Listening…" : "Test microphone"}
                  </button>
                  {micHeard !== null && (
                    <p className="m-0 text-[15px]" style={{ color: micHeard ? "#2E5D3F" : ROOM.tape }}>
                      {micHeard ? (
                        <>
                          <strong>Heard:</strong> {micHeard}
                        </>
                      ) : (
                        "Nothing heard. Check your microphone, or choose typing."
                      )}
                    </p>
                  )}
                </div>
              </div>
            )}

            <fieldset className="m-0 border-0 p-0">
              <legend className="mb-2 text-[16px] font-bold">I will answer by</legend>
              <div className="flex flex-wrap gap-6 text-[16px]">
                <label className={`flex items-center gap-2 ${canListen ? "" : "opacity-50"}`}>
                  <input type="radio" name="mode" checked={voiceMode} disabled={!canListen} onChange={() => setVoiceMode(true)} className="h-[18px] w-[18px]" style={{ accentColor: ROOM.ink }} />
                  Speaking
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="mode" checked={!voiceMode} onChange={() => setVoiceMode(false)} className="h-[18px] w-[18px]" style={{ accentColor: ROOM.ink }} />
                  Typing
                </label>
              </div>
              {!canListen && (
                <p className="m-0 mt-2 text-[14px]" style={{ color: ROOM.inkMuted }}>
                  Speaking needs Chrome, Edge or Safari. In this browser you will type.
                </p>
              )}
            </fieldset>
            {voiceNote && <p className="m-0 text-[15px]" style={{ color: ROOM.tape }}>{voiceNote}</p>}

            <button type="button" onClick={() => void begin()} className={`${btnPrimary} w-full`} style={{ background: ROOM.ink, color: ROOM.paper }}>
              Knock on the door
            </button>
            {canListen && (
              <p className="m-0 text-[14px] leading-[1.55]" style={{ color: ROOM.inkMuted }}>
                Your browser turns speech into text (Google does this in Chrome). We keep only the text, never the audio.
              </p>
            )}
          </section>
        </main>
      </div>
    );
  }

  const validCount = turns.filter(isValid).length;
  const qNumber = Math.min(validCount + (waiting ? 0 : 1), MOCK_QUESTION_COUNT);
  const officerWriting = waiting || phase === "analysing";
  const subtitle =
    phase === "analysing"
      ? closing ?? "Thank you. That will be all."
      : waiting
        ? "He writes something in your file."
        : question;
  const lastAnswer = turns.length ? turns[turns.length - 1] : null;

  const header = (
    <header className="flex h-[52px] shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 md:px-7" style={{ borderColor: ROOM.rule, background: ROOM.paper }}>
      <p className="m-0 hidden text-[15px] md:block">
        <strong>ForgeSSB</strong> <span style={{ color: ROOM.inkMuted }}>· Personal interview, mock</span>
      </p>
      <nav aria-label="Interview" className="flex items-center gap-4 text-[15px] md:gap-6" style={{ color: ROOM.inkSoft }}>
        <span>
          <strong style={{ color: ROOM.ink }}>Question {qNumber}</strong> of {MOCK_QUESTION_COUNT}
        </span>
        <span>{formatClock(now - startedAt)}</span>
        <button
          type="button"
          aria-expanded={recordOpen}
          onClick={() => setRecordOpen((v) => !v)}
          className="underline underline-offset-4"
          style={{ color: ROOM.ink, fontWeight: recordOpen ? 700 : 400 }}
        >
          Record
        </button>
        <Link to="/tests/interview" onClick={leave} className="underline underline-offset-4" style={{ color: ROOM.ink }}>
          Leave
        </Link>
      </nav>
    </header>
  );

  const record = recordOpen && (
    <aside
      aria-label="Record of the interview"
      className="fixed bottom-0 right-0 top-[52px] z-20 flex w-full flex-col border-l md:w-[440px]"
      style={{ background: "#FBF8EF", borderColor: ROOM.ruleStrong, boxShadow: "-10px 0 24px rgba(30,29,26,0.10)" }}
    >
      <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "#DDD5C3" }}>
        <div>
          <p className="m-0 text-[18px] font-bold">Record of interview</p>
          <p className="m-0 mt-[2px] text-[14px]" style={{ color: ROOM.inkMuted }}>
            Ch. No. {chestNo} · {OFFICER_PLATE}
          </p>
        </div>
        <button
          type="button"
          aria-label="Close the record"
          onClick={() => setRecordOpen(false)}
          className="flex h-11 w-11 items-center justify-center rounded-[4px] border"
          style={{ borderColor: ROOM.ruleStrong, color: ROOM.ink }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <ol className="m-0 flex list-none flex-col gap-4 overflow-y-auto px-5 py-5 text-[14px] leading-[1.55]" style={{ fontFamily: ROOM.typed, color: "#2B2822" }}>
        {turns.map((t, i) => (
          <li key={i} className="flex flex-col gap-3">
            <span>
              <strong>IO:</strong> {t.question}
            </span>
            <span className="border-l-2 pl-[14px]" style={{ borderColor: ROOM.rule }}>
              <strong>Candidate:</strong> {t.answer}
            </span>
          </li>
        ))}
        {phase === "chat" && !waiting && !closing && (
          <li>
            <strong>IO:</strong> {question}
          </li>
        )}
        {officerWriting && <li className="italic" style={{ color: "#6E6A60" }}>The officer is writing.</li>}
      </ol>
    </aside>
  );

  if (phase === "analysing") {
    return (
      <div className="flex min-h-screen flex-col" style={pageStyle}>
        {header}
        <OfficeScene pose="writing" subtitle={subtitle} subtitleItalic={!closing} officerName={OFFICER_PLATE} />
        <section className="flex flex-1 flex-col justify-center gap-4 px-5 py-6 md:px-10">
          {error ? (
            <>
              <p className="m-0 text-[18px]">{error}</p>
              <div>
                <button type="button" onClick={() => void finish(turns, closing !== null)} className={btnPrimary} style={{ background: ROOM.ink, color: ROOM.paper }}>
                  Try again
                </button>
              </div>
            </>
          ) : (
            <p className="m-0 text-[18px]" style={{ color: ROOM.inkSoft }}>
              Wait outside while he writes his notes. This takes up to half a minute.
            </p>
          )}
        </section>
        {record}
      </div>
    );
  }

  const showAnswerBox = !voiceMode || listening || draft.trim().length > 0;

  return (
    <div className="flex min-h-screen flex-col" style={pageStyle}>
      {header}
      <OfficeScene pose={officerWriting ? "writing" : "listening"} subtitle={subtitle} subtitleItalic={waiting} officerName={OFFICER_PLATE} />

      <section className="flex flex-1 flex-col gap-4 px-4 py-5 md:px-10 md:py-6">
        {voiceNote && <p className="m-0 text-[15px]" style={{ color: ROOM.tape }}>{voiceNote}</p>}

        {error ? (
          <div className="flex flex-wrap items-center gap-5">
            <p className="m-0 text-[18px]">{error}</p>
            <button type="button" onClick={() => void resolveTurn(turns)} className={btnPrimary} style={{ background: ROOM.ink, color: ROOM.paper }}>
              Try again
            </button>
          </div>
        ) : waiting ? (
          <div className="flex flex-col gap-2">
            <p className="m-0 text-[18px]" style={{ color: ROOM.inkSoft }}>Wait for him to look up. Sit straight.</p>
            {lastAnswer && (
              <p className="m-0 text-[15px]" style={{ color: ROOM.inkMuted }}>
                You said: {lastAnswer.answer.length > 180 ? `${lastAnswer.answer.slice(0, 180)}…` : lastAnswer.answer}
              </p>
            )}
          </div>
        ) : !showAnswerBox ? (
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="min-w-0" style={{ flex: "1 1 360px" }}>
              <p className="m-0 text-[22px] font-bold">Your turn.</p>
              <p className="m-0 mt-1 text-[16px] leading-[1.5]" style={{ color: ROOM.inkSoft }}>
                Take a breath, then answer the way you would across the desk.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <button type="button" onClick={startMic} className={btnPrimary} style={{ background: ROOM.ink, color: ROOM.paper }}>
                <MicIcon />
                Start answering
              </button>
              <button type="button" onClick={() => setVoiceMode(false)} className="text-[16px] underline underline-offset-4" style={{ color: ROOM.ink }}>
                Type instead
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-4">
              {voiceMode && listening && (
                <div role="img" aria-label="Microphone is on" className="flex h-[30px] items-end gap-1 pt-2">
                  {[10, 22, 16, 26, 12].map((h, i) => (
                    <span key={i} className="w-[5px] animate-pulse" style={{ height: h, background: ROOM.tape, animationDelay: `${i * 120}ms` }} />
                  ))}
                </div>
              )}
              <label className="flex min-w-0 flex-1 flex-col gap-[6px]">
                <span className="text-[14px]" style={{ color: ROOM.inkMuted }}>
                  {voiceMode
                    ? "What he hears, as you speak. Fix any wrong word before you send."
                    : "Your answer. Enter to send, Shift+Enter for a new line."}
                </span>
                <textarea
                  ref={inputRef}
                  value={draft}
                  maxLength={MAX_ANSWER_CHARS}
                  rows={3}
                  readOnly={listening}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (!voiceMode && e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void submit();
                    }
                  }}
                  className="w-full resize-none border px-[14px] py-3 text-[19px] leading-[1.45] outline-none md:text-[21px]"
                  style={{ borderColor: ROOM.ruleStrong, background: ROOM.paperLight, color: ROOM.ink, fontFamily: ROOM.sans }}
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-4">
              {voiceMode ? (
                <button
                  type="button"
                  onClick={() => (listening ? stopMic() : startMic())}
                  className={`${btnSecondary} mr-auto`}
                  style={{ borderColor: ROOM.ink, color: ROOM.ink }}
                >
                  {listening ? "Pause" : "Resume speaking"}
                </button>
              ) : (
                canListen && (
                  <button type="button" onClick={() => setVoiceMode(true)} className="mr-auto text-[16px] underline underline-offset-4" style={{ color: ROOM.ink }}>
                    Speak instead
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => void submit()}
                disabled={!draft.trim()}
                className={btnPrimary}
                style={{ background: ROOM.ink, color: ROOM.paper }}
              >
                I have finished
              </button>
            </div>
          </>
        )}
      </section>
      {record}
    </div>
  );
}
