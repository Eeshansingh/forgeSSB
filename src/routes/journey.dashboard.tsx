import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  supabase,
  getJourneyProfile,
  getAllSessions,
  getBaselineScores,
  getUserRank,
  getUserPurchase,
  getReflections,
  dashboardTabAccess,
} from "@/lib/supabase";
import type { SessionRow, PurchasePlan, DashboardTabAccess } from "@/lib/supabase";
import { JOURNEY, clusterOf } from "@/lib/journey-content";
import type { Cluster } from "@/lib/journey-content";
import { JOURNEY_OLQS, scoreOf } from "@/lib/dashboard-content";
import { getJourneyInsights } from "@/lib/anthropic";
import type { JourneyInsights } from "@/lib/anthropic";
import { DashboardShell, type DashboardTab } from "@/components/dashboard/DashboardShell";
import { HomeTab } from "@/components/dashboard/HomeTab";
import { ProgressTab, type OlqMovement, type PhaseCard } from "@/components/dashboard/ProgressTab";
import { InsightsTab } from "@/components/dashboard/InsightsTab";
import { PracticeTab } from "@/components/dashboard/PracticeTab";
import { LockedTab } from "@/components/dashboard/LockedTab";

export const Route = createFileRoute("/journey/dashboard")({
  head: () => ({
    meta: [
      { title: "Journey Dashboard — ForgeSSB" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

type JourneyProfile = {
  user_id: string;
  exam_type: "nda" | "cds" | "afcat" | "ta";
  attempt_number: number;
  failure_reason: string | null;
  board_date: string | null;
};

const PHASES: { name: string; cluster: Cluster; start: number; end: number }[] = [
  { name: "Mirror", cluster: "mirror", start: 1, end: 6 },
  { name: "Drive", cluster: "drive", start: 7, end: 12 },
  { name: "Mind", cluster: "mind", start: 13, end: 16 },
  { name: "Others", cluster: "others", start: 17, end: 21 },
  { name: "Integration", cluster: "integration", start: 22, end: 30 },
];

function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<DashboardTab>("home");
  const [plan, setPlan] = useState<PurchasePlan | null>(null);
  const [tabAccess, setTabAccess] = useState<DashboardTabAccess>({ home: false, progress: false, insights: false, practice: false });
  const [profile, setProfile] = useState<JourneyProfile | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [firstName, setFirstName] = useState("");
  const [baselineScores, setBaseline] = useState<Record<string, number> | null>(null);
  const [rank, setRank] = useState<{ rank: number; total: number } | null>(null);

  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [insights, setInsights] = useState<JourneyInsights | null>(null);
  const [reflectionCount, setReflectionCount] = useState<number | null>(null);

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

      const userPlan = await getUserPurchase(data.user.id);
      if (!userPlan) {
        void navigate({ to: "/pricing" });
        return;
      }

      const access = dashboardTabAccess(userPlan);
      const fetchedProfile = await getJourneyProfile(data.user.id);

      if (userPlan === "journey" && !fetchedProfile) {
        void navigate({ to: "/journey/onboarding" });
        return;
      }

      const [fetchedSessions, fetchedBaseline, fetchedRank] = await Promise.all([
        getAllSessions(data.user.id),
        getBaselineScores(data.user.id),
        getUserRank(data.user.id),
      ]);

      setPlan(userPlan);
      setTabAccess(access);
      setProfile((fetchedProfile as JourneyProfile) ?? null);
      setSessions(fetchedSessions);
      setBaseline(fetchedBaseline);
      setRank(fetchedRank);
      setTab(access.home ? "home" : access.practice ? "practice" : "insights");
      setLoading(false);
    };
    void run();
  }, [navigate]);

  // Lazy-load Insights the first time that tab is opened.
  useEffect(() => {
    if (tab !== "insights" || insights || insightsLoading || !tabAccess.insights) return;
    const run = async () => {
      setInsightsLoading(true);
      setInsightsError(null);
      try {
        const { data } = await supabase.auth.getUser();
        if (!data.user) return;
        const reflections = await getReflections(data.user.id);
        setReflectionCount(reflections.length);
        if (reflections.length === 0) {
          setInsightsLoading(false);
          return;
        }
        const result = await getJourneyInsights({
          baseline_scores: baselineScores ?? {},
          reflections: reflections.map((r) => ({
            session_number: r.session_number as number,
            olq_focus: (JOURNEY.find((j) => j.session_number === r.session_number)?.olq_focus ?? "") as string,
            prompt: r.prompt as string,
            response: r.response as string,
          })),
        });
        setInsights(result);
      } catch (err) {
        console.error(err);
        setInsightsError("Analysis failed. Please try again.");
      } finally {
        setInsightsLoading(false);
      }
    };
    void run();
  }, [tab, insights, insightsLoading, tabAccess.insights, baselineScores]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Loading</p>
      </div>
    );
  }

  const completeCount = sessions.filter((s) => s.status === "complete").length;
  const allComplete = completeCount === 30;

  let currentN: number | null = null;
  for (let n = 1; n <= 30; n++) {
    const s = sessions.find((r) => r.session_number === n);
    if (!s || s.status !== "complete") {
      currentN = n;
      break;
    }
  }
  const currentJourney = currentN ? (JOURNEY.find((s) => s.session_number === currentN) ?? null) : null;
  const currentCluster: Cluster | null = currentN ? clusterOf(currentN) : null;
  const currentPhaseIdx = currentCluster ? PHASES.findIndex((p) => p.cluster === currentCluster) : -1;
  const nextN = currentN !== null && currentN < 30 ? currentN + 1 : null;
  const nextJourney = nextN ? (JOURNEY.find((s) => s.session_number === nextN) ?? null) : null;

  // Latest completed session's ai_observation, for the Home "what we noticed" teaser.
  const latestObservation =
    [...sessions].filter((s) => s.status === "complete" && s.ai_observation).sort((a, b) => b.session_number - a.session_number)[0]
      ?.ai_observation ?? null;

  // All-15 OLQ movement (baseline vs best-seen score), for the Progress tab.
  const movers: OlqMovement[] = [];
  if (baselineScores) {
    for (const name of JOURNEY_OLQS) {
      const baseline = baselineScores[name];
      if (baseline === undefined) continue;
      const best = sessions.reduce<number | undefined>((acc, s) => {
        const v = scoreOf(s.practice_scores, name);
        return v !== undefined && (acc === undefined || v > acc) ? v : acc;
      }, undefined);
      const current = best ?? baseline;
      movers.push({ name, baseline, current, delta: current - baseline });
    }
  }
  const compBase = movers.length ? Math.round(movers.reduce((s, o) => s + o.baseline, 0) / movers.length) : 0;
  const compNow = movers.length ? Math.round(movers.reduce((s, o) => s + o.current, 0) / movers.length) : 0;

  const phaseCards: PhaseCard[] = PHASES.map((ph, i) => {
    const clusterOLQs = [...new Set(JOURNEY.filter((j) => j.cluster === ph.cluster && j.olq_focus).map((j) => j.olq_focus))];
    const clusterMovers = movers.filter((m) => clusterOLQs.includes(m.name));
    const avgDelta = clusterMovers.length ? Math.round(clusterMovers.reduce((s, o) => s + o.delta, 0) / clusterMovers.length) : null;
    return {
      name: ph.name,
      start: ph.start,
      end: ph.end,
      status: i < currentPhaseIdx || allComplete ? "done" : i === currentPhaseIdx ? "current" : "upcoming",
      avgDelta: avgDelta && avgDelta > 0 ? avgDelta : null,
    };
  });

  const goToSession = (n: number) => void navigate({ to: `/journey/session/${n}` } as never);
  const goToReveal = () => void navigate({ to: "/journey/reveal" } as never);
  const goPractice = () => setTab("practice");
  const goDrill = (olq: string) => void navigate({ to: "/tests/drill", search: { olq } } as never);

  function handleTabChange(next: DashboardTab) {
    setTab(next);
  }

  function renderTab() {
    if (tab === "home") {
      if (!tabAccess.home) {
        return (
          <LockedTab
            title="Home"
            body="Your daily mission, phase rail, and session-by-session progress live here once you start the 30-day curriculum."
          />
        );
      }
      return (
        <HomeTab
          firstName={firstName}
          dayN={currentN ?? 1}
          totalDays={30}
          phaseName={PHASES[Math.max(0, currentPhaseIdx)]?.name ?? "Mirror"}
          progressPct={Math.round((completeCount / 30) * 100)}
          allComplete={allComplete}
          currentN={currentN}
          currentJourney={currentJourney}
          nextN={nextN}
          nextJourney={nextJourney}
          phaseRail={PHASES}
          currentPhaseIdx={Math.max(0, currentPhaseIdx)}
          latestObservation={latestObservation}
          onBeginSession={goToSession}
          onGoReveal={goToReveal}
          onGoPractice={goPractice}
        />
      );
    }
    if (tab === "progress") {
      if (!tabAccess.progress) {
        return (
          <LockedTab
            title="Progress"
            body="Your composite score trajectory, OLQ movement, and phase-by-phase breakdown live here once you start the 30-day curriculum."
          />
        );
      }
      return <ProgressTab dayN={currentN ?? completeCount} compBase={compBase} compNow={compNow} movers={movers} phases={phaseCards} rank={rank} />;
    }
    if (tab === "insights") {
      if (!tabAccess.insights) {
        return <LockedTab title="Insights" body="Cross-session pattern analysis unlocks with Practice Pass or the 30-Day Journey." />;
      }
      return (
        <InsightsTab
          loading={insightsLoading}
          error={insightsError}
          insights={insights}
          notEnoughData={reflectionCount === 0}
          onDrill={goDrill}
        />
      );
    }
    // practice
    if (!tabAccess.practice) {
      return <LockedTab title="Practice" body="Unlimited WAT and SRT practice unlocks with Practice Pass or the 30-Day Journey." />;
    }
    const olqScores = JOURNEY_OLQS.map((name) => ({ name, score: baselineScores?.[name] ?? 50 }));
    return <PracticeTab olqScores={olqScores} />;
  }

  return (
    <DashboardShell
      active={tab}
      onChange={handleTabChange}
      userName={firstName}
      examLabel={profile?.exam_type?.toUpperCase() ?? ""}
      dayLabel={plan === "journey" ? `Day ${currentN ?? 1} of 30` : "Practice Pass"}
      streak={completeCount}
    >
      {renderTab()}
    </DashboardShell>
  );
}
