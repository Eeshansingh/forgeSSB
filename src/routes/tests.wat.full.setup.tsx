import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/tests/wat/full/setup")({
  head: () => ({
    meta: [{ title: "WAT Setup — ForgeSSB" }],
  }),
  component: SetupPage,
});

function SetupPage() {
  const navigate = useNavigate();

  function commence() {
    sessionStorage.setItem("wat_word_count", "60");
    navigate({ to: "/tests/wat/full/test" });
  }

  return (
    <section className="relative">
      <div className="absolute inset-0 grid-texture-fine opacity-60" aria-hidden="true" />
      <div className="relative mx-auto max-w-2xl px-6 py-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">
          Full Simulation · Setup
        </p>
        <h1 className="mt-3 font-serif text-4xl text-foreground sm:text-5xl">
          Confirm Assessment Parameters
        </h1>
        <div className="mt-6 h-px w-20 bg-gold/50" />

        <p className="mt-8 text-base leading-relaxed text-foreground/80">
          This full simulation mirrors the standard SSB WAT format. The run is fixed at
          sixty stimulus words with fifteen minutes total duration.
        </p>

        <div className="mt-10 border border-gold/40 bg-surface-1/50 p-6 sm:p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Mission Profile
          </p>
          <p className="mt-2 font-serif text-3xl text-gold sm:text-4xl">60 words · 15 min</p>
          <p className="mt-4 text-sm leading-relaxed text-foreground/75">
            Once commenced, words will advance every 15 seconds. Complete all responses in
            sequence for final OLQ analysis.
          </p>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 border-t border-border pt-10">
          <button
            type="button"
            onClick={commence}
            className="inline-flex w-full items-center justify-center gap-3 border border-gold bg-gold/10 px-8 py-4 text-center text-sm font-medium uppercase tracking-[0.2em] text-gold transition-all hover:bg-gold hover:text-primary-foreground sm:w-auto"
          >
            Commence Assessment →
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