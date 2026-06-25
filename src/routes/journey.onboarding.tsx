import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  supabase,
  createJourneyProfile,
  createSession,
  getAllSessions,
  hasJourneyAccess,
} from "@/lib/supabase";
import { JOURNEY } from "@/lib/journey-content";

export const Route = createFileRoute("/journey/onboarding")({
  head: () => ({
    meta: [{ title: "Journey Setup — ForgeSSB" }],
  }),
  component: OnboardingPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

type ExamType = "nda" | "cds" | "afcat" | "ta";
type FailureReason =
  | "psych"
  | "gto"
  | "interview"
  | "dont_know"
  | "everywhere";
type RawStep = 1 | 2 | 3 | 4;

// ── Prototype design system (scoped to .ssb-ob) ───────────────────────────────

const CSS = `
.ssb-ob {
  --bg: #0A0E0A;
  --s1: #1A2218;
  --s2: #212b1f;
  --fg: #E8EDE6;
  --muted: #8A9A84;
  --gold: #C9A84C;
  --gold-dim: rgba(201,168,76,0.10);
  --gold-b: rgba(201,168,76,0.28);
  --border: rgba(201,168,76,0.14);
  --danger: #c0392b;
  --serif: 'Playfair Display',Georgia,serif;
  --mono: 'JetBrains Mono',monospace;
  background: var(--bg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  color: var(--fg);
}
.ssb-ob .ob-nav {
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
.ssb-ob .ob-wm {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--serif);
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  color: inherit;
  text-decoration: none;
  background: none;
  border: none;
  padding: 0;
}
.ssb-ob .ob-wm-star { color: var(--gold); }
.ssb-ob .ob-wm-forge { color: var(--gold); }
.ssb-ob .ob-wm-ssb { color: var(--fg); }
.ssb-ob .ob-exit {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.ssb-ob .ob-exit:hover { color: var(--fg); }
.ssb-ob .ob-screen {
  display: flex;
  flex: 1;
  flex-direction: column;
}
.ssb-ob .ob-progress { padding: 20px 24px 0; }
.ssb-ob .ob-step-label {
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: 0.30em;
  text-transform: uppercase;
  color: var(--muted);
}
.ssb-ob .ob-prog-bar { display: flex; gap: 4px; margin-top: 10px; }
.ssb-ob .ob-prog-seg { height: 2px; flex: 1; background: var(--border); }
.ssb-ob .ob-prog-seg.done { background: var(--gold); }
.ssb-ob .ob-body {
  flex: 1;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow-y: auto;
}
.ssb-ob .ob-q {
  font-family: var(--serif);
  font-size: 30px;
  font-weight: 700;
  color: var(--fg);
  line-height: 1.1;
  margin-bottom: 8px;
}
.ssb-ob .ob-hint {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.6;
  margin-bottom: 28px;
}
.ssb-ob .ob-opt-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
}
.ssb-ob .ob-opt-cell {
  background: var(--s1);
  padding: 20px;
  cursor: pointer;
  transition: background .12s;
  border: none;
  text-align: left;
}
.ssb-ob .ob-opt-cell:hover { background: var(--s2); }
.ssb-ob .ob-opt-cell.selected {
  background: var(--gold-dim);
  outline: 1px solid var(--gold);
  outline-offset: -1px;
}
.ssb-ob .ob-opt-abbr {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: .22em;
  color: var(--gold);
  margin-bottom: 6px;
}
.ssb-ob .ob-opt-name {
  font-family: var(--serif);
  font-size: 16px;
  color: var(--fg);
  margin-bottom: 4px;
}
.ssb-ob .ob-opt-desc { font-size: 11px; color: var(--muted); line-height: 1.4; }
.ssb-ob .ob-opts {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
}
.ssb-ob .ob-opt {
  background: var(--s1);
  padding: 18px 20px;
  cursor: pointer;
  transition: background .12s;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: none;
  border-left: 2px solid transparent;
  text-align: left;
}
.ssb-ob .ob-opt:hover { background: var(--s2); }
.ssb-ob .ob-opt.selected {
  background: var(--gold-dim);
  border-left-color: var(--gold);
}
.ssb-ob .ob-opt-h { font-family: var(--serif); font-size: 17px; color: var(--fg); }
.ssb-ob .ob-opt-sub { font-size: 12px; color: var(--muted); line-height: 1.5; }
.ssb-ob .ob-date-input {
  width: 100%;
  padding: 16px;
  background: var(--s1);
  border: 1px solid var(--border);
  font-family: var(--mono);
  font-size: 16px;
  color: var(--fg);
  box-sizing: border-box;
  color-scheme: dark;
}
.ssb-ob .ob-date-input:focus { outline: none; border-color: var(--gold-b); }
.ssb-ob .ob-countdown {
  background: var(--s1);
  border: 1px solid var(--gold-b);
  padding: 20px;
  text-align: center;
  margin-top: 16px;
}
.ssb-ob .ob-cd-val {
  font-family: var(--serif);
  font-size: 52px;
  font-weight: 700;
  color: var(--gold);
  line-height: 1;
}
.ssb-ob .ob-cd-lbl {
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: .25em;
  text-transform: uppercase;
  color: var(--muted);
  margin-top: 4px;
}
.ssb-ob .ob-footer {
  padding: 20px 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ssb-ob .ob-skip { text-align: center; margin-top: 4px; }
.ssb-ob .ob-error {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--danger);
}
.ssb-ob .btn-p {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 15px 24px;
  border: 1px solid var(--gold);
  background: var(--gold-dim);
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.20em;
  text-transform: uppercase;
  color: var(--gold);
  cursor: pointer;
  transition: all .18s;
}
.ssb-ob .btn-p:hover:not(:disabled) { background: var(--gold); color: var(--bg); }
.ssb-ob .btn-p:disabled { opacity: 0.6; cursor: not-allowed; }
.ssb-ob .btn-g {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-align: center;
  width: 100%;
}
.ssb-ob .btn-g:hover { color: var(--fg); }
.ssb-ob .ob-payoff {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  text-align: center;
}
.ssb-ob .payoff-icon { color: var(--gold); margin-bottom: 20px; }
.ssb-ob .payoff-kicker {
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: .32em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 12px;
}
.ssb-ob .payoff-h {
  font-family: var(--serif);
  font-size: 36px;
  font-weight: 700;
  color: var(--fg);
  line-height: 1.05;
  margin-bottom: 10px;
}
.ssb-ob .payoff-sub { font-size: 14px; color: var(--muted); line-height: 1.7; }
`;

// ── Component ─────────────────────────────────────────────────────────────────

function OnboardingPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [step, setStep] = useState<RawStep>(1);
  const [examType, setExamType] = useState<ExamType | null>(null);
  const [attemptNumber, setAttemptNumber] = useState<number | null>(null);
  const [failureReason, setFailureReason] = useState<FailureReason | null>(
    null,
  );
  const [boardDate, setBoardDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { void navigate({ to: "/" }); return; }
      const access = await hasJourneyAccess(data.user.id);
      if (!access) { void navigate({ to: "/pricing" }); return; }
      setUserId(data.user.id);
      setChecking(false);
    };
    void run();
  }, [navigate]);

  if (checking) {
    return (
      <>
        <style>{CSS}</style>
        <div
          className="ssb-ob"
          style={{ alignItems: "center", justifyContent: "center" }}
        >
          <p
            style={{
              fontFamily: "var(--mono)",
              fontSize: "9px",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "var(--muted)",
            }}
          >
            Verifying Access
          </p>
        </div>
      </>
    );
  }

  const isRepeater = attemptNumber !== null && attemptNumber > 1;
  const totalSteps = isRepeater || attemptNumber === null ? 4 : 3;
  const displayStep = step === 4 && !isRepeater ? 3 : step;
  const progressSegs = Array.from(
    { length: totalSteps },
    (_, i) => i < displayStep,
  );

  function advanceFromAttempt(n: number) {
    setAttemptNumber(n);
    setFailureReason(null);
    if (n === 1) {
      setStep(4);
    } else {
      setStep(3);
    }
  }

  async function submit() {
    if (!userId || !examType || !attemptNumber) return;
    setSubmitting(true);
    setError(null);
    try {
      await createJourneyProfile({
        user_id: userId,
        exam_type: examType,
        attempt_number: attemptNumber,
        failure_reason: attemptNumber >= 2 ? failureReason : null,
        board_date: boardDate || null,
      });

      const existing = await getAllSessions(userId);
      if (existing.length === 0) {
        await Promise.all(
          JOURNEY.map((s) =>
            createSession({
              user_id: userId!,
              session_number: s.session_number,
              cluster: s.cluster,
              olq_focus: s.olq_focus,
              session_type: s.session_type,
            }),
          ),
        );
      }

      void navigate({ to: "/journey/dashboard" });
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const validDaysLeft = (() => {
    if (!boardDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(boardDate);
    if (isNaN(target.getTime())) return null;
    const diff = Math.ceil(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diff > 0 ? diff : null;
  })();

  return (
    <>
      <style>{CSS}</style>
      <div className="ssb-ob">
        {/* ── Nav ──────────────────────────────────────────────────────────── */}
        <nav className="ob-nav">
          <button
            className="ob-wm"
            onClick={() => void navigate({ to: "/" })}
            type="button"
          >
            <svg
              className="ob-wm-star"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
            <span>
              <span className="ob-wm-forge">Forge</span>
              <span className="ob-wm-ssb">SSB</span>
            </span>
          </button>
          <button
            className="ob-exit"
            type="button"
            onClick={() => void navigate({ to: "/" })}
          >
            ← Exit
          </button>
        </nav>

        {submitting ? (
          /* ── Payoff screen while seeding ─────────────────────────────── */
          <div className="ob-payoff">
            <div className="payoff-icon">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              >
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
            </div>
            <p className="payoff-kicker">Setting up your journey</p>
            <h2 className="payoff-h">
              Your 30-day
              <br />
              path begins now.
            </h2>
            <p className="payoff-sub">
              Building your personalised session path…
            </p>
          </div>
        ) : (
          /* ── Steps ───────────────────────────────────────────────────── */
          <div className="ob-screen">
            {/* Progress */}
            <div className="ob-progress">
              <p className="ob-step-label">
                Step {displayStep} of {totalSteps} · Journey Setup
              </p>
              <div className="ob-prog-bar">
                {progressSegs.map((done, i) => (
                  <div
                    key={i}
                    className={`ob-prog-seg${done ? " done" : ""}`}
                  />
                ))}
              </div>
            </div>

            {/* ── Step 1: Exam type ────────────────────────────────────── */}
            {step === 1 && (
              <div className="ob-body">
                <h2 className="ob-q">
                  Which exam are you preparing for?
                </h2>
                <p className="ob-hint">
                  Your 30-day path is built around the format you'll face.
                  Pick the one that matters.
                </p>
                <div className="ob-opt-grid">
                  {(
                    [
                      {
                        value: "nda" as ExamType,
                        abbr: "NDA",
                        name: "National Defence Academy",
                        desc: "After Class 12. Youngest cohort, longest career.",
                      },
                      {
                        value: "cds" as ExamType,
                        abbr: "CDS",
                        name: "Combined Defence Services",
                        desc: "For graduates entering as officers.",
                      },
                      {
                        value: "afcat" as ExamType,
                        abbr: "AFCAT",
                        name: "Air Force Common Admission",
                        desc: "IAF officer entry — technical and flying.",
                      },
                      {
                        value: "ta" as ExamType,
                        abbr: "TA",
                        name: "Territorial Army",
                        desc: "Citizen soldiers. Part-time commissioned service.",
                      },
                    ] as const
                  ).map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      className={`ob-opt-cell${examType === o.value ? " selected" : ""}`}
                      onClick={() => {
                        setExamType(o.value);
                        setStep(2);
                      }}
                    >
                      <div className="ob-opt-abbr">{o.abbr}</div>
                      <div className="ob-opt-name">{o.name}</div>
                      <div className="ob-opt-desc">{o.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 2: Attempt number ───────────────────────────────── */}
            {step === 2 && (
              <>
                <div className="ob-body">
                  <h2 className="ob-q">Have you been to SSB before?</h2>
                  <p className="ob-hint">
                    Be honest. Your journey adapts to where you actually
                    are — not where you want to be.
                  </p>
                  <div className="ob-opts">
                    {(
                      [
                        {
                          value: 1,
                          h: "First time",
                          sub: "You're going in without a reference point. We'll build one.",
                        },
                        {
                          value: 2,
                          h: "Screened out once",
                          sub: "You didn't make it past Day 1. Your pattern is somewhere in how you present instinctively.",
                        },
                        {
                          value: 3,
                          h: "Conference out — once or more",
                          sub: "You made it through five days but the Board didn't recommend. That's useful information.",
                        },
                      ] as const
                    ).map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        className={`ob-opt${attemptNumber === o.value ? " selected" : ""}`}
                        onClick={() => advanceFromAttempt(o.value)}
                      >
                        <div className="ob-opt-h">{o.h}</div>
                        <div className="ob-opt-sub">{o.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="ob-footer">
                  <button
                    className="btn-g"
                    type="button"
                    onClick={() => setStep(1)}
                  >
                    ← Back
                  </button>
                </div>
              </>
            )}

            {/* ── Step 3: Failure reason (repeaters only) ──────────────── */}
            {step === 3 && (
              <>
                <div className="ob-body">
                  <h2 className="ob-q">
                    Where do you think you fell short?
                  </h2>
                  <p className="ob-hint">
                    Used to surface the relevant phase. Honest is more
                    useful than impressive.
                  </p>
                  <div className="ob-opts">
                    {(
                      [
                        {
                          value: "psych" as FailureReason,
                          h: "Psych",
                          sub: "Psychological tests — WAT, SRT, TAT, SD",
                        },
                        {
                          value: "gto" as FailureReason,
                          h: "GTO",
                          sub: "Group Testing Officer tasks",
                        },
                        {
                          value: "interview" as FailureReason,
                          h: "Interview",
                          sub: "Personal Interview",
                        },
                        {
                          value: "dont_know" as FailureReason,
                          h: "Don't know",
                          sub: "I'm not sure where I lost marks",
                        },
                        {
                          value: "everywhere" as FailureReason,
                          h: "Everywhere",
                          sub: "Multiple areas across the board",
                        },
                      ] as const
                    ).map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        className={`ob-opt${failureReason === o.value ? " selected" : ""}`}
                        onClick={() => {
                          setFailureReason(o.value);
                          setStep(4);
                        }}
                      >
                        <div className="ob-opt-h">{o.h}</div>
                        <div className="ob-opt-sub">{o.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="ob-footer">
                  <button
                    className="btn-g"
                    type="button"
                    onClick={() => setStep(2)}
                  >
                    ← Back
                  </button>
                </div>
              </>
            )}

            {/* ── Step 4: Board date ───────────────────────────────────── */}
            {step === 4 && (
              <>
                <div className="ob-body">
                  <h2 className="ob-q">When is your board?</h2>
                  <p className="ob-hint">
                    If you have a date, we'll count down. If you don't have
                    one yet, your 30 days starts today.
                  </p>
                  <input
                    className="ob-date-input"
                    type="date"
                    value={boardDate}
                    onChange={(e) => setBoardDate(e.target.value)}
                  />
                  {validDaysLeft !== null && (
                    <div className="ob-countdown">
                      <div className="ob-cd-val">{validDaysLeft}</div>
                      <div className="ob-cd-lbl">Days to your SSB</div>
                    </div>
                  )}
                </div>
                <div className="ob-footer">
                  {error && <p className="ob-error">{error}</p>}
                  <button
                    className="btn-p"
                    type="button"
                    onClick={submit}
                    disabled={submitting}
                  >
                    {submitting
                      ? "Setting up your journey…"
                      : "Begin My 30-Day Journey →"}
                  </button>
                  {!boardDate && (
                    <div className="ob-skip">
                      <button
                        className="btn-g"
                        type="button"
                        onClick={submit}
                        disabled={submitting}
                      >
                        I don't have a date yet →
                      </button>
                    </div>
                  )}
                  <button
                    className="btn-g"
                    type="button"
                    onClick={() => setStep(attemptNumber === 1 ? 2 : 3)}
                  >
                    ← Back
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
