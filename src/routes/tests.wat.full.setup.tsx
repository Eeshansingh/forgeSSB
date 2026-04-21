import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/tests/wat/full/setup")({
  head: () => ({
    meta: [{ title: "WAT Setup — ForgeSSB" }],
  }),
  component: SetupPage,
});

const OPTIONS = [5, 10, 20, 30, 60];

function SetupPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(60);

  function commence() {
    sessionStorage.setItem("wat_word_count", String(selected));
    navigate({ to: "/tests/wat/full/test" });
  }

  return (
    <section className="relative">
      <div className="absolute inset-0 grid-texture-fine opacity-60" aria-hidden="true" />
      <div className="relative mx-auto max-w-2xl px-6 py-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">
          Full Simulation · Setup
        </p>
        <h1 className="mt-3 font-serif text-5xl text-foreground">Select Word Count</h1>
        <div className="mt-6 h-px w-20 bg-gold/50" />

        <p className="mt-8 text-base leading-relaxed text-foreground/80">
          The standard SSB WAT consists of 60 words. Select a shorter set for practice
          runs or to test the assessment engine. Full 60-word submissions yield the most
          accurate OLQ analysis.
        </p>

        <div className="mt-12 grid grid-cols-5 gap-3">
          {OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setSelected(n)}
              className={`flex flex-col items-center gap-2 border py-6 transition-all ${
                selected === n
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border bg-surface-1 text-foreground/60 hover:border-gold/40 hover:text-foreground"
              }`}
            >
              <span className="font-serif text-3xl">{n}</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em]">
                {n === 60 ? "Full Test" : "Words"}
              </span>
              {n === 60 && (
                <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-gold/70">
                  Recommended
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 border border-border bg-surface-1/40 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Selected
              </p>
              <p className="mt-1 font-serif text-2xl text-foreground">
                {selected} words ·{" "}
                <span className="text-gold">
                  {Math.ceil((selected * 15) / 60)} min {((selected * 15) % 60)}s
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                OLQ Accuracy
              </p>
              <p className={`mt-1 font-mono text-sm ${selected >= 30 ? "text-gold" : selected >= 10 ? "text-amber" : "text-danger"}`}>
                {selected >= 30 ? "High" : selected >= 10 ? "Medium" : "Low"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center gap-4 border-t border-border pt-10">
          <button
            type="button"
            onClick={commence}
            className="inline-flex items-center gap-3 border border-gold bg-gold/10 px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] text-gold transition-all hover:bg-gold hover:text-primary-foreground"
          >
            Commence Assessment — {selected} Words →
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/tests/wat/full/instructions" })}
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
          >
            ← Return to Briefing
          </button>
        </div>
      </div>
    </section>
  );
}