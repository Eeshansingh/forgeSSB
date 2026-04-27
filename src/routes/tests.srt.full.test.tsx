import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SRT_SITUATIONS } from "@/lib/srt-data";

export const Route = createFileRoute("/tests/srt/full/test")({
  head: () => ({
    meta: [
      { title: "SRT — Live Assessment — ForgeSSB" },
      { name: "description", content: "Situation Reaction Test — live assessment in progress." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SrtTestScreen,
});

const SECONDS_PER_WORD = 30;

function SrtTestScreen() {
  const navigate = useNavigate();
  const stored = sessionStorage.getItem("srt_word_count");
  const TOTAL_WORDS = stored ? Math.min(parseInt(stored), SRT_SITUATIONS.length) : 60;
  const situations = useMemo(() => {
    const shuffled = [...SRT_SITUATIONS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, TOTAL_WORDS);
  }, [TOTAL_WORDS]);
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState("");
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_WORD);
  const [allResponses, setAllResponses] = useState<{ situation: string; response: string }[]>([]);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const situation = situations[index];
  const isLast = index >= TOTAL_WORDS - 1;

  useEffect(() => {
    textareaRef.current?.focus();
  }, [index]);

  useEffect(() => {
    setTimeLeft(SECONDS_PER_WORD);
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [index]);

  useEffect(() => {
    if (timeLeft !== 0) return;
    advance();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  function advance() {
    const updated = [...allResponses, { situation, response }];
    setAllResponses(updated);
    if (isLast) {
      sessionStorage.setItem("srt_responses", JSON.stringify(updated));
      navigate({ to: "/tests/srt/full/results" });
      return;
    }
    setIndex((i) => i + 1);
    setResponse("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    advance();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      advance();
    }
  }

  function endSession() {
    setShowEndConfirm(true);
  }

  const progressPct = ((index + 1) / TOTAL_WORDS) * 100;
  const timerPct = (timeLeft / SECONDS_PER_WORD) * 100;

  const timerTone =
    timeLeft <= 5 ? "text-danger" : timeLeft <= 10 ? "text-amber" : "text-gold";

  const timerBarColour =
    timeLeft <= 5 ? "bg-danger" : timeLeft <= 10 ? "bg-amber" : "bg-gold";

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerText = `${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* TOP BAR */}
      <header className="border-b border-border/50 px-4 py-4 sm:px-8 sm:py-5">
        <div className="mx-auto flex max-w-5xl items-center gap-4 sm:gap-6">
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-gold">
            SRT · Live
          </div>
          <div className="flex-1">
            <div className="mb-1.5 flex items-center justify-between font-mono text-xs">
              <span className="text-muted-foreground">PROGRESS</span>
              <span className="text-foreground">
                {String(index + 1).padStart(2, "0")} / {TOTAL_WORDS}
              </span>
            </div>
            <div className="h-px w-full bg-border">
              <div
                className="h-full bg-gold transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={endSession}
            className="shrink-0 border border-border/50 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
          >
            ✕ End
          </button>
        </div>
        {showEndConfirm && (
          <div className="mt-3 flex flex-col gap-3 border-t border-border/50 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-[11px] text-muted-foreground">
              End this session? Your progress will be lost.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate({ to: "/tests" })}
                className="border border-gold bg-gold/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-gold transition-all hover:bg-gold hover:text-primary-foreground"
              >
                Yes, End Session
              </button>
              <button
                type="button"
                onClick={() => setShowEndConfirm(false)}
                className="px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </header>

      {/* CENTRE */}
      <div className="relative flex flex-1 items-start justify-center overflow-y-auto px-4 py-6 sm:items-center sm:px-6">
        <div className="absolute inset-0 grid-texture opacity-40" aria-hidden="true" />
        <div className="relative w-full max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-gold/70">
            Situation
          </p>
          <p
            key={index}
            className="animate-word-in mt-4 font-serif text-xl leading-relaxed text-foreground"
          >
            {situation}
          </p>
          <form onSubmit={handleSubmit} className="mt-6 sm:mt-8">
            <textarea
              ref={textareaRef}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you would do..."
              rows={3}
              autoComplete="off"
              className="w-full resize-none border border-border bg-surface-1/40 px-4 py-3 font-serif text-base text-foreground placeholder:font-sans placeholder:text-sm placeholder:uppercase placeholder:tracking-[0.2em] placeholder:text-muted-foreground/70 focus:border-gold focus:bg-surface-1 focus:outline-none sm:px-5 sm:py-4 sm:text-lg"
            />
            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="hidden font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:block">
                Enter to submit · Shift+Enter for new line · Auto-advance on timer
              </p>
              <button
                type="submit"
                className="border border-gold/60 bg-gold/10 px-8 py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-gold transition-colors hover:bg-gold/20 active:bg-gold/30 sm:ml-auto"
              >
                Submit →
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* BOTTOM TIMER */}
      <footer className="border-t border-border/50 px-4 py-4 sm:px-8 sm:py-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-end justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Time Remaining
            </p>
            <p className={`font-mono text-4xl font-medium tabular-nums sm:text-5xl ${timerTone}`}>
              {timerText}
            </p>
          </div>
          <div className="mt-3 h-1 w-full bg-border/60">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${timerBarColour}`}
              style={{ width: `${timerPct}%` }}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
