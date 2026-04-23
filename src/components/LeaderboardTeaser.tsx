import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase, signInWithGoogle } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// Required DB migrations before this component shows real data:
//   ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS score integer;
//   ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS display_name text;
// score is saved by updateTestAttempt; display_name is saved by recordTestAttempt.
// Until migrated, the component renders nothing rather than crashing.

export interface LeaderboardTeaserProps {
  testType: "wat" | "srt";
  userScore: number;
  userRating: string;
  practice?: boolean;
}

type LeaderRow = {
  id: string;
  display_name: string | null;
  score: number;
};

// Deterministic placeholder names for rows without a display_name yet.
const PLACEHOLDER_NAMES = ["Arjun M.", "Priya S.", "Vikram R.", "Ananya K.", "Rohit P."];
function rowDisplayName(row: LeaderRow, rank: number): string {
  if (row.display_name) return row.display_name;
  return PLACEHOLDER_NAMES[rank - 1] ?? `Aspirant ${rank}`;
}

function lbRating(score: number): { label: string; tone: string } {
  if (score >= 85) return { label: "Distinguished", tone: "text-gold" };
  if (score >= 70) return { label: "Commendable", tone: "text-success" };
  if (score >= 55) return { label: "Proficient", tone: "text-foreground/80" };
  return { label: "Satisfactory", tone: "text-muted-foreground" };
}

const MODULE_LABEL: Record<string, string> = { wat: "WAT", srt: "SRT" };

