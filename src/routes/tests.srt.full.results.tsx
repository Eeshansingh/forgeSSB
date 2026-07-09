import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSRTFullAnalysis } from "@/lib/srt-anthropic";
import { supabase, updateTestAttempt, formatDisplayName, signInWithGoogle } from "@/lib/supabase";
import { AnalysisLoading } from "@/components/AnalysisLoading";
import { TestResultsReport, type ResultsAnalysis } from "@/components/results/TestResultsReport";

export const Route = createFileRoute("/tests/srt/full/results")({
  head: () => ({
    meta: [
      { title: "Assessment Complete — SRT Results — ForgeSSB" },
      { name: "description", content: "OLQ scores and AI pattern analysis from your SRT simulation." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResultsPage,
});

type SrtResponse = { situation: string; response: string };
type AuthUser = { email?: string | null } | null;

function ResultsPage() {
  const [analysis, setAnalysis] = useState<ResultsAnalysis | null>(null);
  const [responses, setResponses] = useState<SrtResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser>(null);
  const [showFirstAttemptPrompt, setShowFirstAttemptPrompt] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const stored = sessionStorage.getItem("srt_responses");
        if (!stored) {
          setError("No responses found. Please complete the test first.");
          return;
        }

        const parsed: SrtResponse[] = JSON.parse(stored);
        setResponses(parsed);

        const { data } = await supabase.auth.getUser();
        const authUser = (data.user as AuthUser) ?? null;
        setUser(authUser);
        if (!authUser && Number(localStorage.getItem("forgessb_attempt_count") ?? "0") === 1) {
          setShowFirstAttemptPrompt(true);
        }

        const dataAnalysis = (await getSRTFullAnalysis(parsed)) as ResultsAnalysis;
        setAnalysis(dataAnalysis);

        const attemptId = sessionStorage.getItem("forgessb_current_attempt_id");
        if (attemptId) {
          const olqVals = Object.values(dataAnalysis.olq_scores);
          const compositeScore = olqVals.length
            ? Math.round(olqVals.reduce((a, b) => a + b, 0) / olqVals.length)
            : undefined;
          const fullName = authUser?.user_metadata?.full_name as string | undefined;
          const displayName = fullName ? formatDisplayName(fullName) : undefined;
          await updateTestAttempt(
            attemptId,
            parsed as unknown as { word: string; response: string }[],
            dataAnalysis as unknown as object,
            parsed.length,
            compositeScore,
            displayName
          );
        }
      } catch (err) {
        console.error(err);
        setError("Analysis failed. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  if (loading) {
    return <AnalysisLoading />;
  }

  if (error || !analysis) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-danger">
          {error ?? "Something went wrong."}
        </p>
        <Link
          to="/tests/srt/full/instructions"
          className="border border-gold px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] text-gold hover:bg-gold hover:text-primary-foreground"
        >
          Return to Instructions
        </Link>
      </div>
    );
  }

  return (
    <TestResultsReport
      testType="srt"
      mode="full"
      analysis={analysis}
      responses={responses}
      user={user}
      showFirstAttemptPrompt={showFirstAttemptPrompt}
      onSignIn={() => void signInWithGoogle()}
    />
  );
}
