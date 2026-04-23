import { useEffect, useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { supabase, signInWithGoogle, signOut } from "@/lib/supabase";
import { OLQS } from "@/lib/wat-data";
import type { User } from "@supabase/supabase-js";

type OlqScores = Record<string, number>;

type TestAttempt = {
  id: string;
  user_id: string;
  test_type: string;
  created_at: string;
  word_count: number | null;
  analysis: { olq_scores: OlqScores } | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function compositeScore(scores: OlqScores): number {
  const vals = Object.values(scores);
  if (!vals.length) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function testTypeLabel(type: string) {
  if (type === "wat_full") return "WAT Full Simulation";
  if (type === "wat_practice") return "WAT Practice";
  return type;
}

interface MyJourneyProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

export function MyJourney({ open, onClose, user }: MyJourneyProps) {
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    supabase
      .from("test_attempts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setAttempts((data as TestAttempt[]) ?? []);
        setLoading(false);
      });
  }, [open, user]);

  const userName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email ??
    "Officer";

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/60 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-gold/30 shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ backgroundColor: "#1A2218" }}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">ForgeSSB</p>
            <h2 className="font-serif text-2xl text-foreground">My Journey</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Every assessment you complete is saved here. Track your OLQ profile as your preparation develops.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-gold hover:text-gold"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!user ? (
            <div className="flex flex-col items-center justify-center gap-6 px-8 py-16 text-center">
              <div className="font-serif text-5xl text-gold">★</div>
              <p className="text-sm text-muted-foreground">Sign in to track your progress across sessions.</p>
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                className="inline-flex items-center gap-3 border border-gold bg-gold/10 px-7 py-3 text-xs uppercase tracking-[0.22em] text-gold transition-all hover:bg-gold hover:text-primary-foreground"
              >
                Sign In with Google
              </button>
            </div>
          ) : (
            <div className="px-6 py-6">
              <div className="mb-6 border border-border/40 bg-surface-1 px-5 py-4">
                <p className="font-serif text-lg text-foreground">{userName}</p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">{user.email}</p>
              </div>

              {loading ? (
                <div className="flex items-center gap-3 py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border border-gold/20 border-t-gold" />
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Loading attempts…
                  </p>
                </div>
              ) : attempts.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    No attempts yet
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground/60">
                    Your assessment history will appear here once you complete a test.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-gold">
                    {attempts.length} Attempt{attempts.length !== 1 ? "s" : ""}
                  </p>
                  {attempts.map((attempt) => {
                    const isExpanded = expanded === attempt.id;
                    const scores = attempt.analysis?.olq_scores ?? {};
                    const hasScores = Object.keys(scores).length > 0;
                    const raw = hasScores ? compositeScore(scores) : null;
                    const composite = raw && !isNaN(raw) ? raw : null;

                    return (
                      <div key={attempt.id} className="border border-border/50 bg-surface-1">
                        <button
                          type="button"
                          onClick={() => setExpanded(isExpanded ? null : attempt.id)}
                          className="flex w-full items-center justify-between px-4 py-4 text-left transition-colors hover:bg-surface-2/50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-serif text-sm text-foreground">
                              {testTypeLabel(attempt.test_type)}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="font-mono text-[11px] text-muted-foreground">
                                {formatDate(attempt.created_at)}
                              </span>
                              {!!attempt.word_count && (
                                <span className="font-mono text-[11px] text-muted-foreground">
                                  · {attempt.word_count} words
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="ml-4 flex items-center gap-3">
                            <span className="font-mono text-lg tabular-nums text-gold">
                              {composite !== null ? composite : "—"}
                            </span>
                            <ChevronDown
                              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </button>

                        {isExpanded && hasScores && (
                          <div className="border-t border-border/40 px-4 pb-5 pt-4">
                            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-gold">
                              OLQ Breakdown
                            </p>
                            <div className="space-y-2.5">
                              {OLQS.map((olq) => {
                                const score = scores[olq] ?? 0;
                                return (
                                  <div key={olq} className="flex items-center gap-3">
                                    <span className="w-32 shrink-0 font-mono text-[10px] leading-tight text-muted-foreground">
                                      {olq}
                                    </span>
                                    <div className="h-1 flex-1 bg-border/60">
                                      <div
                                        className="h-full bg-gold transition-all"
                                        style={{ width: `${score}%` }}
                                      />
                                    </div>
                                    <span className="w-7 text-right font-mono text-[11px] tabular-nums text-foreground/80">
                                      {score}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {user && (
          <div className="border-t border-border/60 px-6 py-4">
            <button
              type="button"
              onClick={() => void signOut()}
              className="w-full border border-border/60 px-4 py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground transition-all hover:border-destructive hover:text-destructive"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </>
  );
}
