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
  ENDED_LINE,
  FAREWELL_LINE,
  INTERVIEW_SECONDS,
  LAPSE_LIMIT,
  MAX_EXCHANGES,
  OFFICER_NAME,
  OPENING_LINE,
  getInterviewAnalysis,
  getOfficerTurn,
  lapsePoints,
  type InterviewAnalysis,
  type InterviewTurn,
  type TurnKind,
} from "@/lib/interview-anthropic";
import { Corridor, OfficeScene, ROOM } from "@/components/interview/OfficeScene";
import { InterviewFile } from "@/components/interview/InterviewFile";
import { startListening, voiceInputSupported, type Listener } from "@/lib/voice";

export const Route = createFileRoute("/tests/interview/mock")({
  head: () => ({
    meta: [
      { title: "Mock Interview — ForgeSSB" },
      { name: "description", content: "A five-minute mock SSB personal interview with an AI interviewing officer." },
    ],
  }),
  component: MockInterviewPage,
});

const COUNT_KEY = "forgessb_interview_mock_count";
const STATE_KEY = "forgessb_interview_mock_state";
const MAX_ANSWER_CHARS = 2000;
const OFFICER_PLATE = "Col R. Menon";

type Access = "checking" | "allowed" | "limit";
type Phase = "intro" | "room" | "outside" | "results";
type Stage = "talking" | "farewell" | "ended";
type AnalysisState = "idle" | "pending" | "ready" | "error";
type AuthUser = { id: string; email?: string | null } | null;
type Saved = {
  turns: InterviewTurn[];
  question: string;
  kind: TurnKind;
  attemptId?: string;
  lapses: number;
  elapsed: number;
  closingAsked: boolean;
  stage: Stage;
  chestNo: number;
};

const btnPrimary =
  "inline-flex h-[52px] items-center justify-center gap-3 rounded-[4px] px-6 text-[17px] font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";
const btnSecondary =
  "inline-flex h-[48px] items-center justify-center gap-2 rounded-[4px] border px-5 text-[16px] transition-colors hover:bg-black/5 disabled:opacity-40";

// Roughly how long a person needs to take in a spoken line before it is gone.
const readingMs = (text: string) => Math.max(5000, 2500 + text.split(/\s+/).length * 340);

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  );
}

