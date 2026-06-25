import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  supabase,
  getJourneyProfile,
  getAllSessions,
  getBaselineScores,
  getUserRank,
  hasJourneyAccess,
} from "@/lib/supabase";
import type { SessionRow } from "@/lib/supabase";
import { JOURNEY, clusterOf } from "@/lib/journey-content";
import type { SessionType, Cluster } from "@/lib/journey-content";

export const Route = createFileRoute("/journey/dashboard")({
  head: () => ({
    meta: [
      { title: "Journey Dashboard — ForgeSSB" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

type JourneyProfile = {
  user_id: string;
  exam_type: "nda" | "cds" | "afcat" | "ta";
  attempt_number: number;
  failure_reason: string | null;
  board_date: string | null;
};

// ── Static metadata ───────────────────────────────────────────────────────────

const PHASES: { name: string; cluster: Cluster; start: number; end: number }[] =
  [
    { name: "Mirror",      cluster: "mirror",      start: 1,  end: 6  },
    { name: "Drive",       cluster: "drive",       start: 7,  end: 12 },
    { name: "Mind",        cluster: "mind",        start: 13, end: 16 },
    { name: "Others",      cluster: "others",      start: 17, end: 21 },
    { name: "Integration", cluster: "integration", start: 22, end: 30 },
  ];

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  calibration:   "Calibration",
  olq_drill:     "OLQ Drill",
  synthesis:     "Synthesis",
  checkpoint:    "Check-In",
  simulation:    "Simulation",
  social:        "Social",
  sd:            "Self-Description",
  consolidation: "Consolidation",
  reveal:        "Reveal",
};

const SESSION_TYPE_TAGS: Record<SessionType, string[]> = {
  calibration:   ["Calibration", "Reflect"],
  olq_drill:     ["Insight", "Practice", "Reflect"],
  synthesis:     ["Insight", "Synthesis", "Reflect"],
  checkpoint:    ["Check-In", "Reflect"],
  simulation:    ["Simulation", "Reflect"],
  social:        ["Insight", "Social Task", "Reflect"],
  sd:            ["Self-Description", "Reflect"],
  consolidation: ["Insight", "Reflect"],
  reveal:        ["Reveal"],
};

const SESSION_TYPE_DESC: Record<SessionType, string> = {
  calibration:   "Establish your OLQ baseline. Honest self-assessment sets the foundation for the next 29 sessions.",
  olq_drill:     "Read the insight, complete a short practice drill, and write one reflection. Then your mission.",
  synthesis:     "Connect the patterns across what you've practised. Apply them to a realistic SSB scenario.",
  checkpoint:    "A structured check-in on your growth. What's moved, what hasn't, and why.",
  simulation:    "A full SSB day simulation. AI feedback after.",
  social:        "An insight on how the Board reads group behaviour — then a real-world task to test it.",
  sd:            "Write your Self-Description. Structured, honest, officer-standard.",
  consolidation: "Pull together everything from this phase before moving forward.",
  reveal:        "Your Day 30 profile. Day 1 vs. Day 30 comparison.",
};

// ── CSS (prototype design system, scoped to .ssb-db) ─────────────────────────

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
.ssb-db .db-wm-star { color: var(--gold); }
.ssb-db .db-wm-forge { color: var(--gold); }
.ssb-db .db-wm-ssb { color: var(--fg); }
.ssb-db .db-nav-link {
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 10px;
}
.ssb-db .db-nav-link:hover { color: var(--fg); }
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
`;

// ── Pure helpers ──────────────────────────────────────────────────────────────

function daysUntilBoard(boardDate: string | null | undefined): number | null {
  if (!boardDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(boardDate);
  if (isNaN(target.getTime())) return null;
  const diff = Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  return diff > 0 ? diff : null;
}

function sessionTitle(s: (typeof JOURNEY)[number]): string {
  return s.olq_focus || SESSION_TYPE_LABELS[s.session_type];
}

function scoreOf(
  ps: Record<string, unknown> | null,
  olq: string,
): number | undefined {
  if (!ps) return undefined;
  const v = ps[olq];
  return typeof v === "number" ? v : undefined;
}

// ── Component ─────────────────────────────────────────────────────────────────

function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading]         = useState(true);
  const [profile, setProfile]         = useState<JourneyProfile | null>(null);
  const [sessions, setSessions]       = useState<SessionRow[]>([]);
  const [firstName, setFirstName]     = useState("");
  const [baselineScores, setBaseline] = useState<Record<string, number> | null>(null);
  const [rank, setRank]               = useState<{ rank: number; total: number } | null>(null);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        void navigate({ to: "/" });
        return;
      }

      const meta = data.user.user_metadata as { full_name?: string } | undefined;
      const fullName = meta?.full_name ?? data.user.email ?? "";
      setFirstName(fullName.split(" ")[0] ?? "");

      const [access, fetchedProfile, fetchedSessions, fetchedBaseline, fetchedRank] =
        await Promise.all([
          hasJourneyAccess(data.user.id),
          getJourneyProfile(data.user.id),
          getAllSessions(data.user.id),
          getBaselineScores(data.user.id),
          getUserRank(data.user.id),
        ]);

      if (!access) {
        void navigate({ to: "/pricing" });
        return;
      }

      if (!fetchedProfile) {
        void navigate({ to: "/journey/onboarding" });
        return;
      }

      setProfile(fetchedProfile as JourneyProfile);
      setSessions(fetchedSessions);
      setBaseline(fetchedBaseline);
      setRank(fetchedRank);
      setLoading(false);
    };
    void run();
  }, [navigate]);

  if (loading) {
    return (
      <>
        <style>{CSS}</style>
        <div
          className="ssb-db"
          style={{ alignItems: "center", justifyContent: "center" }}
        >
          <p className="label">Loading</p>
        </div>
      </>
    );
  }

  if (!profile) return null;

  // ── Derived state ────────────────────────────────────────────────────────────

  const completeCount = sessions.filter((s) => s.status === "complete").length;
  const allComplete   = completeCount === 30;
  const progressPct   = Math.round((completeCount / 30) * 100);
  const daysLeft      = daysUntilBoard(profile.board_date);

  let currentN: number | null = null;
  for (let n = 1; n <= 30; n++) {
    const s = sessions.find((r) => r.session_number === n);
    if (!s || s.status !== "complete") { currentN = n; break; }
  }

  const currentJourney = currentN
    ? (JOURNEY.find((s) => s.session_number === currentN) ?? null)
    : null;
  const currentCluster: Cluster | null = currentN ? clusterOf(currentN) : null;
  const currentPhase = currentCluster
    ? (PHASES.find((p) => p.cluster === currentCluster) ?? null)
    : null;
  const nextN = currentN !== null && currentN < 30 ? currentN + 1 : null;
  const nextJourney = nextN
    ? (JOURNEY.find((s) => s.session_number === nextN) ?? null)
    : null;

  // OLQ progress: OLQs in current cluster, baseline vs. most recent scored session
  const olqItems: { name: string; baseline: number; current: number; delta: number }[] = [];
  if (baselineScores && currentCluster) {
    const clusterOLQs = [
      ...new Set(
        JOURNEY.filter((j) => j.cluster === currentCluster && j.olq_focus).map(
          (j) => j.olq_focus,
        ),
      ),
    ];
    for (const olqName of clusterOLQs) {
      const baseline = baselineScores[olqName];
      if (baseline === undefined) continue;
      const scored = sessions
        .filter((s) => s.cluster === currentCluster && s.practice_scores !== null)
        .sort((a, b) => b.session_number - a.session_number)
        .find((s) => scoreOf(s.practice_scores, olqName) !== undefined);
      const current = scored ? (scoreOf(scored.practice_scores, olqName) as number) : baseline;
      olqItems.push({ name: olqName, baseline, current, delta: current - baseline });
    }
  }
  const clusterAvgDelta =
    olqItems.length > 0
      ? Math.round(olqItems.reduce((s, o) => s + o.delta, 0) / olqItems.length)
      : 0;
  const clusterAvgBaseline =
    olqItems.length > 0
      ? Math.round(olqItems.reduce((s, o) => s + o.baseline, 0) / olqItems.length)
      : 0;

  // Top OLQ: highest current score across baseline + any session scores
  const allScores = new Map<string, number>();
  if (baselineScores) {
    for (const [name, val] of Object.entries(baselineScores)) {
      if (typeof val === "number") allScores.set(name, val);
    }
  }
  for (const s of sessions) {
    if (!s.practice_scores) continue;
    for (const [name, val] of Object.entries(s.practice_scores)) {
      if (typeof val === "number") {
        allScores.set(name, Math.max(allScores.get(name) ?? 0, val));
      }
    }
  }
  const topOLQ =
    allScores.size > 0
      ? [...allScores.entries()].reduce((best, cur) =>
          cur[1] > best[1] ? cur : best,
        )
      : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const goToSession = (n: number) => void navigate({ to: `/journey/session/${n}` } as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const goToReveal  = () => void navigate({ to: "/journey/reveal" } as any);

  return (
    <>
      <style>{CSS}</style>
      <div className="ssb-db">

        {/* ── 1. Nav ──────────────────────────────────────────────────────── */}
        <nav className="db-nav">
          <button className="db-wm" type="button">
            <svg
              className="db-wm-star"
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
              <span className="db-wm-forge">Forge</span>
              <span className="db-wm-ssb">SSB</span>
            </span>
          </button>
          <button className="db-nav-link" type="button">
            Journey
          </button>
        </nav>

        {/* ── 2. Greeting · Day counter · Streak · Progress ───────────────── */}
        <div
          className="grid-tex"
          style={{ padding: "28px 24px 0", position: "relative", overflow: "hidden" }}
        >
          {/* Radial glow */}
          <div
            style={{
              position: "absolute",
              top: "-60px",
              right: "-40px",
              width: "260px",
              height: "220px",
              background:
                "radial-gradient(ellipse,rgba(201,168,76,.06) 0%,transparent 65%)",
              pointerEvents: "none",
            }}
          />

          {/* Greeting */}
          {firstName && (
            <p
              style={{
                fontFamily: "var(--mono)",
                fontSize: "10px",
                letterSpacing: ".20em",
                textTransform: "uppercase",
                color: "var(--muted)",
                marginBottom: "6px",
              }}
            >
              Good morning, {firstName}.
            </p>
          )}

          {/* Day row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: "38px",
                  fontWeight: 700,
                  color: "var(--fg)",
                  lineHeight: 1,
                  letterSpacing: "-.02em",
                }}
              >
                {allComplete
                  ? "Day 30"
                  : currentN !== null
                    ? `Day ${currentN}`
                    : "Day 1"}
              </p>
              <p
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "9px",
                  letterSpacing: ".20em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginTop: "3px",
                }}
              >
                of 30 · {profile.exam_type.toUpperCase()} preparation
              </p>
            </div>

            <div style={{ textAlign: "right" }}>
              {/* Streak badge */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  border: "0.5px solid var(--gold-b)",
                  padding: "6px 12px",
                  background: "var(--gold-dim)",
                }}
              >
                <span style={{ color: "var(--gold)", fontSize: "14px" }}>★</span>
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "11px",
                    fontWeight: 500,
                    color: "var(--gold)",
                  }}
                >
                  {completeCount}
                </span>
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "8px",
                    letterSpacing: ".15em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                  }}
                >
                  day streak
                </span>
              </div>
              {/* Board countdown */}
              {daysLeft !== null && (
                <p
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "8px",
                    letterSpacing: ".15em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    marginTop: "6px",
                  }}
                >
                  {daysLeft}d to board
                </p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "5px",
              }}
            >
              <span className="label">Journey progress</span>
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "9px",
                  color: "var(--gold)",
                }}
              >
                {progressPct}%
              </span>
            </div>
            <div
              style={{ height: "3px", background: "var(--border)", position: "relative" }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: "100%",
                  width: `${progressPct}%`,
                  background: "var(--gold)",
                }}
              />
            </div>
          </div>
        </div>

        {/* ── 3. Today's Challenge hero card ──────────────────────────────── */}
        <div style={{ padding: "0 24px 24px" }}>
          <div
            style={{
              border: "1px solid var(--gold)",
              background: "var(--s1)",
              position: "relative",
              overflow: "hidden",
              cursor: allComplete || currentN !== null ? "pointer" : "default",
            }}
            onClick={
              allComplete
                ? goToReveal
                : currentN !== null
                  ? () => goToSession(currentN)
                  : undefined
            }
          >
            {/* Top gradient accent */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "2px",
                background:
                  "linear-gradient(to right,var(--gold),rgba(201,168,76,.3))",
              }}
            />

            <div style={{ padding: "20px 20px 14px" }}>
              {allComplete ? (
                /* Journey complete state */
                <>
                  <p
                    className="label"
                    style={{ color: "var(--gold)", marginBottom: "6px" }}
                  >
                    Journey Complete
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--serif)",
                      fontSize: "22px",
                      fontWeight: 700,
                      color: "var(--fg)",
                      lineHeight: 1.1,
                      marginBottom: "14px",
                    }}
                  >
                    30 sessions. The work is done.
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--muted)",
                      lineHeight: 1.65,
                      marginBottom: "18px",
                    }}
                  >
                    Your Day 1 and Day 30 profiles are ready to compare. See
                    how far you've moved.
                  </p>
                  <button
                    className="btn-pay"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToReveal();
                    }}
                  >
                    View Day 30 Reveal →
                  </button>
                </>
              ) : currentN !== null && currentJourney !== null ? (
                /* Active session state */
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "14px",
                    }}
                  >
                    <div>
                      <p
                        className="label"
                        style={{ color: "var(--gold)", marginBottom: "6px" }}
                      >
                        Today's Challenge · Day {currentN}
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--serif)",
                          fontSize: "22px",
                          fontWeight: 700,
                          color: "var(--fg)",
                          lineHeight: 1.1,
                        }}
                      >
                        {sessionTitle(currentJourney)}
                      </p>
                    </div>
                    <div
                      style={{
                        border: "0.5px solid var(--border)",
                        padding: "8px 10px",
                        textAlign: "center",
                        flexShrink: 0,
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "var(--serif)",
                          fontSize: "20px",
                          fontWeight: 700,
                          color: "var(--gold)",
                        }}
                      >
                        15
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: "7px",
                          letterSpacing: ".15em",
                          textTransform: "uppercase",
                          color: "var(--muted)",
                        }}
                      >
                        min
                      </p>
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--muted)",
                      lineHeight: 1.65,
                      marginBottom: "16px",
                    }}
                  >
                    {SESSION_TYPE_DESC[currentJourney.session_type]}
                  </p>

                  {/* Phase tags */}
                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      flexWrap: "wrap",
                      marginBottom: "18px",
                    }}
                  >
                    {SESSION_TYPE_TAGS[currentJourney.session_type].map(
                      (tag) => (
                        <span
                          key={tag}
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: "9px",
                            letterSpacing: ".15em",
                            textTransform: "uppercase",
                            border: "0.5px solid var(--border)",
                            padding: "4px 9px",
                            color: "var(--muted)",
                          }}
                        >
                          {tag}
                        </span>
                      ),
                    )}
                  </div>

                  <button
                    className="btn-pay"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToSession(currentN);
                    }}
                  >
                    Begin Today's Challenge →
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* ── 4. OLQ Progress ──────────────────────────────────────────────── */}
        {currentPhase && (
          <div style={{ padding: "0 24px 24px" }}>
            <div
              style={{
                border: "1px solid var(--border)",
                background: "var(--s1)",
                padding: "20px",
              }}
            >
              <div style={{ marginBottom: "16px" }}>
                <p
                  className="label"
                  style={{ color: "var(--gold)", marginBottom: "3px" }}
                >
                  {currentPhase.name} Cluster · vs. your Day 1 baseline
                </p>
                <p
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: "15px",
                    color: "var(--fg)",
                  }}
                >
                  Sessions {currentPhase.start}–{currentPhase.end}
                </p>
              </div>

              {!baselineScores ? (
                /* No calibration done — educate the user */
                <div
                  style={{
                    padding: "16px",
                    border: "0.5px solid var(--border-2)",
                    background: "rgba(201,168,76,.04)",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--serif)",
                      fontSize: "14px",
                      color: "var(--fg)",
                      marginBottom: "8px",
                      lineHeight: 1.5,
                    }}
                  >
                    Your OLQ baseline hasn't been set yet.
                  </p>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--muted)",
                      lineHeight: 1.65,
                    }}
                  >
                    Day 1 is a calibration session — you'll honestly rate yourself
                    across all 15 Officer Like Qualities. That snapshot becomes
                    your baseline. Every session after that moves the needle.
                    Complete Day 1 to start tracking your progress here.
                  </p>
                </div>
              ) : olqItems.length === 0 ? (
                /* Baseline exists but no OLQs mapped to this cluster */
                <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.65 }}>
                  No OLQ scores recorded for this cluster yet. Keep going.
                </p>
              ) : (
                /* Real bars */
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {olqItems.map(({ name, baseline, current, delta }) => (
                      <div key={name}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "5px",
                          }}
                        >
                          <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                            {name}
                          </span>
                          <span
                            style={{
                              fontFamily: "var(--mono)",
                              fontSize: "11px",
                              color: delta > 5 ? "var(--gold)" : "rgba(138,154,132,.8)",
                            }}
                          >
                            {baseline} → {current}{" "}
                            <span
                              style={{
                                fontSize: "9px",
                                color: delta > 0 ? "var(--success)" : "var(--muted)",
                              }}
                            >
                              {delta > 0 ? `+${delta}` : delta === 0 ? "—" : delta}
                            </span>
                          </span>
                        </div>
                        <div
                          style={{
                            height: "3px",
                            background: "var(--border)",
                            position: "relative",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              left: 0,
                              top: 0,
                              height: "100%",
                              width: `${baseline}%`,
                              background: "rgba(138,154,132,.4)",
                            }}
                          />
                          {delta > 0 && (
                            <div
                              style={{
                                position: "absolute",
                                left: `${baseline}%`,
                                top: 0,
                                height: "100%",
                                width: `${delta}%`,
                                background: "var(--gold)",
                              }}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cluster average */}
                  <div
                    style={{
                      marginTop: "14px",
                      paddingTop: "12px",
                      borderTop: "0.5px solid var(--border-2)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                      {currentPhase.name} cluster average
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: "11px",
                        color: "var(--gold)",
                      }}
                    >
                      {clusterAvgBaseline} → {clusterAvgBaseline + clusterAvgDelta}{" "}
                      {clusterAvgDelta > 0 && (
                        <span style={{ color: "var(--success)", fontSize: "9px", marginLeft: "4px" }}>
                          +{clusterAvgDelta}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* No movement yet — encourage progress */}
                  {olqItems.every((o) => o.delta === 0) && (
                    <p
                      style={{
                        marginTop: "14px",
                        fontSize: "11px",
                        color: "rgba(138,154,132,.6)",
                        fontFamily: "var(--mono)",
                        letterSpacing: ".08em",
                        lineHeight: 1.6,
                      }}
                    >
                      These are your Day 1 calibration scores. Complete sessions
                      in this phase and you'll see your scores move.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── 6. Leaderboard + Top OLQ widget ─────────────────────────────── */}
        <div style={{ padding: "0 24px 24px" }}>
          <div
            style={{
              border: "1px solid var(--border)",
              display: "grid",
              gridTemplateColumns: "1fr 1px 1fr",
              background: "var(--border)",
              gap: "1px",
            }}
          >
            {/* Journey rank */}
            <div style={{ background: "var(--s1)", padding: "18px 16px" }}>
              <p className="label" style={{ marginBottom: "6px" }}>
                Journey rank
              </p>
              <p
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: "30px",
                  fontWeight: 700,
                  color: "var(--gold)",
                }}
              >
                {rank ? `#${rank.rank}` : "—"}
              </p>
              <p
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "9px",
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginTop: "2px",
                }}
              >
                {rank ? `of ${rank.total} active` : "—"}
              </p>
            </div>

            {/* Divider */}
            <div style={{ background: "var(--border)" }} />

            {/* Top OLQ */}
            <div style={{ background: "var(--s1)", padding: "18px 16px" }}>
              <p className="label" style={{ marginBottom: "6px" }}>
                Top OLQ
              </p>
              {topOLQ ? (
                <>
                  <p
                    style={{
                      fontFamily: "var(--serif)",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--fg)",
                      marginBottom: "2px",
                      lineHeight: 1.2,
                    }}
                  >
                    {topOLQ[0]}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "22px",
                      fontWeight: 500,
                      color: "var(--gold)",
                    }}
                  >
                    {topOLQ[1]}
                  </p>
                </>
              ) : (
                <p
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: "30px",
                    fontWeight: 700,
                    color: "var(--muted)",
                  }}
                >
                  —
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── 7. Tomorrow preview ──────────────────────────────────────────── */}
        {nextN !== null && nextJourney !== null && (
          <div
            style={{
              margin: "0 24px 40px",
              border: "1px solid var(--border)",
              padding: "16px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p className="label" style={{ marginBottom: "4px" }}>
                Tomorrow · Day {nextN}
              </p>
              <p
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: "17px",
                  color: "var(--fg)",
                }}
              >
                {sessionTitle(nextJourney)}
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--muted)",
                  marginTop: "3px",
                }}
              >
                {SESSION_TYPE_LABELS[nextJourney.session_type]}
              </p>
            </div>
            <div
              style={{
                color: "rgba(201,168,76,.3)",
                fontSize: "28px",
                fontFamily: "var(--serif)",
                flexShrink: 0,
              }}
            >
              →
            </div>
          </div>
        )}
      </div>
    </>
  );
}
