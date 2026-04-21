import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { WAT_WORDS } from "@/lib/wat-data";

export const Route = createFileRoute("/tests/wat/full/test")({
  head: () => ({
    meta: [
      { title: "WAT — Live Assessment — ForgeSSB" },
      { name: "description", content: "Word Association Test — live assessment in progress." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WatTestScreen,
});

const SECONDS_PER_WORD = 15;
const stored = sessionStorage.getItem("wat_word_count");
const TOTAL_WORDS = stored ? Math.min(parseInt(stored), WAT_WORDS.length) : 60;

export type WatResponse = { word: string; response: string };

function WatTestScreen() {
  const navigate = useNavigate();
  const words = useMemo(() => WAT_WORDS.slice(0, TOTAL_WORDS), []);
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState("");
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_WORD);
  const [allResponses, setAllResponses] = useState<WatResponse[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const word = words[index];
  const isLast = index >= TOTAL_WORDS - 1;

  useEffect(() => {
    inputRef.current?.focus();
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
    const updated = [...allResponses, { word, response }];
    setAllResponses(updated);

    if (isLast) {
      sessionStorage.setItem("wat_responses", JSON.stringify(updated));
      navigate({ to: "/tests/wat/full/results" });
      return;
    }
    setIndex((i) => i + 1);
    setResponse("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    advance();
  }

  const progressPct = ((index + 1) / TOTAL_WORDS) * 100;
  const timerPct = (timeLeft / SECONDS_PER_WORD) * 100;

  const timerTone =
    timeLeft <= 4 ? "text-danger" : timeLeft <= 8 ? "text-amber" : "text-gold";

  const timerBarColour =
    timeLeft <= 4 ? "bg-danger" : timeLeft <= 8 ? "bg-amber" : "bg-gold";

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerText = `${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <header className="border-b border-border/50 px-8 py-5">
        <div className="mx-auto flex max-w-5xl items-center gap-6">
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-gold">
            WAT · Live
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
        </div>
      </header>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6">
        <div className="absolute inset-0 grid-texture opacity-40" aria-hidden="true" />
        <div className="relative w-full max-w-3xl">
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.4em] text-gold/70">
            Stimulus
          </p>
          <h1
            key={index}
            className="animate-word-in mt-6 text-center font-serif font-semibold uppercase leading-none text-foreground"
            style={{ fontSize: "clamp(3.5rem, 11vw, 7rem)", letterSpacing: "0.05em" }}
          >
            {word}
          </h1>
          <form onSubmit={handleSubmit} className="mt-12">
            <input
              ref={inputRef}
              type="text"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Your response..."
              autoComplete="off"
              className="w-full border-b-2 border-border bg-surface-1/40 px-5 py-4 text-center font-serif text-2xl text-foreground placeholder:font-sans placeholder:text-base placeholder:uppercase placeholder:tracking-[0.2em] placeholder:text-muted-foreground/70 focus:border-gold focus:bg-surface-1 focus:outline-none"
            />
            <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Press Enter to submit · Auto-advance on timer
            </p>
          </form>
        </div>
      </div>

      <footer className="border-t border-border/50 px-8 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-end justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Time Remaining
            </p>
            <p className={`font-mono text-5xl font-medium tabular-nums ${timerTone}`}>
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