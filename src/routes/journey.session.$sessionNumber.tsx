import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  supabase,
  getJourneyProfile,
  getSession,
  getBaselineScores,
  updateSessionStatus,
  hasJourneyAccess,
} from "@/lib/supabase";
import { JOURNEY } from "@/lib/journey-content";
import type { JourneySession, Profile } from "@/lib/journey-content";
import { evaluateBaseline } from "@/lib/anthropic";
import type { BaselineResult } from "@/lib/anthropic";

export const Route = createFileRoute("/journey/session/$sessionNumber")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SessionPage,
});

// ── Types ──────────────────────────────────────────────────────────────────────

type CalibStage = "mcq" | "srt" | "processing" | "report";
type ChallStep  = "insight" | "practice" | "result" | "reflection" | "mission" | "done";

// ── Constants ──────────────────────────────────────────────────────────────────

const CSS = `
.ssb-db {
  --bg: #0A0E0A;
  --s1: #1A2218;
  --s2: #212b1f;
  --fg: #E8EDE6;
  --muted: #8A9A84;
  --gold: #C9A84C;
  --gold-dim: rgba(201,168,76,0.10);
  --gold-b: rgba(201,168,76,0.28);
  --border: rgba(201,168,76,0.14);
  --border-2: rgba(232,237,230,0.055);
  --success: #5a9e6f;
  --danger: #c0392b;
  --serif: 'Playfair Display',Georgia,serif;
  --mono: 'JetBrains Mono',monospace;
  background: var(--bg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  color: var(--fg);
}
.ssb-db .db-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(10,14,10,.92);
  backdrop-filter: blur(12px);
  border-bottom: 0.5px solid var(--border);
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  flex-shrink: 0;
}
.ssb-db .db-wm {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--serif);
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  color: inherit;
}
.ssb-db .db-wm-forge { color: var(--gold); }
.ssb-db .db-wm-ssb { color: var(--fg); }
.ssb-db .label {
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: 0.30em;
  text-transform: uppercase;
  color: var(--muted);
}
.ssb-db .grid-tex {
  background-image: linear-gradient(rgba(201,168,76,0.025) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(201,168,76,0.025) 1px, transparent 1px);
  background-size: 40px 40px;
}
.ssb-db .btn-pay {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 15px 24px;
  border: none;
  background: var(--gold);
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.20em;
  text-transform: uppercase;
  color: var(--bg);
  cursor: pointer;
  font-weight: 500;
  transition: opacity .15s;
}
.ssb-db .btn-pay:hover { opacity: 0.88; }
.ssb-db .btn-g {
  background: none;
  border: 0.5px solid var(--border);
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--muted);
  padding: 8px 14px;
  cursor: pointer;
}
.ssb-db .btn-g:hover { color: var(--fg); }
.ssb-db .bl-opt {
  border: 0.5px solid var(--border-2);
  padding: 14px 16px;
  cursor: pointer;
  margin-bottom: 8px;
  transition: border-color .12s, background .12s;
}
.ssb-db .bl-opt:hover { border-color: rgba(201,168,76,.3); }
.ssb-db .bl-opt.selected {
  border-color: var(--gold);
  background: var(--gold-dim);
}
.ssb-db .ch-prog {
  display: flex;
  gap: 3px;
}
.ssb-db .ch-prog-seg {
  flex: 1;
  height: 2px;
  background: var(--border);
  transition: background .2s;
}
.ssb-db .ch-prog-seg.done { background: var(--gold); }
.ssb-db .ch-prog-seg.curr { background: rgba(201,168,76,.45); }
@keyframes ssb-scan {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(300%); }
}
`;

const BL_QUESTIONS: { q: string; opts: string[] }[] = [
  {
    q: "Your group is stuck. No one is leading. Deadline is approaching. You...",
    opts: [
      "Observe what's blocking them, then name it clearly so the group can move",
      "Propose a direction, invite pushback, and commit once there's rough agreement",
      "Step forward, assign roles, and start moving — the group can adjust as you go",
      "Find the most capable person in the room and actively back them to lead",
    ],
  },
  {
    q: "You spot an error in a plan your senior approved and already shared with the team. You...",
    opts: [
      "Brief your senior privately before execution begins so they can decide how to handle it",
      "Raise it with the full group — everyone is working from wrong information",
      "Correct your own portion carefully and document what you changed and why",
      "Verify your own understanding first, then raise it with your senior once you're certain",
    ],
  },
  {
    q: "Your team has been going for 18 hours. Morale is collapsing. You feel it too. You...",
    opts: [
      "Acknowledge the difficulty honestly, then refocus on what we're finishing together",
      "Redirect to the objective — how we feel matters less than what we complete",
      "Find one concrete win that's happened and make it visible to the group",
      "Call a short pause, let people breathe, then restart with a clear next step",
    ],
  },
  {
    q: "You have 30 seconds to make a call that affects everyone in your group. You...",
    opts: [
      "Make the call and own it completely — hesitation costs more than imperfection",
      "Get one quick input from whoever is closest to the problem, then decide",
      "Choose the most reversible option given what you know right now",
      "State two options out loud so the group understands your reasoning, then pick one",
    ],
  },
  {
    q: "A debate among strangers is getting heated. You have a clear, thought-out view. You...",
    opts: [
      "State your position directly and back it with a specific reason",
      "Ask a pointed question that steers the discussion toward what matters",
      "Wait for a natural pause, then lay out your view clearly and calmly",
      "Listen carefully first — your position will be sharper once you know where the others are wrong",
    ],
  },
  {
    q: "You're leading a task. One member is visibly struggling and slowing everyone down. You...",
    opts: [
      "Quietly absorb some of their load so the group keeps moving without friction",
      "Pair them with a stronger member and restructure the task around that",
      "Address it directly with the team — the group needs to adapt to what's actually happening",
      "Speak to them one-on-one, understand what's going wrong, and act on that",
    ],
  },
  {
    q: "A serious setback just undid two weeks of your preparation. You...",
    opts: [
      "Identify the exact point of failure and fix only that — everything else still holds",
      "Rebuild from first principles — if the foundation was wrong, so was everything on it",
      "Start moving again immediately — momentum is more valuable right now than a perfect plan",
      "Step back for a few hours to think clearly, then re-enter with a revised approach",
    ],
  },
  {
    q: "Someone in your group is being treated unfairly. Everyone else is choosing to ignore it. You...",
    opts: [
      "Intervene in the moment — staying silent when it matters makes you part of the problem",
      "Speak privately to the person affected, understand what they want, then act on that",
      "Raise it with the right authority afterwards — your role is to escalate, not inflame",
      "Address it directly with the person responsible once the immediate situation has passed",
    ],
  },
  {
    q: "Halfway through a briefing, you realise you stated a fact incorrectly three minutes ago. You...",
    opts: [
      "Stop, name the error calmly, correct it in one sentence, and keep going",
      "Complete the briefing, then send a clear written correction so there's a record",
      "Flag it at the next natural pause without interrupting the flow you've built",
      "Acknowledge it at the end: state what you said, what is correct, and why it matters",
    ],
  },
  {
    q: "You have one free hour. SSB is three weeks away. You...",
    opts: [
      "Work specifically on your weakest OLQ — an hour of targeted work beats a general session",
      "Run a full timed mock — WAT or SRT under real conditions, no pauses",
      "Rest completely — you perform better when your mind is sharp, not stuffed",
      "Do a short physical drill — your mental state at SSB depends on your physical state",
    ],
  },
];