function formatLeft(sec: number) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function MockInterviewPage() {
  const [access, setAccess] = useState<Access>("checking");
  const [user, setUser] = useState<AuthUser>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [stage, setStage] = useState<Stage>("talking");
  const [turns, setTurns] = useState<InterviewTurn[]>([]);
  const [question, setQuestion] = useState(OPENING_LINE);
  const [kind, setKind] = useState<TurnKind>("rapport");
  const [draft, setDraft] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [lapseCount, setLapseCount] = useState(0);
  const [closingAsked, setClosingAsked] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>("idle");
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const canListen = voiceInputSupported();
  const [voiceMode, setVoiceMode] = useState(canListen);
  const [listening, setListening] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [chestNo, setChestNo] = useState(() => 9 + Math.floor(Math.random() * 28));
  const [micHeard, setMicHeard] = useState<string | null>(null);
  const [micTesting, setMicTesting] = useState(false);
  const [speechVisible, setSpeechVisible] = useState(true);
  const [repeats, setRepeats] = useState(0);
  const listenerRef = useRef<Listener | null>(null);
  const baseDraftRef = useRef("");
  const draftRef = useRef("");
  draftRef.current = draft;
  const attemptIdRef = useRef<string | undefined>(undefined);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const speechTimerRef = useRef<number | undefined>(undefined);

  const secondsLeft = INTERVIEW_SECONDS - elapsed;

  useEffect(() => {
    const run = async () => {
      try {
        setWaitlistJoined(localStorage.getItem("forgessb_waitlist_interview") === "true");
        const { data } = await supabase.auth.getUser();
        const authUser = (data.user as AuthUser) ?? null;
        setUser(authUser);

        const raw = sessionStorage.getItem(STATE_KEY);
        if (raw) {
          try {
            const s = JSON.parse(raw) as Saved;
            setTurns(s.turns);
            setQuestion(s.question);
            setKind(s.kind);
            setLapseCount(s.lapses);
            setElapsed(s.elapsed);
            setClosingAsked(s.closingAsked);
            setStage(s.stage);
            setChestNo(s.chestNo);
            attemptIdRef.current = s.attemptId;
            setAccess("allowed");
            if (s.stage !== "talking") {
              setPhase("outside");
              void runAnalysis(s.turns, s.stage === "ended");
            } else {
              setPhase("room");
            }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The clock runs only while it is the candidate's turn, not while the officer is thinking.
  useEffect(() => {
    if (phase !== "room" || stage !== "talking" || waiting) return;
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase, stage, waiting]);

  // What the officer says is said once: it fades after a normal reading time.
  useEffect(() => {
    if (phase !== "room" || stage !== "talking" || waiting) return;
    showSpeech();
    setRepeats(0);
    return () => window.clearTimeout(speechTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, phase, stage, waiting]);

  useEffect(() => {
    if (phase === "room" && !waiting && !voiceMode) inputRef.current?.focus();
  }, [question, waiting, phase, voiceMode]);

  useEffect(() => () => listenerRef.current?.stop(), []);

  function showSpeech() {
    window.clearTimeout(speechTimerRef.current);
    setSpeechVisible(true);
    speechTimerRef.current = window.setTimeout(() => setSpeechVisible(false), readingMs(question));
  }

  function askRepeat() {
    setRepeats((r) => r + 1);
    showSpeech();
  }

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
    const l = startListening({
      onText: (finalText, interim) => {
        setMicHeard((finalText + interim).trim());
        if (finalText.trim()) l?.stop();
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

  function persist(s: Partial<Saved> & Pick<Saved, "turns" | "question" | "kind" | "lapses" | "closingAsked" | "stage">) {
    const saved: Saved = { attemptId: attemptIdRef.current, elapsed, chestNo, ...s };
    sessionStorage.setItem(STATE_KEY, JSON.stringify(saved));
  }

  async function begin() {
    setError(null);
    if (!user) {
      getAnonymousId();
      localStorage.setItem(COUNT_KEY, "1");
    }
    try {
      attemptIdRef.current = await recordTestAttempt(user?.id, user ? undefined : getAnonymousId(), "interview_mock");
    } catch {
      attemptIdRef.current = undefined;
    }
    persist({ turns: [], question: OPENING_LINE, kind: "rapport", lapses: 0, closingAsked: false, stage: "talking", elapsed: 0 });
    setPhase("room");
  }

  async function runAnalysis(finalTurns: InterviewTurn[], endedEarly: boolean) {
    setAnalysisState("pending");
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
          // The notes are still shown if saving fails.
        }
      }
      sessionStorage.removeItem(STATE_KEY);
      setAnalysisState("ready");
    } catch {
      setAnalysisState("error");
    }
  }

  const isValid = (t: InterviewTurn) => t.conduct !== "lapse" && t.conduct !== "serious";

  async function submit() {
    const answer = draft.trim();
    if (!answer || waiting) return;
    stopMic();
    const pending: InterviewTurn[] = [...turns, { question, answer, kind, repeats: repeats || undefined }];
    setTurns(pending);
    setDraft("");
    setError(null);
    await resolveTurn(pending);
  }

  // Sends the latest answer to the officer, who judges its conduct and replies.
  async function resolveTurn(pending: InterviewTurn[]) {
    setWaiting(true);
    setError(null);
    const closingNow = closingAsked || secondsLeft <= 0 || pending.length >= MAX_EXCHANGES;
    try {
      const out = await getOfficerTurn({ turns: pending, secondsLeft, lapseCount, closing: closingNow });
      const lastIdx = pending.length - 1;
      const updated = pending.map((t, i) => (i === lastIdx ? { ...t, conduct: out.conduct, conductReason: out.reason } : t));
      const points = lapseCount + lapsePoints(out.conduct);
      setTurns(updated);
      setLapseCount(points);

      if (out.conduct !== "ok") {
        if (points >= LAPSE_LIMIT) {
          setStage("ended");
          setQuestion(ENDED_LINE);
          persist({ turns: updated, question: ENDED_LINE, kind, lapses: points, closingAsked, stage: "ended" });
          void runAnalysis(updated, true);
          return;
        }
        if (!out.say) throw new Error("empty reply");
        setQuestion(out.say);
        persist({ turns: updated, question: out.say, kind, lapses: points, closingAsked, stage: "talking" });
        return;
      }

      if (closingAsked) {
        setStage("farewell");
        setQuestion(FAREWELL_LINE);
        persist({ turns: updated, question: FAREWELL_LINE, kind: "closing", lapses: points, closingAsked: true, stage: "farewell" });
        void runAnalysis(updated, false);
        return;
      }

      if (!out.say) throw new Error("empty reply");
      const nowClosing = closingNow || out.kind === "closing";
      const nextKind: TurnKind = nowClosing ? "closing" : out.kind;
      setClosingAsked(nowClosing);
      setKind(nextKind);
      setQuestion(out.say);
      persist({ turns: updated, question: out.say, kind: nextKind, lapses: points, closingAsked: nowClosing, stage: "talking" });
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

  function leaveEarly(e: React.MouseEvent) {
    if (!window.confirm("Leave the interview now? It still counts as your free mock.")) {
      e.preventDefault();
      return;
    }
    stopMic();
    sessionStorage.removeItem(STATE_KEY);
  }

  const pageStyle = { background: ROOM.paper, color: ROOM.ink, fontFamily: ROOM.sans };
  const fontFix = "[&_h1]:[font-family:inherit] [&_h2]:[font-family:inherit]";

  if (access === "checking") {
    return (
      <div className="flex h-[100dvh] items-center justify-center px-6" style={pageStyle}>
        <p className="text-[18px]" style={{ color: ROOM.inkSoft }}>Getting the room ready…</p>
      </div>
    );
  }

  if (access === "limit") {
    return (
      <div className={`flex min-h-[100dvh] items-center justify-center px-6 py-16 ${fontFix}`} style={pageStyle}>
        <div className="w-full max-w-[620px] border p-8 sm:p-10" style={{ borderColor: ROOM.ruleStrong, background: ROOM.paperLight }}>
          <h1 className="m-0 text-[30px] font-bold leading-tight">You have had your free mock interview.</h1>
          <p className="mt-4 text-[17px] leading-relaxed" style={{ color: ROOM.inkSoft }}>
            Full interviews with a detailed report are coming.{" "}
            {user ? "Join the list and we will tell you first." : "Sign in to keep your notes and join the list."}
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
      <InterviewFile
        analysis={analysis}
        turns={turns}
        chestNo={chestNo}
        officerName={OFFICER_NAME}
        actions={
          <>
            {!user ? (
              <button type="button" onClick={() => void signInWithGoogle()} className={btnPrimary} style={{ background: ROOM.ink, color: ROOM.paper }}>
                Sign in to keep this file
              </button>
            ) : waitlistJoined ? (
              <p className="m-0 text-[16px]">You are on the list for full interviews.</p>
            ) : (
              <button type="button" onClick={() => void notifyWaitlist()} className={btnPrimary} style={{ background: ROOM.ink, color: ROOM.paper }}>
                Tell me when full interviews open
              </button>
            )}
            <Link to="/tests" className="text-[16px] underline underline-offset-4" style={{ color: ROOM.ink }}>
              Back to tests
            </Link>
          </>
        }
      />
    );
  }

  const topBar = (right: React.ReactNode) => (
    <header className="flex h-[52px] shrink-0 items-center justify-between gap-3 border-b px-4 md:px-7" style={{ borderColor: ROOM.rule, background: ROOM.paper }}>
      <p className="m-0 truncate text-[15px]">
        <strong>ForgeSSB</strong> <span className="hidden sm:inline" style={{ color: ROOM.inkMuted }}>· Personal interview, mock</span>
      </p>
      {right}
    </header>
  );

  if (phase === "intro" || phase === "outside") {
    const outside = phase === "outside";
    return (
      <div className={`flex h-[100dvh] flex-col overflow-hidden ${fontFix}`} style={pageStyle}>
        {topBar(
          outside ? null : (
            <Link to="/tests/interview" className="text-[15px] underline underline-offset-4" style={{ color: ROOM.ink }}>
              Back
            </Link>
          ),
        )}
        <main className="flex min-h-0 flex-1">
          <div className="hidden min-w-0 md:block" style={{ flex: "999 1 480px" }}>
            <Corridor />
          </div>
          <section className="flex w-full min-w-0 flex-col md:max-w-[540px]" style={{ flex: "1 1 420px" }}>
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-5 md:px-10 md:py-7">
            {outside ? (
              <>
                <p className="m-0 text-[15px]" style={{ color: ROOM.inkMuted }}>Chest No. {chestNo}</p>
                <h1 className="m-0 text-[30px] font-bold leading-[1.15] md:text-[34px]">You are back outside.</h1>
                <p className="m-0 text-[17px] leading-[1.6]" style={{ color: "#36332D" }}>
                  {stage === "ended"
                    ? "The officer ended the interview early. He is writing his notes on you, including why."
                    : "The door is shut. Colonel Menon is writing his notes on you. It takes up to a minute."}
                </p>
                {analysisState === "pending" && (
                  <p className="m-0 flex items-center gap-3 text-[16px]" style={{ color: ROOM.inkSoft }}>
                    <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full" style={{ background: ROOM.tape }} />
                    He is still writing.
                  </p>
                )}
                {analysisState === "ready" && (
                  <button type="button" onClick={() => setPhase("results")} className={`${btnPrimary} w-full`} style={{ background: ROOM.ink, color: ROOM.paper }}>
                    Open your file
                  </button>
                )}
                {analysisState === "error" && (
                  <>
                    <p className="m-0 text-[16px]" style={{ color: ROOM.tape }}>His notes could not be prepared. Your answers are kept.</p>
                    <button type="button" onClick={() => void runAnalysis(turns, stage === "ended")} className={btnPrimary} style={{ background: ROOM.ink, color: ROOM.paper }}>
                      Try again
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <div>
                  <p className="m-0 text-[15px]" style={{ color: ROOM.inkMuted }}>Chest No. {chestNo}</p>
                  <h1 className="m-0 mt-1 text-[28px] font-bold leading-[1.12] md:text-[32px]">Wait outside. You will be called in.</h1>
                </div>
                <p className="m-0 text-[16px] leading-[1.6]" style={{ color: "#36332D" }}>
                  {OFFICER_NAME} will interview you for five minutes. He is played by AI. Treat the room as real.
                </p>
                <ul className="m-0 flex list-disc flex-col gap-[6px] pl-5 text-[15px] leading-[1.5]" style={{ color: "#36332D" }}>
                  <li>He says each question once. Listen fully; you can ask him to repeat.</li>
                  <li>Address him as Sir. Answer in your own words, with real examples. He will dig into what you say.</li>
                  <li>Jokes, disrespect or nonsense are noted, and he can end the interview.</li>
                  <li>Once you knock, this counts as your one free mock.</li>
                </ul>

                {canListen && voiceMode && (
                  <div className="flex flex-col gap-2 border px-4 py-3" style={{ borderColor: ROOM.ruleStrong, background: ROOM.paperLight }}>
                    <p className="m-0 text-[15px] leading-[1.5]">
                      <strong>Check your microphone.</strong> Say it the way you will at the door: <em>May I come in, Sir?</em>
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <button type="button" onClick={testMic} disabled={micTesting} className={btnSecondary} style={{ borderColor: ROOM.ink, color: ROOM.ink }}>
                        <MicIcon />
                        {micTesting ? "Listening…" : "Test microphone"}
                      </button>
                      {micHeard !== null && (
                        <p className="m-0 text-[15px]" style={{ color: micHeard ? "#2E5D3F" : ROOM.tape }}>
                          {micHeard ? <><strong>Heard:</strong> {micHeard}</> : "Nothing heard. Check your microphone, or choose typing."}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <fieldset className="m-0 border-0 p-0">
                  <legend className="mb-2 text-[15px] font-bold">I will answer by</legend>
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
                    <p className="m-0 mt-2 text-[14px]" style={{ color: ROOM.inkMuted }}>Speaking needs Chrome, Edge or Safari. In this browser you will type.</p>
                  )}
                </fieldset>
                {voiceNote && <p className="m-0 text-[15px]" style={{ color: ROOM.tape }}>{voiceNote}</p>}
                {canListen && (
                  <p className="m-0 text-[13px] leading-[1.5]" style={{ color: ROOM.inkMuted }}>
                    Your browser turns speech into text (Google does this in Chrome). We keep only the text, never the audio.
                  </p>
                )}
              </>
            )}
            </div>
            {!outside && (
              <div className="shrink-0 border-t px-5 py-4 md:px-10" style={{ borderColor: ROOM.rule, background: ROOM.paper }}>
                <button type="button" onClick={() => void begin()} className={`${btnPrimary} w-full`} style={{ background: ROOM.ink, color: ROOM.paper }}>
                  Knock on the door
                </button>
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  // In the room.
  const timeUp = secondsLeft <= 0;
  const officerWriting = waiting;
  const pastTurns = turns;

  const header = topBar(
    <nav aria-label="Interview" className="flex items-center gap-4 text-[15px] md:gap-6" style={{ color: ROOM.inkSoft }}>
      <span aria-live="off" style={{ color: timeUp ? ROOM.tape : ROOM.ink, fontWeight: 700 }}>
        {stage !== "talking" ? "Finished" : timeUp ? "Time is up" : `${formatLeft(secondsLeft)} left`}
      </span>
      <button type="button" aria-expanded={recordOpen} onClick={() => setRecordOpen((v) => !v)} className="underline underline-offset-4" style={{ color: ROOM.ink, fontWeight: recordOpen ? 700 : 400 }}>
        Record
      </button>
      {stage === "talking" && (
        <Link to="/tests/interview" onClick={leaveEarly} className="underline underline-offset-4" style={{ color: ROOM.ink }}>
          Leave
        </Link>
      )}
    </nav>,
  );

  const record = recordOpen && (
    <aside aria-label="Record of the interview" className="fixed bottom-0 right-0 top-[52px] z-20 flex w-full flex-col border-l md:w-[440px]" style={{ background: "#FBF8EF", borderColor: ROOM.ruleStrong, boxShadow: "-10px 0 24px rgba(30,29,26,0.10)" }}>
      <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "#DDD5C3" }}>
        <div>
          <p className="m-0 text-[18px] font-bold">Record of interview</p>
          <p className="m-0 mt-[2px] text-[14px]" style={{ color: ROOM.inkMuted }}>Ch. No. {chestNo} · {OFFICER_PLATE} · answered questions only</p>
        </div>
        <button type="button" aria-label="Close the record" onClick={() => setRecordOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-[4px] border" style={{ borderColor: ROOM.ruleStrong, color: ROOM.ink }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
      <ol className="m-0 flex list-none flex-col gap-4 overflow-y-auto px-5 py-5 text-[14px] leading-[1.55]" style={{ fontFamily: ROOM.typed, color: "#2B2822" }}>
        {pastTurns.length === 0 && <li style={{ color: "#6E6A60" }}>Nothing answered yet.</li>}
        {pastTurns.map((t, i) => (
          <li key={i} className="flex flex-col gap-3">
            <span><strong>IO:</strong> {t.question}</span>
            <span className="border-l-2 pl-[14px]" style={{ borderColor: ROOM.rule }}><strong>Candidate:</strong> {t.answer}</span>
          </li>
        ))}
        {officerWriting && <li className="italic" style={{ color: "#6E6A60" }}>The officer is writing.</li>}
      </ol>
    </aside>
  );

  const speech = (() => {
    if (stage !== "talking") return { text: question, italic: false, hidden: false };
    if (waiting) return { text: "He writes something in your file.", italic: true, hidden: false };
    if (!speechVisible) return { text: "", italic: true, hidden: true };
    return { text: question, italic: false, hidden: false };
  })();

  const showAnswerBox = !voiceMode || listening || draft.trim().length > 0;

  return (
    <div className={`flex h-[100dvh] flex-col overflow-hidden ${fontFix}`} style={pageStyle}>
      {header}
      <div className="min-h-0 flex-1">
        <OfficeScene pose={officerWriting ? "writing" : "listening"} officerName={OFFICER_PLATE} />
      </div>

      <div aria-live="polite" className="flex min-h-[86px] shrink-0 flex-col justify-center gap-1 px-4 py-3 md:min-h-[96px] md:px-10" style={{ background: "#151513", color: "#FFFFFF" }}>
        <p className="m-0 text-[13px]" style={{ color: "#B9B3A5" }}>{OFFICER_PLATE}</p>
        {speech.hidden ? (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <p className="m-0 text-[17px] italic md:text-[19px]" style={{ color: "#C9C4B8" }}>He waits for your answer.</p>
            <button type="button" onClick={askRepeat} className="text-[16px] underline underline-offset-4" style={{ color: "#FFFFFF" }}>
              Sorry Sir, could you repeat that?
            </button>
          </div>
        ) : (
          <p className="m-0 text-[18px] leading-[1.5] md:text-[22px]" style={{ fontStyle: speech.italic ? "italic" : "normal" }}>
            {speech.text}
          </p>
        )}
      </div>

      <section className="shrink-0 px-4 py-4 md:px-10 md:py-5">
        {voiceNote && <p className="m-0 mb-2 text-[15px]" style={{ color: ROOM.tape }}>{voiceNote}</p>}

        {stage === "farewell" || stage === "ended" ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="m-0 text-[17px]" style={{ color: ROOM.inkSoft }}>
              {stage === "farewell" ? "Stand up, wish him, and leave the room." : "Stand up and leave the room."}
            </p>
            <button type="button" onClick={() => setPhase("outside")} className={btnPrimary} style={{ background: ROOM.ink, color: ROOM.paper }}>
              {stage === "farewell" ? "Thank you, Sir" : "Leave the room"}
            </button>
          </div>
        ) : error ? (
          <div className="flex flex-wrap items-center gap-5">
            <p className="m-0 text-[17px]">{error}</p>
            <button type="button" onClick={() => void resolveTurn(turns)} className={btnPrimary} style={{ background: ROOM.ink, color: ROOM.paper }}>
              Try again
            </button>
          </div>
        ) : waiting ? (
          <p className="m-0 py-3 text-[17px]" style={{ color: ROOM.inkSoft }}>Wait for him to look up. Sit straight.</p>
        ) : !showAnswerBox ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="m-0 text-[17px]" style={{ color: ROOM.inkSoft }}>
              {timeUp ? "Time is up. Answer this last one." : "Your turn. Take a breath, then answer as you would across the desk."}
            </p>
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
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              {voiceMode && listening && (
                <div role="img" aria-label="Microphone is on" className="flex h-[28px] items-end gap-1 pt-2">
                  {[10, 22, 16, 26, 12].map((h, i) => (
                    <span key={i} className="w-[5px] animate-pulse" style={{ height: h, background: ROOM.tape, animationDelay: `${i * 120}ms` }} />
                  ))}
                </div>
              )}
              <label className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-[14px]" style={{ color: ROOM.inkMuted }}>
                  {voiceMode ? "What he hears, as you speak. Fix any wrong word before you send." : "Your answer. Enter to send, Shift+Enter for a new line."}
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
                  className="w-full resize-none border px-3 py-2 text-[18px] leading-[1.45] outline-none md:text-[19px]"
                  style={{ borderColor: ROOM.ruleStrong, background: ROOM.paperLight, color: ROOM.ink, fontFamily: ROOM.sans }}
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-4">
              {voiceMode ? (
                <button type="button" onClick={() => (listening ? stopMic() : startMic())} className={`${btnSecondary} mr-auto`} style={{ borderColor: ROOM.ink, color: ROOM.ink }}>
                  {listening ? "Pause" : "Resume speaking"}
                </button>
              ) : (
                canListen && (
                  <button type="button" onClick={() => setVoiceMode(true)} className="mr-auto text-[16px] underline underline-offset-4" style={{ color: ROOM.ink }}>
                    Speak instead
                  </button>
                )
              )}
              <button type="button" onClick={() => void submit()} disabled={!draft.trim()} className={btnPrimary} style={{ background: ROOM.ink, color: ROOM.paper }}>
                I have finished
              </button>
            </div>
          </div>
        )}
      </section>
      {record}
    </div>
  );
}
