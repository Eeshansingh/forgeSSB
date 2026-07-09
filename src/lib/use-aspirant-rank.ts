import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type AspirantRank = {
  rank: number | null;
  total: number;
  percentile: number | null;
  isLoggedIn: boolean;
  ready: boolean;
};

const INITIAL: AspirantRank = { rank: null, total: 0, percentile: null, isLoggedIn: false, ready: false };

// Single round-trip rank/percentile lookup, shared by the results hero,
// share section, and rank-context leaderboard so they don't each query separately.
export function useAspirantRank(testType: "wat" | "srt", score: number): AspirantRank {
  const [state, setState] = useState<AspirantRank>(INITIAL);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const isLoggedIn = !!user;

        if (!isLoggedIn) {
          if (mounted) setState({ ...INITIAL, isLoggedIn: false, ready: true });
          return;
        }

        const testTypeFilter = `${testType}_full`;

        const { count: totalCount, error: totalErr } = await supabase
          .from("test_attempts")
          .select("*", { count: "exact", head: true })
          .eq("test_type", testTypeFilter)
          .not("score", "is", null);

        if (totalErr) {
          if (mounted) setState({ ...INITIAL, isLoggedIn, ready: true });
          return;
        }

        const total = totalCount ?? 0;

        const { count: betterCount } = await supabase
          .from("test_attempts")
          .select("*", { count: "exact", head: true })
          .eq("test_type", testTypeFilter)
          .not("score", "is", null)
          .gt("score", score);

        const rank = (betterCount ?? 0) + 1;
        const percentile = total > 0 ? Math.max(1, Math.round(((total - rank) / total) * 100)) : null;

        if (mounted) setState({ rank, total, percentile, isLoggedIn, ready: true });
      } catch {
        if (mounted) setState({ ...INITIAL, ready: true });
      }
    };
    void run();
    return () => { mounted = false; };
  }, [testType, score]);

  return state;
}