const SRT_QUESTIONS = [
  "Your group is moving in the wrong direction and no one is correcting it. The deadline is close. What do you do?",
  "A friend makes a serious mistake in front of others. No one says anything. What do you do?",
  "Name the quality you know you need to work on most for SSB. In one sentence, say why — be specific.",
];

const OLQ_WAT_WORDS: Record<string, string[]> = {
  "Self Confidence":            ["DECIDE", "STAND", "OWN", "COMMIT", "SPEAK"],
  "Speed of Decision":          ["NOW", "CHOOSE", "FAST", "CALL", "MOMENT"],
  "Initiative":                 ["LEAD", "FIRST", "START", "PUSH", "ACT"],
  "Effective Intelligence":     ["THINK", "SOLVE", "ADAPT", "SHARP", "PLAN"],
  "Courage":                    ["FACE", "RISK", "TRUTH", "BOLD", "FEAR"],
  "Determination":              ["PUSH", "HOLD", "PERSIST", "WALL", "BACK"],
  "Sense of Responsibility":    ["DUTY", "OWN", "DELIVER", "CARRY", "ANSWER"],
  "Stamina & Fitness":          ["ENDURE", "PACE", "LAST", "GRIND", "SURVIVE"],
  "Reasoning Ability":          ["WHY", "LOGIC", "PATTERN", "CAUSE", "THINK"],
  "Organising Ability":         ["STRUCTURE", "ORDER", "ASSIGN", "BUILD", "PLAN"],
  "Power of Expression":        ["CLEAR", "DIRECT", "SPEAK", "WORD", "SHARP"],
  "Social Adaptability":        ["BLEND", "FIT", "SENSE", "ADJUST", "READ"],
  "Cooperation":                ["TEAM", "TOGETHER", "SUPPORT", "SHARE", "JOIN"],
  "Ability to Influence Group": ["CONVINCE", "RALLY", "UNITE", "GUIDE", "INSPIRE"],
  "Liveliness":                 ["ENERGY", "LIGHT", "SPARK", "RISE", "ALIVE"],
};

const ALL_OLQS = [
  "Effective Intelligence", "Reasoning Ability", "Organising Ability",
  "Power of Expression", "Social Adaptability", "Cooperation",
  "Sense of Responsibility", "Initiative", "Self Confidence",
  "Speed of Decision", "Ability to Influence Group", "Liveliness",
  "Determination", "Courage", "Stamina & Fitness",
];

const STATUS_LINES = [
  "Reading your responses...",
  "Mapping OLQ patterns...",
  "Writing your baseline report...",
];

// ── Pure helpers ───────────────────────────────────────────────────────────────

