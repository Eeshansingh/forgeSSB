import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export type TimeFilter = "all" | "month" | "week";

export interface LeaderboardTableProps {
  testType: "wat" | "srt";
  timeFilter: TimeFilter;
  user: User | null;
}

type LbRow = {
  id: string;
  user_id: string;
  display_name: string | null;
  score: number;
  word_count: number | null;
  created_at: string;
  rank: number;
};

const PLACEHOLDER_NAMES = [
  "Arjun M.", "Priya S.", "Vikram R.", "Ananya K.", "Rohit P.",
  "Siddharth G.", "Meera T.", "Karan N.", "Divya R.", "Aditya P.",
];

function candidateName(row: LbRow): string {
  return row.display_name ?? PLACEHOLDER_NAMES[row.rank - 1] ?? "Aspirant";
}

export function lbRating(score: number): { label: string; tone: string } {
  if (score >= 85) return { label: "Distinguished", tone: "text-gold" };
  if (score >= 70) return { label: "Commendable", tone: "text-success" };
  if (score >= 55) return { label: "Proficient", tone: "text-foreground/80" };
  return { label: "Satisfactory", tone: "text-muted-foreground" };
}

function dateCutoff(filter: TimeFilter): string | null {
  if (filter === "all") return null;
  const d = new Date();
  d.setDate(d.getDate() - (filter === "week" ? 7 : 30));
  return d.toISOString();
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function LeaderboardTable({ testType, timeFilter, user }: LeaderboardTableProps) {
  const [rows, setRows] = useState<LbRow[]>([]);
  const [userRow, setUserRow] = useState<(LbRow & { userRank: number }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setRows([]);
      setUserRow(null);
      try {
        const testTypeFilter = `${testType}_full`;
        const cutoff = dateCutoff(timeFilter);

        let q = supabase
          .from("test_attempts")
          .select("id, user_id, display_name, score, word_count, created_at")
          .eq("test_type", testTypeFilter)
          .not("score", "is", null)
          .not("display_name", "is", null)
          .order("score", { ascending: false })
          .limit(200);

        if (cutoff) q = q.gte("created_at", cutoff);

        const { data, error } = await q;
        if (error) { setLoading(false); return; }

        // Deduplicate: keep best (first) score per user_id.
        // Rows with null user_id are seed/ghost entries — always include.
        const seen = new Set<string>();
        const deduped = (data ?? []).filter((row) => {
          if (!row.user_id) return true;
          if (seen.has(row.user_id)) return false;
          seen.add(row.user_id);
          return true;
        });

        const ranked: LbRow[] = deduped.map((row, i) => ({ ...row, rank: i + 1 }));
        setRows(ranked);
        setEmpty(ranked.length === 0);

        // User's pinned row — best score all time
        if (user) {
          const { data: best } = await supabase
            .from("test_attempts")
            .select("id, user_id, display_name, score, word_count, created_at")
            .eq("test_type", testTypeFilter)
            .eq("user_id", user.id)
            .not("score", "is", null)
            .order("score", { ascending: false })
            .limit(1);

          const ua = best?.[0];
          if (ua) {
            const { count: better } = await supabase
              .from("test_attempts")
              .select("*", { count: "exact", head: true })
              .eq("test_type", testTypeFilter)
              .not("score", "is", null)
              .not("display_name", "is", null)
              .gt("score", ua.score);
            const uRank = (better ?? 0) + 1;
            setUserRow({ ...ua, rank: uRank, userRank: uRank });
          }
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [testType, timeFilter, user]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-12">
        <div className="h-4 w-4 animate-spin rounded-full border border-gold/20 border-t-gold" />
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          Loading rankings…
        </p>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="border border-border py-16 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
          No results yet
        </p>
        <p className="mt-2 text-sm text-muted-foreground/60">
          Complete a full simulation to appear on the leaderboard.
        </p>
      </div>
    );
  }

  const COL = "44px 1fr 80px auto 60px 70px";

  return (
    <div className="border border-border">
      {/* Header */}
      <div
        className="grid items-center gap-3 bg-surface-2 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
        style={{ gridTemplateColumns: COL }}
      >
        <span>#</span>
        <span>Candidate</span>
        <span>Score</span>
        <span>Rating</span>
        <span className="hidden sm:block">Words</span>
        <span className="hidden sm:block">Date</span>
      </div>

      {/* Rows */}
      {rows.map((row) => {
        const isTop3 = row.rank <= 3;
        const r = lbRating(row.score);
        const isOwnRow = user?.id === row.user_id;
        return (
          <div
            key={row.id}
            className={`grid items-center gap-3 border-t border-border/50 px-5 py-[14px] transition-colors hover:bg-surface-1/60 ${
              isOwnRow ? "bg-gold/5" : ""
            }`}
            style={{ gridTemplateColumns: COL }}
          >
            <span className={`font-mono text-xs tabular-nums ${isTop3 ? "text-gold" : "text-muted-foreground"}`}>
              {String(row.rank).padStart(2, "0")}
            </span>
            <span className="truncate text-[13px] text-foreground">
              {isOwnRow ? "You" : candidateName(row)}
            </span>
            <span className={`font-mono text-[22px] tabular-nums ${isTop3 ? "text-gold" : "text-foreground"}`}>
              {row.score}
            </span>
            <span className={`font-mono text-[10px] uppercase tracking-[0.1em] ${r.tone}`}>
              {r.label}
            </span>
            <span className="hidden font-mono text-[11px] tabular-nums text-muted-foreground sm:block">
              {row.word_count ?? "—"}
            </span>
            <span className="hidden font-mono text-[11px] text-muted-foreground sm:block">
              {shortDate(row.created_at)}
            </span>
          </div>
        );
      })}

      {/* Separator */}
      {user && userRow && (
        <div className="border-t border-border/50 px-5 py-2">
          <span className="font-mono text-[10px] text-muted-foreground/40">···</span>
        </div>
      )}

      {/* Pinned user row */}
      {user && userRow && (
        <div
          className="grid items-center gap-3 border-t border-border/50 px-5 py-[14px]"
          style={{
            gridTemplateColumns: COL,
            borderLeft: "3px solid var(--color-gold)",
            backgroundColor: "oklch(0.74 0.13 85 / 0.12)",
          }}
        >
          <span className="font-mono text-xs tabular-nums text-gold">
            {String(userRow.userRank).padStart(2, "0")}
          </span>
          <span className="text-[13px] text-foreground">You</span>
          <span className="font-mono text-[22px] tabular-nums text-foreground">
            {userRow.score}
          </span>
          <span className={`font-mono text-[10px] uppercase tracking-[0.1em] ${lbRating(userRow.score).tone}`}>
            {lbRating(userRow.score).label}
          </span>
          <span className="hidden font-mono text-[11px] tabular-nums text-muted-foreground sm:block">
            {userRow.word_count ?? "—"}
          </span>
          <span className="hidden font-mono text-[11px] text-muted-foreground sm:block">
            {shortDate(userRow.created_at)}
          </span>
        </div>
      )}
    </div>
  );
}
