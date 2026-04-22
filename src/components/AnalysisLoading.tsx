import { useEffect, useState } from "react";

const MESSAGES = [
  "Analysing your responses...",
  "Mapping OLQ patterns...",
  "Evaluating leadership indicators...",
  "Generating your assessment...",
  "Almost ready...",
];

export function AnalysisLoading() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [showSlowNote, setShowSlowNote] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 3000);
    const timeout = setTimeout(() => setShowSlowNote(true), 10000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      <div className="relative flex items-center justify-center">
        <div className="h-24 w-24 animate-spin rounded-full border border-gold/20 border-t-gold" />
        <div
          className="absolute h-16 w-16 animate-spin rounded-full border border-gold/10 border-t-gold/60"
          style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
        />
        <div className="absolute font-serif text-2xl text-gold">★</div>
      </div>
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-gold">
          {MESSAGES[msgIndex]}
        </p>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          AI assessment in progress · Please wait
        </p>
      </div>
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1 w-8 bg-gold/30"
            style={{
              animation: "pulse 1.5s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      {showSlowNote && (
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60">
          Complex assessments can take up to 30 seconds. Please wait.
        </p>
      )}
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/50">
        Forged under pressure
      </p>
    </div>
  );
}