export function LeaderboardTeaser({ testType, userScore, practice }: LeaderboardTeaserProps) {
  const [user, setUser] = useState<User | null>(null);
  const [topRows, setTopRows] = useState<LeaderRow[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [percentile, setPercentile] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser ?? null);

        const testTypeFilter = `${testType}_full`;

        // Top 5 by score
        const { data: top, error: topErr } = await supabase
          .from("test_attempts")
          .select("id, display_name, score")
          .eq("test_type", testTypeFilter)
          .not("score", "is", null)
          .order("score", { ascending: false })
          .limit(5);

        if (topErr) return; // score column not yet migrated — stay hidden

        setTopRows((top as LeaderRow[]) ?? []);

        // Total eligible count
        const { count: totalCount } = await supabase
          .from("test_attempts")
          .select("*", { count: "exact", head: true })
          .eq("test_type", testTypeFilter)
          .not("score", "is", null);

        const t = totalCount ?? 0;
        setTotal(t);

        // Count of attempts strictly better than the user's score
        const { count: betterCount } = await supabase
          .from("test_attempts")
          .select("*", { count: "exact", head: true })
          .eq("test_type", testTypeFilter)
          .gt("score", userScore);

        const rank = (betterCount ?? 0) + 1;
        setUserRank(rank);

        if (t > 0) {
          setPercentile(Math.round(((t - rank) / t) * 100));
        }

        setReady(true);
      } catch {
        // Silently hide on any error — leaderboard is non-critical
      }
    };
    void run();
  }, [testType, userScore]);

  if (!ready) return null;

  const moduleLabel = MODULE_LABEL[testType] ?? testType.toUpperCase();
  const userRatingObj = lbRating(userScore);
  const isLoggedIn = !!user;

  return (
    <div className="mt-16 border border-gold/30 bg-surface-1">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">
          {moduleLabel} · Global Leaderboard
        </p>
        {total > 0 && (
          <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {total.toLocaleString()} candidates
          </p>
        )}
      </div>

      {/* Rows */}
      <div>
        {/* Top entries */}
        {topRows.slice(0, 3).map((row, i) => {
          const rank = i + 1;
          const r = lbRating(row.score);
          const isTop3 = rank <= 3;
          return (
            <div
              key={row.id}
              className="grid items-center gap-3 border-b border-border/60 px-6 py-[14px]"
              style={{ gridTemplateColumns: "44px 1fr auto auto" }}
            >
              <span className={`font-mono text-xs tabular-nums ${isTop3 ? "text-gold" : "text-muted-foreground"}`}>
                {String(rank).padStart(2, "0")}
              </span>
              <span className="truncate text-[13px] text-foreground">
                {rowDisplayName(row, rank)}
              </span>
              <span
                className={`font-mono text-[10px] uppercase tracking-[0.1em] ${r.tone}`}
                style={{ filter: isLoggedIn ? "none" : "blur(6px)", userSelect: isLoggedIn ? "auto" : "none" }}
              >
                {r.label}
              </span>
              <span
                className={`font-mono text-[22px] tabular-nums ${isTop3 ? "text-gold" : "text-foreground"}`}
                style={{ filter: isLoggedIn ? "none" : "blur(6px)", userSelect: isLoggedIn ? "auto" : "none" }}
              >
                {row.score}
              </span>
            </div>
          );
        })}

        {/* Ghost rows — logged-out only */}
        {!isLoggedIn && (
          <>
            {[4, 5].map((n) => (
              <div
                key={n}
                className="grid items-center gap-3 border-b border-border/60 px-6 py-[14px] opacity-25"
                style={{ gridTemplateColumns: "44px 1fr auto auto" }}
              >
                <span className="font-mono text-xs tabular-nums text-muted-foreground">{String(n).padStart(2, "0")}</span>
                <span className="text-[13px] text-muted-foreground">· · ·</span>
                <span className="font-mono text-[10px] text-muted-foreground">· · ·</span>
                <span className="font-mono text-[22px] tabular-nums text-muted-foreground">· ·</span>
              </div>
            ))}
          </>
        )}

        {/* Separator — logged-in only */}
        {isLoggedIn && topRows.length > 0 && (
          <div className="border-b border-border/60 px-6 py-2">
            <span className="font-mono text-[10px] text-muted-foreground/40">···</span>
          </div>
        )}

        {/* User row */}
        <div
          className="grid items-center gap-3 px-6 py-[14px]"
          style={{
            gridTemplateColumns: "44px 1fr auto auto",
            borderLeft: "3px solid var(--color-gold)",
            backgroundColor: "oklch(0.74 0.13 85 / 0.12)",
            filter: isLoggedIn ? "none" : "blur(5px)",
          }}
        >
          <span className="font-mono text-xs tabular-nums text-gold">
            {isLoggedIn && userRank ? String(userRank).padStart(2, "0") : "??"}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-foreground">You</span>
            {isLoggedIn && percentile !== null && (
              <span className="font-mono text-[10px] text-muted-foreground">
                · Top {Math.max(1, 100 - percentile)}%
              </span>
            )}
          </div>
          <span className={`font-mono text-[10px] uppercase tracking-[0.1em] ${userRatingObj.tone}`}>
            {userRatingObj.label}
          </span>
          <span className="font-mono text-[22px] tabular-nums text-foreground">
            {userScore}
          </span>
        </div>
      </div>

      {practice && (
        <div className="border-t border-border/50 px-6 py-3">
          <p className="text-xs text-muted-foreground/70">
            This shows where your score would place you.{" "}
            <Link to={`/tests/${testType}/full/instructions` as "/tests/wat/full/instructions"} className="text-gold underline-offset-2 hover:underline">
              Take a Full Simulation
            </Link>{" "}
            to appear on the leaderboard.
          </p>
        </div>
      )}

      {/* CTA strip */}
      <div className="flex flex-col items-start justify-between gap-3 border-t border-border px-6 py-4 sm:flex-row sm:items-center">
        {isLoggedIn ? (
          <>
            <p className="font-mono text-[11px] text-success">✓ Result saved to My Journey</p>
            <Link
              to="/leaderboard/wat"
              className="font-mono text-[11px] text-gold transition-colors hover:text-foreground"
            >
              View Full Leaderboard →
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Sign in to reveal scores and claim your rank.</p>
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="inline-flex shrink-0 items-center gap-2 border border-gold bg-gold/10 px-5 py-2 font-mono text-xs uppercase tracking-[0.18em] text-gold transition-all hover:bg-gold hover:text-primary-foreground"
            >
              Sign In to See Scores →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
