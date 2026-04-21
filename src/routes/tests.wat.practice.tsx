import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PRACTICE_SYSTEM_PROMPT } from "@/lib/anthropic";
import { WAT_WORDS } from "@/lib/wat-data";

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

const PRACTICE_COUNTS = [5, 10, 20, 30, 60] as const;
const WORD_TIME_LIMIT = 15;

type PracticeFeedback = {
  analysis: string;
  olqs_demonstrated: { olq: string; strength: string; note: string }[];
  improved_response: string;
  coaching_note: string;
};

async function requestPracticeFeedback(word: string, response: string): Promise<PracticeFeedback> {
  const apiResponse = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      system: PRACTICE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Stimulus word: "${word}"\nCandidate response: "${response}"`,
        },
      ],
    }),
  });

  const data = await apiResponse.json();
  const raw = data.content?.[0]?.text ?? "{}";
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  const parsed = JSON.parse(cleaned);

  return {
    analysis: parsed.analysis ?? "No analysis generated.",
    olqs_demonstrated: Array.isArray(parsed.olqs_demonstrated)
      ? parsed.olqs_demonstrated
      : [],
    improved_response: parsed.improved_response ?? "No improved response generated.",
    coaching_note: parsed.coaching_note ?? "No coaching note generated.",
  };
}

function PracticePage() {
  const [started, setStarted] = useState(false);
  const [wordCount, setWordCount] = useState<(typeof PRACTICE_COUNTS)[number]>(10);
  const [mode, setMode] = useState<"timed" | "untimed">("timed");
  const [words, setWords] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState("");
  const [submittedResponse, setSubmittedResponse] = useState("");
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(WORD_TIME_LIMIT);
  const inputRef = useRef<HTMLInputElement>(null);

  const word = words[index] ?? "";
  const isTimed = mode === "timed";
  const isLastWord = index >= words.length - 1;

  useEffect(() => {
    if (started && !feedback) {
      inputRef.current?.focus();
    }
  }, [started, index, feedback]);

  useEffect(() => {
    if (!started || !isTimed || feedback || isLoadingFeedback || !word) return;
    if (timeLeft <= 0) {
      void handleSubmit();
      return;
    }

    const timer = window.setTimeout(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [started, isTimed, feedback, isLoadingFeedback, timeLeft, word]);

  function startSession() {
    const shuffled = [...WAT_WORDS].sort(() => Math.random() - 0.5).slice(0, wordCount);
    setWords(shuffled);
    setStarted(true);
    setIndex(0);
    setResponse("");
    setSubmittedResponse("");
    setFeedback(null);
    setFeedbackError(null);
    setTimeLeft(WORD_TIME_LIMIT);
  }

  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    if (!word || feedback || isLoadingFeedback) return;

    const finalResponse = response.trim();
    setSubmittedResponse(finalResponse || "[No response]");
    setIsLoadingFeedback(true);
    setFeedbackError(null);
    try {
      const aiFeedback = await requestPracticeFeedback(word, finalResponse);
      setFeedback(aiFeedback);
    } catch {
      setFeedbackError("Feedback could not be generated. Proceed to the next word.");
      setFeedback({
        analysis: "Feedback unavailable for this response.",
        olqs_demonstrated: [],
        improved_response: "No improved response generated.",
        coaching_note: "Continue with the next word and maintain response discipline.",
      });
    } finally {
      setIsLoadingFeedback(false);
    }
  }

  function nextWord() {
    if (isLastWord) {
      setStarted(false);
      setWords([]);
      setIndex(0);
      setResponse("");
      setSubmittedResponse("");
      setFeedback(null);
      setFeedbackError(null);
      setTimeLeft(WORD_TIME_LIMIT);
      return;
    }
    setIndex((i) => i + 1);
    setResponse("");
    setSubmittedResponse("");
    setFeedback(null);
    setFeedbackError(null);
    setTimeLeft(WORD_TIME_LIMIT);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border/50 px-8 py-5">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-gold">
            WAT · Practice
          </p>
          <Link
            to="/tests/wat"
            className="border border-border bg-transparent px-3 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:border-gold/40 hover:text-foreground"
          >
            End Session
          </Link>
        </div>
      </header>

      <div className="relative flex-1 px-6 py-12">
        <div className="absolute inset-0 grid-texture opacity-30" aria-hidden="true" />
        <div className="relative mx-auto max-w-2xl">
          {!started ? (
            <section className="border border-border bg-surface-1/50 p-6 sm:p-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">
                Practice Mode · Setup
              </p>
              <h1 className="mt-3 font-serif text-3xl text-foreground sm:text-4xl">
                Configure Training Session
              </h1>
              <div className="mt-6 h-px w-20 bg-gold/50" />
              <p className="mt-6 text-sm leading-relaxed text-foreground/80">
                Select word count and timing mode before commencing your WAT drill.
              </p>

              <div className="mt-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  Word Count
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {PRACTICE_COUNTS.map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setWordCount(count)}
                      className={`border px-3 py-4 font-serif text-xl transition-all ${
                        wordCount === count
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-border bg-surface-1 text-foreground/70 hover:border-gold/40 hover:text-foreground"
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  Session Mode
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(["timed", "untimed"] as const).map((sessionMode) => (
                    <button
                      key={sessionMode}
                      type="button"
                      onClick={() => setMode(sessionMode)}
                      className={`border px-4 py-4 font-mono text-xs uppercase tracking-[0.2em] transition-all ${
                        mode === sessionMode
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-border bg-surface-1 text-foreground/70 hover:border-gold/40 hover:text-foreground"
                      }`}
                    >
                      {sessionMode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-10 border border-gold/40 bg-surface-2/50 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  Session Profile
                </p>
                <p className="mt-2 font-serif text-2xl text-foreground">
                  {wordCount} words ·{" "}
                  <span className="text-gold">{isTimed ? "timed (15s/word)" : "untimed"}</span>
                </p>
              </div>

              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={startSession}
                  className="inline-flex w-full items-center justify-center gap-2 border border-gold bg-gold/10 px-7 py-3 text-center text-sm font-medium uppercase tracking-[0.18em] text-gold transition-all hover:bg-gold hover:text-primary-foreground sm:w-auto"
                >
                  Commence Practice →
                </button>
              </div>
            </section>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-gold/70">
                  Stimulus · Round {index + 1}/{words.length}
                </p>
                {isTimed && (
                  <p className={`font-mono text-xs uppercase tracking-[0.2em] ${timeLeft <= 5 ? "text-danger" : "text-gold"}`}>
                    T-{timeLeft}s
                  </p>
                )}
              </div>
              <h1
                key={index}
                className="animate-word-in mt-6 text-center font-serif font-semibold uppercase leading-none text-foreground"
                style={{ fontSize: "clamp(2.5rem, 11vw, 6rem)", letterSpacing: "0.05em" }}
              >
                {word}
              </h1>

              <form onSubmit={handleSubmit} className="mt-10">
                <input
                  ref={inputRef}
                  type="text"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  disabled={!!feedback || isLoadingFeedback}
                  placeholder="Your response..."
                  autoComplete="off"
                  className="w-full border-b-2 border-border bg-surface-1/40 px-4 py-4 text-center font-serif text-xl text-foreground placeholder:font-sans placeholder:text-sm placeholder:uppercase placeholder:tracking-[0.2em] placeholder:text-muted-foreground/70 focus:border-gold focus:bg-surface-1 focus:outline-none disabled:opacity-60 sm:px-5 sm:text-2xl"
                />
                {!feedback && (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="submit"
                      disabled={isLoadingFeedback || !response.trim()}
                      className="inline-flex items-center gap-2 border border-gold bg-gold/5 px-7 py-3 text-sm font-medium uppercase tracking-[0.18em] text-gold transition-all hover:bg-gold hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-gold/5 disabled:hover:text-gold"
                    >
                      {isLoadingFeedback ? "Analysing..." : "Submit"}
                    </button>
                  </div>
                )}
              </form>

              {feedback && (
                <div className="mt-10 animate-word-in border border-gold/40 bg-surface-1 p-5 shadow-[0_12px_40px_-16px_rgba(201,168,76,0.4)] sm:p-6">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">
                      AI Feedback
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                      {isTimed ? "Timed" : "Untimed"}
                    </p>
                  </div>

                  <p className="mt-5 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Your response
                  </p>
                  <p className="mt-2 font-serif text-lg text-foreground">
                    <span className="text-gold">{word}</span>{" "}
                    <span className="text-foreground/90">— {submittedResponse}</span>
                  </p>

                  {feedbackError && (
                    <p className="mt-4 text-sm text-danger">{feedbackError}</p>
                  )}

                  <div className="mt-6">
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold">
                      Analysis
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                      {feedback.analysis}
                    </p>
                  </div>

                  <div className="mt-6">
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold">
                      OLQs Demonstrated
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {feedback.olqs_demonstrated.length > 0 ? (
                        feedback.olqs_demonstrated.map((item, itemIndex) => (
                          <span
                            key={`${item.olq}-${itemIndex}`}
                            className="border border-gold/40 bg-gold/5 px-3 py-1 text-xs text-gold"
                            title={item.note}
                          >
                            {item.olq}
                          </span>
                        ))
                      ) : (
                        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          No OLQ tags returned
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 border-l border-gold/40 bg-surface-2/50 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold">
                      Improved Response
                    </p>
                    <p className="mt-2 text-sm text-foreground/85">
                      {feedback.improved_response}
                    </p>
                  </div>

                  <div className="mt-6 border-l border-gold/40 bg-surface-2/50 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold">
                      Coaching Note
                    </p>
                    <p className="mt-2 text-sm text-foreground/85">{feedback.coaching_note}</p>
                  </div>

                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      onClick={nextWord}
                      className="inline-flex items-center gap-2 border border-gold bg-gold/10 px-7 py-3 text-sm font-medium uppercase tracking-[0.18em] text-gold transition-all hover:bg-gold hover:text-primary-foreground"
                    >
                      {isLastWord ? "Finish Session" : "Next Word"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
