import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { AspirantRank } from "@/lib/use-aspirant-rank";

type Props = {
  testType: "wat" | "srt";
  userScore: number;
  rankData: AspirantRank;
};

type Row = {
  id: string;
  display_name: string | null;
  score: number;
};

const PLACEHOLDER_NAMES = ["Arjun M.", "Priya S.", "Vikram R.", "Ananya K.", "Rohit P."];

function rowName(row: Row, fallbackIndex: number): string {
  return row.display_name ?? PLACEHOLDER_NAMES[fallbackIndex % PLACEHOLDER_NAMES.length];
}

export function RankContextLeaderboard({ testType, userScore, rankData }: Props) {
  const [above, setAbove] = useState<Row[]>([]);
  const [below, setBelow] = useState<Row[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);

  useEffect(() => {
    if (!rankData.ready || !rankData.isLoggedIn || rankData.rank === null) return;
    let mounted = true;
    const run = async () => {
      setLoadingRows(true);
      try {
        const testTypeFilter = `${testType}_full`;
        const { data: { user } } = await supabase.auth.getUser();
        const rank = rankData.rank as number;
        const pos = rank - 1; // zero-indexed position of the current user

        let aboveQuery = supabase
          .from("test_attempts")
          .select("id, display_name, score")
          .eq("test_type", testTypeFilter)
          .not("score", "is", null)
          .order("score", { ascending: false })
          .range(Math.max(0, pos - 2), Math.max(0, pos - 1));
        let belowQuery = supabase
          .from("test_attempts")
          .select("id, display_name, score")
          .eq("test_type", testTypeFilter)
          .not("score", "is", null)
          .order("score", { ascending: false })
          .range(pos + 1, pos + 2);

        if (user?.id) {
          aboveQuery = aboveQuery.neq("user_id", user.id);
          belowQuery = belowQuery.neq("user_id", user.id);
        }

        const [{ data: aboveRows }, { data: belowRows }] = await Promise.all([aboveQuery, belowQuery]);
        if (!mounted) return;
        setAbove((aboveRows as Row[]) ?? []);
        setBelow((belowRows as Row[]) ?? []);
      } finally {
        if (mounted) setLoadingRows(false);
      }
    };
    void run();
    return () => { mounted = false; };
  }, [testType, rankData.ready, rankData.isLoggedIn, rankData.rank]);

  const isLoggedIn = rankData.isLoggedIn;
  const rank = rankData.rank;
  const total = rankData.total;
  const gapScore = above[above.length - 1]?.score;
  const gap = gapScore !== undefined ? gapScore - userScore : null;

  return (
    <div className="border-t border-border/60 px-6 py-10 sm:px-10">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-gold">
            All-aspirant leaderboard · this week
          </p>
          <h2 className="font-serif text-[22px] font-bold text-foreground">
            {isLoggedIn && rank !== null ? `You are #${rank} of ${total.toLocaleString()}` : "See where you rank"}
          </h2>
        </div>
        <span className="border border-border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
          This week
        </span>
      </div>

      <div className="mb-4 border border-border bg-surface-1">
        {!isLoggedIn ? (
          <div className="flex flex-col items-start gap-3 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Sign in to reveal your rank among all aspirants.</p>
          </div>
        ) : loadingRows ? (
          <div className="px-6 py-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Loading…</p>
          </div>
        ) : (
          <>
            {above.map((row, i) => (
              <Row key={row.id} rank={rank !== null ? rank - above.length + i : undefined} name={rowName(row, i)} score={row.score} isYou={false} />
            ))}
            <Row rank={rank ?? undefined} name="You" score={userScore} isYou />
            {below.map((row, i) => (
              <Row key={row.id} rank={rank !== null ? rank + i + 1 : undefined} name={rowName(row, i + 2)} score={row.score} isYou={false} />
            ))}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {isLoggedIn && gap !== null && gap > 0 ? (
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            The person above you scored <span className="text-foreground">{gapScore}</span>. That's a gap of{" "}
            <span className="text-gold">{gap} point{gap === 1 ? "" : "s"}</span> — closable in one session.
          </p>
        ) : (
          <span />
        )}
        <a
          href="/leaderboard/wat"
          className="whitespace-nowrap border border-gold/40 px-3.5 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-gold transition-colors hover:bg-gold/10"
        >
          Full leaderboard →
        </a>
      </div>
    </div>
  );
}

function Row({ rank, name, score, isYou }: { rank?: number; name: string; score: number; isYou: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 border-b border-border/50 px-6 py-3 last:border-b-0 ${isYou ? "bg-gold/10" : ""}`}
      style={isYou ? { borderLeft: "2px solid var(--color-gold)" } : undefined}
    >
      <span className={`w-9 shrink-0 font-mono text-[11px] ${isYou ? "text-gold" : "text-muted-foreground"}`}>
        {rank !== undefined ? `#${rank}` : "—"}
      </span>
      <span className={`flex-1 text-[13px] ${isYou ? "font-semibold text-gold" : "text-foreground"}`}>{name}</span>
      <span className={`font-serif text-lg font-bold ${isYou ? "text-gold" : "text-foreground"}`}>{score}</span>
    </div>
  );
}
