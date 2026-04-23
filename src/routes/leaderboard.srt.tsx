import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { LeaderboardTable, type TimeFilter } from "@/components/LeaderboardTable";

export const Route = createFileRoute("/leaderboard/srt")({
  head: () => ({
    meta: [
      { title: "SRT Leaderboard — ForgeSSB" },
      { name: "description", content: "Top SRT scores from ForgeSSB full simulations." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SrtLeaderboardPage,
});

function SrtLeaderboardPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [user, setUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<{
    score: number;
    rank: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      const authUser = data.user ?? null;
      setUser(authUser);

      if (!authUser) return;

      const { data: best } = await supabase
        .from("test_attempts")
        .select("score")
        .eq("test_type", "srt_full")
        .eq("user_id", authUser.id)
        .not("score", "is", null)
        .order("score", { ascending: false })
        .limit(1);

      const userScore = best?.[0]?.score;
      if (userScore == null || !mounted) return;

      const [{ count: better }, { count: total }] = await Promise.all([
        supabase
          .from("test_attempts")
          .select("*", { count: "exact", head: true })
          .eq("test_type", "srt_full")
          .not("score", "is", null)
          .not("display_name", "is", null)
          .gt("score", userScore),
        supabase
          .from("test_attempts")
          .select("*", { count: "exact", head: true })
          .eq("test_type", "srt_full")
          .not("score", "is", null)
          .not("display_name", "is", null),
      ]);

      if (mounted) {
        setUserStats({ score: userScore, rank: (better ?? 0) + 1, total: total ?? 0 });
      }
    };
    void run();
    return () => { mounted = false; };
  }, []);

  const percentile =
    userStats && userStats.total > 0
      ? Math.max(1, Math.round(((userStats.total - userStats.rank) / userStats.total) * 100))
      : null;

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">Rankings</p>
      <h1 className="mt-2 font-serif text-4xl text-foreground sm:text-5xl">Leaderboard</h1>
      <p className="mt-3 text-base text-muted-foreground">
        Top candidates ranked by best composite OLQ score from full simulations.
      </p>

      {/* Tab bar */}
      <div className="mt-10 border-b border-border">
        <div className="flex">
          <TabLink to="/leaderboard/global" label="Global" />
          <TabLink to="/leaderboard/wat" label="WAT" />
          <TabLink to="/leaderboard/srt" label="SRT" />
        </div>
      </div>

      {/* Stats strip */}
      {user && userStats && (
        <div className="mt-8 grid grid-cols-3 gap-px bg-border">
          <StatCell label="Your Rank" value={`#${userStats.rank}`} />
          <StatCell label="Your Score" value={`${userStats.score}`} />
          <StatCell label="Percentile" value={percentile !== null ? `Top ${100 - percentile}%` : "—"} />
        </div>
      )}

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(["all", "month", "week"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setTimeFilter(f)}
            className={`border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
              timeFilter === f
                ? "border-gold/60 bg-gold/10 text-gold"
                : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
            }`}
          >
            {f === "all" ? "All Time" : f === "month" ? "This Month" : "This Week"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mt-4">
        <LeaderboardTable testType="srt" timeFilter={timeFilter} user={user} />
      </div>

      <p className="mt-4 font-mono text-[10px] text-muted-foreground/50">
        Full simulations only · Best score per candidate · Updated in real time
      </p>
    </section>
  );
}

function TabLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to as "/leaderboard/srt"}
      className="relative px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
      activeProps={{
        className:
          "relative px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-gold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gold",
      }}
    >
      {label}
    </Link>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-1 p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-serif text-3xl text-gold">{value}</p>
    </div>
  );
}