function resolveProfile(attemptNumber: number): Profile {
  if (attemptNumber === 1) return "fresher";
  if (attemptNumber === 2) return "repeater_1";
  return "repeater_2";
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function trimToWords(text: string, max: number): string {
  const words = text.trim().split(/\s+/);
  return words.slice(0, max).join(" ");
}

// ── SessionPage ────────────────────────────────────────────────────────────────

function SessionPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigate = useNavigate() as (opts: any) => void;
  const { sessionNumber } = Route.useParams();
  const n = parseInt(sessionNumber, 10);

  const [loading, setLoading]         = useState(true);
  const [userId, setUserId]           = useState("");
  const [profile, setProfile]         = useState<{ attempt_number: number; exam_type: string } | null>(null);
  const [baselineScores, setBaseline] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { navigate({ to: "/" }); return; }

      const [access, prof, row, baseline] = await Promise.all([
        hasJourneyAccess(data.user.id),
        getJourneyProfile(data.user.id),
        getSession(data.user.id, n),
        getBaselineScores(data.user.id),
      ]);

      if (!access) { navigate({ to: "/pricing" }); return; }
      if (!prof)   { navigate({ to: "/journey/onboarding" }); return; }
      if (!row)    { navigate({ to: "/journey/dashboard" }); return; }

      // Already complete (except session 1 which can be re-viewed in report state)
      if (row.status === "complete" && n !== 1) {
        navigate({ to: "/journey/dashboard" });
        return;
      }

      setUserId(data.user.id);
      setProfile({ attempt_number: prof.attempt_number, exam_type: prof.exam_type as string });
      setBaseline(baseline);
      setLoading(false);
    };
    void run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  const goHome = useCallback(() => navigate({ to: "/journey/dashboard" }), [navigate]);

  if (loading) {
    return (
      <>
        <style>{CSS}</style>
        <div className="ssb-db" style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 100, alignItems: "center", justifyContent: "center" }}>
          <p className="label">Loading</p>
        </div>
      </>
    );
  }

  if (!profile) return null;

  const journeyData = JOURNEY.find((s) => s.session_number === n) ?? null;

  // Reveal session → redirect
  if (journeyData?.session_type === "reveal") {
    navigate({ to: "/journey/reveal" });
    return null;
  }

  if (n === 1) {
    return (
      <CalibrationFlow
        userId={userId}
        profile={profile}
        goHome={goHome}
      />
    );
  }

  return (
    <ChallengeFlow
      userId={userId}
      sessionN={n}
      journeyData={journeyData}
      resolvedProfile={resolveProfile(profile.attempt_number)}
      baselineScores={baselineScores}
      goHome={goHome}
    />
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────────

function Nav({ label, onExit }: { label: string; onExit: () => void }) {
  return (
    <nav className="db-nav">
      <button className="db-wm" type="button" onClick={onExit}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
        <span>
          <span className="db-wm-forge">Forge</span>
          <span className="db-wm-ssb">SSB</span>
        </span>
      </button>
      <span className="label">{label}</span>
    </nav>
  );
}

// ── Progress bar ───────────────────────────────────────────────────────────────

function ProgressBar({
  qNum, total, done, right,
}: {
  qNum: string; total: number; done: number; right?: React.ReactNode;
}) {
  return (
    <div style={{ padding: "12px 24px 10px", borderBottom: "0.5px solid var(--border)", flexShrink: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <p className="label">{qNum}</p>
        {right ?? (
          <p className="label">{Math.round((done / total) * 100)}%</p>
        )}
      </div>
      <div style={{ display: "flex", gap: "2px" }}>
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: "2px",
              background:
                i < done
                  ? "var(--gold)"
                  : i === done
                    ? "rgba(201,168,76,.45)"
                    : "var(--border)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// CALIBRATION FLOW
// ════════════════════════════════════════════════════════════════════════════════

function CalibrationFlow({
  userId,
  profile,
  goHome,
}: {
  userId: string;
  profile: { attempt_number: number; exam_type: string };
  goHome: () => void;
}) {
  const [stage, setStage]             = useState<CalibStage>("mcq");
  const [mcqIndex, setMcqIndex]       = useState(0);
  const [mcqAnswers, setMcqAnswers]   = useState<Array<{ question: string; chosen_option: string }>>([]);
  const [mcqSelected, setMcqSelected] = useState<number | null>(null);
  const [srtIndex, setSrtIndex]       = useState(0);
  const [srtAnswers, setSrtAnswers]   = useState<Array<{ prompt: string; response: string }>>([]);
  const [srtText, setSrtText]         = useState("");
  const [srtTimer, setSrtTimer]       = useState(30);
  const [aiResult, setAiResult]       = useState<BaselineResult | null>(null);
  const [statusIdx, setStatusIdx]     = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // SRT timer: restart each time srtIndex changes while in srt stage
  useEffect(() => {
    if (stage !== "srt") return;
    setSrtTimer(30);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSrtTimer((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage, srtIndex]);

  // Processing status line cycle
  useEffect(() => {
    if (stage !== "processing") return;
    const id = setInterval(() => setStatusIdx((i) => (i + 1) % STATUS_LINES.length), 1500);
    return () => clearInterval(id);
  }, [stage]);

  // advanceSRT is stable via useCallback so the timer-0 effect can call it
  const advanceSRT = useCallback(
    (currentText: string, currentAnswers: Array<{ prompt: string; response: string }>, idx: number) => {
      if (timerRef.current) clearInterval(timerRef.current);
      const trimmed = trimToWords(currentText, 80);
      const answer = { prompt: SRT_QUESTIONS[idx], response: trimmed };
      const newAnswers = [...currentAnswers, answer];
      setSrtAnswers(newAnswers);
      setSrtText("");

      if (idx < SRT_QUESTIONS.length - 1) {
        setSrtIndex(idx + 1);
      } else {
        // Kick off AI
        setStage("processing");
        void runAI(mcqAnswers, newAnswers);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mcqAnswers],
  );

  // Auto-advance when timer hits 0
  useEffect(() => {
    if (stage === "srt" && srtTimer === 0) {
      advanceSRT(srtText, srtAnswers, srtIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srtTimer]);

  async function runAI(
    finalMcq: Array<{ question: string; chosen_option: string }>,
    finalSrt: Array<{ prompt: string; response: string }>,
  ) {
    try {
      const result = await evaluateBaseline({
        mcq_answers: finalMcq,
        srt_responses: finalSrt,
        profile: { exam_type: profile.exam_type, attempt_number: profile.attempt_number },
      });
      setAiResult(result);
    } catch (err) {
      console.error("[evaluateBaseline]", err);
      const defaults: Record<string, number> = {};
      ALL_OLQS.forEach((o) => { defaults[o] = 50; });
      setAiResult({
        olq_scores: defaults,
        patterns: ["We couldn't fully analyse your responses. Your scores are estimated."],
        development_areas: ["Review your responses and try again."],
        composite: 50,
        report: "Your responses have been recorded. Your calibration baseline has been set. Complete Day 2 tomorrow to begin your journey.",
      });
    }
    setStage("report");
  }

  async function saveAndNavigate() {
    if (!aiResult) return;
    try {
      await updateSessionStatus(userId, 1, "complete", {
        practice_scores: aiResult.olq_scores as Record<string, unknown>,
        ai_observation: aiResult.report,
        completed_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[saveBaseline]", err);
    }
    goHome();
  }

  function advanceMCQ() {
    if (mcqSelected === null) return;
    const answer = {
      question: BL_QUESTIONS[mcqIndex].q,
      chosen_option: BL_QUESTIONS[mcqIndex].opts[mcqSelected],
    };
    const newAnswers = [...mcqAnswers, answer];
    setMcqAnswers(newAnswers);
    setMcqSelected(null);
    if (mcqIndex < BL_QUESTIONS.length - 1) {
      setMcqIndex(mcqIndex + 1);
    } else {
      setStage("srt");
    }
  }

  const totalQ = BL_QUESTIONS.length + SRT_QUESTIONS.length; // 13
  const doneQ  =
    stage === "mcq" ? mcqIndex :
    stage === "srt" ? BL_QUESTIONS.length + srtIndex :
    totalQ;

  return (
    <>
      <style>{CSS}</style>
      <div className="ssb-db" style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 100 }}>
        <Nav label="Day 1 Calibration" onExit={goHome} />

        {/* ── MCQ Stage ── */}
        {stage === "mcq" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <ProgressBar
              qNum={`Question ${mcqIndex + 1} of ${totalQ}`}
              total={totalQ}
              done={doneQ}
            />
            <div style={{ padding: "28px 24px 20px" }}>
              <p className="label" style={{ marginBottom: "10px" }}>Scenario</p>
              <h2 style={{
                fontFamily: "var(--serif)",
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--fg)",
                lineHeight: 1.3,
              }}>
                {BL_QUESTIONS[mcqIndex].q}
              </h2>
            </div>
            <div style={{ flex: 1, padding: "0 24px", overflowY: "auto" }}>
              {BL_QUESTIONS[mcqIndex].opts.map((opt, i) => (
                <div
                  key={i}
                  className={`bl-opt${mcqSelected === i ? " selected" : ""}`}
                  onClick={() => setMcqSelected(i)}
                >
                  <p style={{
                    fontSize: "14px",
                    color: mcqSelected === i ? "var(--gold)" : "var(--fg)",
                    lineHeight: 1.55,
                  }}>
                    {opt}
                  </p>
                </div>
              ))}
            </div>
            <div style={{ padding: "16px 24px 32px", borderTop: "0.5px solid var(--border)" }}>
              <button
                className="btn-pay"
                type="button"
                onClick={advanceMCQ}
                style={{ opacity: mcqSelected === null ? 0.35 : 1, pointerEvents: mcqSelected === null ? "none" : "auto" }}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── SRT Stage ── */}
        {stage === "srt" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <ProgressBar
              qNum={`Question ${BL_QUESTIONS.length + srtIndex + 1} of ${totalQ}`}
              total={totalQ}
              done={doneQ}
              right={
                <span style={{
                  fontFamily: "var(--mono)",
                  fontSize: "22px",
                  fontWeight: 500,
                  color: srtTimer <= 10 ? "var(--danger)" : "var(--gold)",
                  lineHeight: 1,
                }}>
                  {srtTimer}s
                </span>
              }
            />
            <div style={{ padding: "28px 24px 20px" }}>
              <p className="label" style={{ marginBottom: "10px" }}>Situation</p>
              <h2 style={{
                fontFamily: "var(--serif)",
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--fg)",
                lineHeight: 1.35,
              }}>
                {SRT_QUESTIONS[srtIndex]}
              </h2>
            </div>
            <div style={{ flex: 1, padding: "0 24px" }}>
              <textarea
                value={srtText}
                onChange={(e) => setSrtText(e.target.value)}
                placeholder="Write your response..."
                rows={5}
                autoFocus
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  background: "var(--s1)",
                  border: "1px solid var(--border)",
                  fontFamily: "var(--serif)",
                  fontSize: "15px",
                  color: "var(--fg)",
                  lineHeight: 1.65,
                  resize: "none",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => { e.target.style.borderColor = "var(--gold-b)"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
              />
              <p style={{
                fontFamily: "var(--mono)",
                fontSize: "9px",
                letterSpacing: ".12em",
                color: "var(--muted)",
                textAlign: "right",
                marginTop: "4px",
              }}>
                {countWords(srtText)} words · auto-submits at 0s
              </p>
            </div>
            <div style={{ padding: "14px 24px 32px", borderTop: "0.5px solid var(--border)", display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                className="btn-pay"
                type="button"
                onClick={() => advanceSRT(srtText, srtAnswers, srtIndex)}
              >
                Submit & Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── Processing Stage ── */}
        {stage === "processing" && (
          <div
            className="grid-tex"
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", gap: "28px", textAlign: "center" }}
          >
            <div style={{ width: "80px", height: "2px", background: "var(--border)", position: "relative", overflow: "hidden" }}>
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                width: "40px",
                background: "var(--gold)",
                animation: "ssb-scan 1.4s ease-in-out infinite",
              }} />
            </div>
            <div>
              <p className="label" style={{ color: "var(--gold)", marginBottom: "10px" }}>Calibration Complete</p>
              <p style={{ fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: ".12em", color: "var(--muted)" }}>
                {STATUS_LINES[statusIdx]}
              </p>
            </div>
          </div>
        )}

        {/* ── Report Stage ── */}
        {stage === "report" && aiResult && (
          <BaselineReport result={aiResult} onComplete={saveAndNavigate} />
        )}
      </div>
    </>
  );
}

// ── Baseline Report ────────────────────────────────────────────────────────────

function BaselineReport({ result, onComplete }: { result: BaselineResult; onComplete: () => void }) {
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      {/* Scrollable content */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "36px 24px 0", gap: "20px", textAlign: "center" }}>

        {/* Header */}
        <div>
          <p className="label" style={{ color: "var(--gold)", marginBottom: "8px" }}>Calibration Complete</p>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "30px", fontWeight: 700, color: "var(--fg)", lineHeight: 1.1 }}>
            Your starting profile<br />is set.
          </h2>
          <p style={{ fontSize: "14px", color: "var(--muted)", marginTop: "10px", lineHeight: 1.65 }}>
            All 15 Officer Like Qualities have been mapped from your responses.
          </p>
        </div>

        {/* Locked radar */}
        <div style={{ position: "relative", width: "100%", maxWidth: "280px" }}>
          <svg viewBox="0 0 200 180" width="100%" style={{ filter: "blur(5px)", pointerEvents: "none", display: "block" }}>
            <polygon points="100,15 175,62 150,148 50,148 25,62" fill="none" stroke="rgba(201,168,76,.5)" strokeWidth="1"/>
            <polygon points="100,42 148,76 131,136 69,136 52,76" fill="none" stroke="rgba(201,168,76,.35)" strokeWidth="1"/>
            <polygon points="100,68 122,92 114,124 86,124 78,92" fill="none" stroke="rgba(201,168,76,.2)" strokeWidth="1"/>
            <line x1="100" y1="90" x2="100" y2="15"  stroke="rgba(201,168,76,.2)" strokeWidth="0.5"/>
            <line x1="100" y1="90" x2="175" y2="62"  stroke="rgba(201,168,76,.2)" strokeWidth="0.5"/>
            <line x1="100" y1="90" x2="150" y2="148" stroke="rgba(201,168,76,.2)" strokeWidth="0.5"/>
            <line x1="100" y1="90" x2="50"  y2="148" stroke="rgba(201,168,76,.2)" strokeWidth="0.5"/>
            <line x1="100" y1="90" x2="25"  y2="62"  stroke="rgba(201,168,76,.2)" strokeWidth="0.5"/>
            <polygon points="100,32 162,68 138,142 62,142 40,70" fill="rgba(201,168,76,.15)" stroke="rgba(201,168,76,.6)" strokeWidth="1.5"/>
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", background: "rgba(10,14,10,.45)" }}>
            <div style={{ width: "48px", height: "48px", border: "1px solid var(--gold-b)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="0"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <p style={{ fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: ".24em", textTransform: "uppercase", color: "var(--gold)" }}>
              Unlocks on Day 30
            </p>
            <p style={{ fontSize: "12px", color: "var(--muted)", maxWidth: "200px", lineHeight: 1.5 }}>
              Come back on Day 30 to see how much you've changed.
            </p>
          </div>
        </div>

        {/* Composite */}
        <div style={{ width: "100%", background: "var(--s1)", border: "0.5px solid var(--border)", padding: "16px 18px", textAlign: "left" }}>
          <p className="label" style={{ marginBottom: "6px" }}>Your Day 1 composite</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontFamily: "var(--serif)", fontSize: "36px", fontWeight: 700, color: "var(--muted)" }}>
              {result.composite}
            </span>
            <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)" }}>/100 · Starting point</span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px", lineHeight: 1.5 }}>
            {result.composite >= 70
              ? "Strong baseline. You have something to build from."
              : result.composite >= 55
                ? "Developing baseline. 30 days of honest work will move this."
                : "Typical for an unprepared aspirant. This is exactly where the work starts."}
          </p>
        </div>

        {/* AI Report */}
        <div style={{ width: "100%", border: "1px solid var(--gold)", background: "var(--s1)", padding: "20px", textAlign: "left" }}>
          <p className="label" style={{ marginBottom: "12px", color: "var(--gold)" }}>What we observed</p>
          <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "15px", color: "var(--fg)", lineHeight: 1.75 }}>
            {result.report}
          </p>
        </div>

        {/* Patterns */}
        {result.patterns.length > 0 && (
          <div style={{ width: "100%", textAlign: "left" }}>
            <p className="label" style={{ marginBottom: "10px" }}>Patterns in your responses</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {result.patterns.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <span style={{ color: "var(--gold)", fontFamily: "var(--mono)", fontSize: "11px", flexShrink: 0 }}>—</span>
                  <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.65 }}>{p}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Development areas */}
        {result.development_areas.length > 0 && (
          <div style={{ width: "100%", textAlign: "left" }}>
            <p className="label" style={{ marginBottom: "10px" }}>Your 30-day focus areas</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {result.development_areas.map((area, i) => (
                <div key={i} style={{
                  border: "0.5px solid var(--gold-b)",
                  padding: "10px 14px",
                  background: "var(--gold-dim)",
                }}>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: ".12em", color: "var(--gold)", lineHeight: 1.5 }}>
                    {area}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All 15 OLQ bars */}
        <div style={{ width: "100%", background: "var(--s1)", border: "0.5px solid var(--border)", padding: "16px 18px", textAlign: "left", marginBottom: "0" }}>
          <p className="label" style={{ marginBottom: "14px" }}>All 15 OLQs — Day 1 baseline</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {ALL_OLQS.map((olq) => {
              const score = Math.round(result.olq_scores[olq] ?? 50);
              return (
                <div key={olq}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>{olq}</span>
                    <span style={{
                      fontFamily: "var(--mono)",
                      fontSize: "10px",
                      color: score >= 70 ? "var(--gold)" : "var(--muted)",
                    }}>
                      {score}
                    </span>
                  </div>
                  <div style={{ height: "2px", background: "var(--border)", position: "relative" }}>
                    <div style={{
                      position: "absolute",
                      left: 0, top: 0, height: "100%",
                      width: `${score}%`,
                      background: score >= 70 ? "var(--gold)" : "rgba(138,154,132,.5)",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "20px 24px 36px", borderTop: "0.5px solid var(--border)", marginTop: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <button className="btn-pay" type="button" onClick={onComplete}>
          Begin Day 2 →
        </button>
        <p style={{
          fontFamily: "var(--mono)",
          fontSize: "9px",
          letterSpacing: ".15em",
          textTransform: "uppercase",
          color: "var(--muted)",
          textAlign: "center",
        }}>
          This profile is locked. It only exists to be beaten.
        </p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// CHALLENGE FLOW (sessions 2–30)
// ════════════════════════════════════════════════════════════════════════════════

function ChallengeFlow({
  userId,
  sessionN,
  journeyData,
  resolvedProfile,
  baselineScores,
  goHome,
}: {
  userId: string;
  sessionN: number;
  journeyData: JourneySession | null;
  resolvedProfile: Profile;
  baselineScores: Record<string, number> | null;
  goHome: () => void;
}) {
  const [step, setStep]                 = useState<ChallStep>("insight");
  const [reflText, setReflText]         = useState("");
  const [watWordIdx, setWatWordIdx]     = useState(0);
  const [watTimer, setWatTimer]         = useState(15);
  const [watInputs, setWatInputs]       = useState<string[]>(Array(5).fill(""));
  const [watCurrent, setWatCurrent]     = useState("");
  const [saving, setSaving]             = useState(false);
  const watTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const olqFocus    = journeyData?.olq_focus ?? "";
  const sessionType = journeyData?.session_type ?? "olq_drill";
  const hasWAT      = sessionType === "olq_drill" && olqFocus !== "" && OLQ_WAT_WORDS[olqFocus] !== undefined;
  const watWords    = hasWAT ? (OLQ_WAT_WORDS[olqFocus] ?? []) : [];
  const baselineScore = olqFocus && baselineScores ? (baselineScores[olqFocus] ?? null) : null;

  // WAT timer
  useEffect(() => {
    if (step !== "practice") return;
    setWatTimer(15);
    if (watTimerRef.current) clearInterval(watTimerRef.current);
    watTimerRef.current = setInterval(() => {
      setWatTimer((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => {
      if (watTimerRef.current) clearInterval(watTimerRef.current);
    };
  }, [step, watWordIdx]);

  // Auto-advance WAT word when timer hits 0
  useEffect(() => {
    if (step === "practice" && watTimer === 0) {
      advanceWAT();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watTimer]);

  function advanceWAT() {
    if (watTimerRef.current) clearInterval(watTimerRef.current);
    const newInputs = [...watInputs];
    newInputs[watWordIdx] = watCurrent;
    setWatInputs(newInputs);
    setWatCurrent("");

    if (watWordIdx < watWords.length - 1) {
      setWatWordIdx(watWordIdx + 1);
    } else {
      setStep("result");
    }
  }

  async function markComplete() {
    setSaving(true);
    try {
      await updateSessionStatus(userId, sessionN, "complete", {
        completed_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[markComplete]", err);
    }
    setSaving(false);
    setStep("done");
  }

  // Content helpers
  const pullQuote      = journeyData?.pull_quote?.[resolvedProfile] ?? "";
  const whatMeans      = journeyData?.what_this_means?.[resolvedProfile] ?? "";
  const whatLow        = journeyData?.what_low_looks?.[resolvedProfile] ?? "";
  const baselineNote   = journeyData?.baseline_note?.[resolvedProfile];
  const baselineNoteText = baselineScore !== null && baselineNote
    ? (baselineScore >= 65 ? baselineNote.strong : baselineNote.low).replace("[SCORE]", String(baselineScore))
    : null;
  const reflQuestion   = journeyData?.reflection?.question ?? "";
  const reflNudge      = journeyData?.reflection?.nudge?.replace("[WORD_COUNT]", String(countWords(reflText))) ?? "";
  const missionText    = journeyData?.mission ?? "";
  const nextJourney    = JOURNEY.find((s) => s.session_number === sessionN + 1) ?? null;

  // 4-segment progress header
  const stepToSeg: Record<ChallStep, number> = {
    insight: 1, practice: 2, result: 2, reflection: 3, mission: 4, done: 5,
  };
  const stepLabels: Record<ChallStep, string> = {
    insight: "Step 1 of 4 · Insight",
    practice: "Step 2 of 4 · Practice",
    result: "Step 2 of 4 · Practice",
    reflection: "Step 3 of 4 · Reflect",
    mission: "Step 4 of 4 · Mission",
    done: "Complete",
  };

  function ChallHeader() {
    const currSeg = stepToSeg[step] ?? 1;
    return (
      <div style={{ position: "sticky", top: "0", zIndex: 40, background: "rgba(10,14,10,.95)", borderBottom: "0.5px solid var(--border)", padding: "14px 24px 12px", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <p className="label">{stepLabels[step]}</p>
          <button className="btn-g" type="button" onClick={goHome}>✕ Exit</button>
        </div>
        <div className="ch-prog">
          {[1, 2, 3, 4].map((seg) => (
            <div
              key={seg}
              className={`ch-prog-seg${seg < currSeg ? " done" : seg === currSeg ? " curr" : ""}`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="ssb-db" style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 100 }}>
        {step !== "done" && <ChallHeader />}

        {/* ── Step 1: Insight ── */}
        {step === "insight" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ flex: 1, overflowY: "auto" }}>
              <div style={{ padding: "28px 24px", display: "flex", flexDirection: "column", gap: "18px" }}>

                {/* Title block */}
                <div>
                  <p className="label" style={{ color: "var(--gold)", marginBottom: "4px" }}>
                    Day {sessionN} · {journeyData?.cluster ? journeyData.cluster.charAt(0).toUpperCase() + journeyData.cluster.slice(1) : ""} Cluster
                  </p>
                  {olqFocus && (
                    <p style={{ fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: ".18em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "12px" }}>
                      Today's focus: {olqFocus}
                    </p>
                  )}
                  <p style={{ fontFamily: "var(--serif)", fontSize: "30px", fontWeight: 700, color: "var(--fg)" }}>
                    {olqFocus || (journeyData?.session_type ? journeyData.session_type.replace(/_/g, " ") : "Today")}
                  </p>
                </div>

                {/* Pull quote */}
                {pullQuote && (
                  <div style={{ borderLeft: "3px solid var(--gold)", padding: "16px 18px", background: "var(--s1)" }}>
                    <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "18px", color: "var(--gold)", lineHeight: 1.45 }}>
                      "{pullQuote}"
                    </p>
                  </div>
                )}

                {/* What this means */}
                {whatMeans && (
                  <div>
                    <p className="label" style={{ marginBottom: "10px" }}>What this means at SSB</p>
                    <p style={{ fontSize: "14px", color: "var(--fg)", lineHeight: 1.75 }}>{whatMeans}</p>
                  </div>
                )}

                {/* What low looks like */}
                {whatLow && (
                  <div style={{ background: "var(--s1)", border: "0.5px solid var(--border)", padding: "16px" }}>
                    <p className="label" style={{ marginBottom: "8px" }}>What low {olqFocus || "performance"} looks like</p>
                    <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.65 }}>{whatLow}</p>
                  </div>
                )}

                {/* Baseline score badge */}
                {baselineScore !== null && (
                  <div style={{ background: "var(--s1)", border: "0.5px solid var(--gold-b)", padding: "16px" }}>
                    <p className="label" style={{ color: "var(--gold)", marginBottom: "6px" }}>Your Day 1 baseline</p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                      <span style={{ fontFamily: "var(--serif)", fontSize: "32px", fontWeight: 700, color: "var(--muted)" }}>
                        {baselineScore}
                      </span>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)" }}>/100</span>
                    </div>
                    {baselineNoteText && (
                      <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "6px", lineHeight: 1.55 }}>
                        {baselineNoteText}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={{ flexShrink: 0, padding: "14px 24px 32px", borderTop: "0.5px solid var(--border)", background: "var(--bg)" }}>
              <button
                className="btn-pay"
                type="button"
                onClick={() => setStep(hasWAT ? "practice" : "reflection")}
              >
                Mark as Read → {hasWAT ? "Practice" : "Reflect"} →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: WAT Practice ── */}
        {step === "practice" && hasWAT && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "14px 20px", borderBottom: "0.5px solid var(--border)", background: "var(--s1)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div>
                <p className="label" style={{ marginBottom: "2px" }}>WAT Drill · {olqFocus} focus</p>
                <p style={{ fontSize: "11px", color: "var(--muted)" }}>
                  {watWords.length} words · 15 seconds each
                </p>
              </div>
              <span style={{ fontFamily: "var(--mono)", fontSize: "26px", fontWeight: 500, color: watTimer <= 5 ? "var(--danger)" : "var(--gold)" }}>
                {watTimer < 10 ? `0:0${watTimer}` : `0:${watTimer}`}
              </span>
            </div>

            <div className="grid-tex" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", gap: "20px" }}>
              <p className="label" style={{ color: "rgba(201,168,76,.5)" }}>
                Word {watWordIdx + 1} of {watWords.length}
              </p>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: "64px", fontWeight: 700, color: "var(--fg)", letterSpacing: "-.03em", textAlign: "center", lineHeight: 1, textTransform: "uppercase" }}>
                {watWords[watWordIdx]}
              </h2>
              <input
                type="text"
                value={watCurrent}
                autoFocus
                placeholder="Your response..."
                autoComplete="off"
                onChange={(e) => setWatCurrent(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); advanceWAT(); } }}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  background: "rgba(26,34,24,.4)",
                  border: "none",
                  borderBottom: "2px solid var(--border)",
                  fontFamily: "var(--serif)",
                  fontSize: "18px",
                  color: "var(--fg)",
                  textAlign: "center",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => { e.target.style.borderBottomColor = "var(--gold)"; }}
                onBlur={(e) => { e.target.style.borderBottomColor = "var(--border)"; }}
              />
              <p style={{ fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: ".20em", textTransform: "uppercase", color: "var(--muted)" }}>
                Enter to submit · Auto-advances on timer
              </p>
            </div>

            <div style={{ padding: "14px 24px 24px", borderTop: "0.5px solid var(--border)", flexShrink: 0 }}>
              {/* Word progress */}
              <div style={{ height: "2px", background: "var(--border)", marginBottom: "14px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${((watWordIdx) / watWords.length) * 100}%`, background: "var(--gold)" }} />
              </div>
              <button className="btn-pay" type="button" onClick={advanceWAT}>
                {watWordIdx < watWords.length - 1 ? "Next word →" : "Complete drill →"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2b: WAT Result ── */}
        {step === "result" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", gap: "22px", textAlign: "center" }}>
              <p className="label" style={{ color: "var(--gold)" }}>Practice Complete</p>
              <div style={{ background: "var(--s1)", border: "1px solid var(--gold-b)", padding: "28px 24px", width: "100%" }}>
                <p className="label" style={{ marginBottom: "10px" }}>{olqFocus} · Today's drill</p>
                {baselineScore !== null ? (
                  <>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "8px", marginBottom: "10px" }}>
                      <span style={{ fontFamily: "var(--serif)", fontSize: "36px", fontWeight: 700, color: "var(--muted)" }}>
                        {baselineScore}
                      </span>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--muted)" }}>/100 · Day 1</span>
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.65 }}>
                      Your responses have been noted. Keep working — scores update as you progress through the phase.
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.65 }}>
                    Drill complete. Complete Day 1 to calibrate your baseline scores.
                  </p>
                )}
              </div>
            </div>
            <div style={{ padding: "16px 24px 24px", borderTop: "0.5px solid var(--border)" }}>
              <button className="btn-pay" type="button" onClick={() => setStep("reflection")}>
                Continue to Reflection →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Reflection ── */}
        {step === "reflection" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, padding: "28px 24px", display: "flex", flexDirection: "column", gap: "18px", overflowY: "auto" }}>
              <div>
                <p className="label" style={{ color: "var(--gold)", marginBottom: "8px" }}>Day {sessionN} · Reflection</p>
                <h2 style={{ fontFamily: "var(--serif)", fontSize: "24px", fontWeight: 700, color: "var(--fg)", lineHeight: 1.25 }}>
                  {reflQuestion || `What did today's session reveal about your ${olqFocus || "practice"}?`}
                </h2>
                <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "8px", lineHeight: 1.65 }}>
                  One specific real moment. Not hypothetical. Not aspirational.
                </p>
              </div>

              <textarea
                value={reflText}
                onChange={(e) => setReflText(e.target.value)}
                rows={7}
                placeholder="Write here..."
                style={{
                  width: "100%",
                  padding: "16px",
                  background: "var(--s1)",
                  border: "1px solid var(--border)",
                  fontFamily: "var(--serif)",
                  fontSize: "14px",
                  color: "var(--fg)",
                  lineHeight: 1.7,
                  resize: "none",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => { e.target.style.borderColor = "var(--gold-b)"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
              />
              <p style={{ fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: ".12em", color: "var(--muted)", textAlign: "right", marginTop: "-10px" }}>
                {countWords(reflText)} words
              </p>

              {reflNudge && countWords(reflText) > 0 && (
                <div style={{ borderLeft: "2px solid rgba(201,168,76,.3)", padding: "10px 14px", background: "var(--s1)" }}>
                  <p style={{ fontSize: "13px", color: "rgba(201,168,76,.6)", fontStyle: "italic", fontFamily: "var(--serif)" }}>
                    {reflNudge}
                  </p>
                </div>
              )}

              <div style={{ borderLeft: "2px solid rgba(201,168,76,.3)", padding: "10px 14px", background: "var(--s1)" }}>
                <p style={{ fontSize: "13px", color: "rgba(201,168,76,.6)", fontStyle: "italic", fontFamily: "var(--serif)" }}>
                  This is the part that actually changes you. The drill trains the pattern. The reflection makes it stick.
                </p>
              </div>
            </div>

            <div style={{ padding: "14px 24px 24px", borderTop: "0.5px solid var(--border)", display: "flex", flexDirection: "column", gap: "8px" }}>
              <button className="btn-pay" type="button" onClick={() => setStep(missionText ? "mission" : "done")}>
                {missionText ? "Continue to Mission →" : `Mark Day ${sessionN} Complete →`}
              </button>
              <button
                className="btn-g"
                type="button"
                style={{ textAlign: "center", color: "rgba(138,154,132,.4)" }}
                onClick={() => setStep(missionText ? "mission" : "done")}
              >
                Skip reflection
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Mission ── */}
        {step === "mission" && missionText && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "32px 24px", gap: "24px" }}>
              <div>
                <p className="label" style={{ color: "var(--gold)", marginBottom: "6px" }}>Day {sessionN} · Mission</p>
                <p style={{ fontSize: "13px", color: "var(--muted)" }}>Before tomorrow. Offline. No tracking.</p>
              </div>
              <div style={{ background: "var(--s1)", border: "1px solid var(--gold-b)", padding: "28px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "var(--gold)", opacity: 0.5 }} />
                <p style={{ fontFamily: "var(--serif)", fontSize: "19px", color: "var(--fg)", lineHeight: 1.5 }}>
                  {missionText}
                </p>
              </div>
              <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.65 }}>
                A small act counts. The habit is the point.
              </p>
              <p className="label" style={{ color: "rgba(138,154,132,.35)" }}>Your word is enough. No check-in required.</p>
            </div>
            <div style={{ padding: "16px 24px 32px", borderTop: "0.5px solid var(--border)" }}>
              <button className="btn-pay" type="button" disabled={saving} onClick={markComplete}>
                {saving ? "Saving..." : `I'll do this → Mark Day ${sessionN} Complete`}
              </button>
            </div>
          </div>
        )}

        {/* ── Done ── */}
        {step === "done" && (
          <div className="grid-tex" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", gap: "24px", textAlign: "center" }}>
            <div style={{ width: "72px", height: "72px", border: "1px solid var(--gold-b)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
            </div>
            <div>
              <p className="label" style={{ color: "var(--gold)", marginBottom: "8px" }}>Day {sessionN} Complete</p>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: "32px", fontWeight: 700, color: "var(--fg)" }}>
                {olqFocus ? `${olqFocus}.` : "Done."}
              </h2>
              {nextJourney && (
                <p style={{ fontSize: "14px", color: "var(--muted)", marginTop: "8px", lineHeight: 1.65 }}>
                  Tomorrow: {nextJourney.olq_focus || nextJourney.session_type.replace(/_/g, " ")}. See you then.
                </p>
              )}
            </div>
            <button
              className="btn-g"
              type="button"
              style={{ maxWidth: "260px", padding: "12px 24px" }}
              onClick={goHome}
            >
              ← Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </>
  );
}
