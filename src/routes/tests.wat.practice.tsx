import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { WAT_WORDS, OLQS, MOCK_AI_NOTES } from "@/lib/wat-data";

export const Route = createFileRoute("/tests/wat/practice")({
  head: () => ({
    meta: [
      { title: "WAT Practice Mode — ForgeSSB" },
      { name: "description", content: "Practice the Word Association Test with instant AI feedback." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PracticePage,
});

function pickFeedback() {
  const olqA = OLQS[Math.floor(Math.random() * OLQS.length)];
  let olqB = OLQS[Math.floor(Math.random() * OLQS.length)];
  while (olqB === olqA) olqB = OLQS[Math.floor(Math.random() * OLQS.length)];
  const note = MOCK_AI_NOTES[Math.floor(Math.random() * MOCK_AI_NOTES.length)];
  return {
    olqs: [olqA, olqB] as string[],
    note,
    summary:
      "Your response demonstrates a constructive frame. The verb choice signals personal agency, which the Board scores favourably. Consider extending the response into a complete clause to better expose your reasoning.",
    suggestion:
      "Try anchoring the next response in a first-person action — start with a verb you would actually perform.",
  };
}

function PracticePage() {
  const [words, setWords] = useState<string[]>(() => WAT_WORDS);
  useEffect(() => {
    setWords([...WAT_WORDS].sort(() => Math.random() - 0.5));
  }, []);
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState("");
  const [submittedResponse, setSubmittedResponse] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ReturnType<typeof pickFeedback> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const word = words[index % words.length];

  useEffect(() => {
    inputRef.current?.focus();
  }, [index]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!response.trim()) return;
    setSubmittedResponse(response.trim());
    setFeedback(pickFeedback());
  }

  function nextWord() {
    setIndex((i) => i + 1);
    setResponse("");
    setSubmittedResponse(null);
    setFeedback(null);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="border-b border-border/50 px-8 py-5">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-gold">
            WAT · Practice
          </p>
          <Link
            to="/tests/wat"
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground"
          >
            End Session ✕
          </Link>
        </div>
      </header>

      <div className="relative flex-1 px-6 py-12">
        <div className="absolute inset-0 grid-texture opacity-30" aria-hidden="true" />
        <div className="relative mx-auto max-w-2xl">
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.4em] text-gold/70">
            Stimulus · Round {index + 1}
          </p>
          <h1
            key={index}
            className="animate-word-in mt-6 text-center font-serif font-semibold uppercase leading-none text-foreground"
            style={{ fontSize: "clamp(3rem, 9vw, 6rem)", letterSpacing: "0.05em" }}
          >
            {word}
          </h1>

          <form onSubmit={handleSubmit} className="mt-12">
            <input
              ref={inputRef}
              type="text"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              disabled={!!feedback}
              placeholder="Your response..."
              autoComplete="off"
              className="w-full border-b-2 border-border bg-surface-1/40 px-5 py-4 text-center font-serif text-2xl text-foreground placeholder:font-sans placeholder:text-base placeholder:uppercase placeholder:tracking-[0.2em] placeholder:text-muted-foreground/70 focus:border-gold focus:bg-surface-1 focus:outline-none disabled:opacity-60"
            />
            {!feedback && (
              <div className="mt-6 flex justify-center">
                <button
                  type="submit"
                  disabled={!response.trim()}
                  className="inline-flex items-center gap-2 border border-gold bg-gold/5 px-7 py-3 text-sm font-medium uppercase tracking-[0.18em] text-gold transition-all hover:bg-gold hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-gold/5 disabled:hover:text-gold"
                >
                  Submit Response →
                </button>
              </div>
            )}
          </form>

          {/* Feedback card */}
          {feedback && (
            <div className="mt-10 animate-word-in border border-gold/40 bg-surface-1 p-6 shadow-[0_12px_40px_-16px_rgba(201,168,76,0.4)]">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">
                  AI Analysis
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  {feedback.note}
                </p>
              </div>

              <p className="mt-5 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Your response
              </p>
              <p className="mt-2 font-serif text-lg text-foreground">
                <span className="text-gold">{word}</span>{" "}
                <span className="text-foreground/90">— {submittedResponse}</span>
              </p>

              <div className="mt-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold">
                  OLQ Indicators
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {feedback.olqs.map((o) => (
                    <span
                      key={o}
                      className="border border-gold/40 bg-gold/5 px-3 py-1 text-xs text-gold"
                    >
                      · {o}
                    </span>
                  ))}
                </div>
              </div>

              <p className="mt-6 text-sm leading-relaxed text-foreground/85">
                {feedback.summary}
              </p>

              <div className="mt-6 border-l border-gold/40 bg-surface-2/50 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold">
                  Suggestion
                </p>
                <p className="mt-2 text-sm text-foreground/85">{feedback.suggestion}</p>
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={nextWord}
                  className="inline-flex items-center gap-2 border border-gold bg-gold/10 px-7 py-3 text-sm font-medium uppercase tracking-[0.18em] text-gold transition-all hover:bg-gold hover:text-primary-foreground"
                >
                  Next Word →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
