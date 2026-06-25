import { Link } from "@tanstack/react-router";

const OLQ_LABELS = [
  "Effective Intelligence", "Self Confidence", "Initiative",
  "Speed of Decision", "Courage", "Determination",
];

export function JourneyCTA() {
  return (
    <section className="border-t border-border/60 bg-[#0A0E0A]">
      <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">

        {/* Grid texture overlay */}
        <div className="relative overflow-hidden border border-gold/20 bg-[#0d120d] p-8 md:p-14">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

          <div className="relative grid gap-12 md:grid-cols-2 md:gap-20">

            {/* Left — copy */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-gold/80">
                Section II · 30-Day Programme
              </p>
              <h2 className="mt-4 font-serif text-4xl font-semibold leading-[1.05] text-foreground md:text-5xl">
                Know where you<br />
                <span className="italic text-gold">actually</span> stand.
              </h2>
              <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
                Day 1 maps all 15 OLQs from a calibration test. Days 2–30 drill your weakest qualities, one per session, with AI-scored WAT practice and a daily mission.
              </p>

              <div className="mt-4 border-l-2 border-gold/40 pl-4">
                <p className="font-serif text-sm italic text-gold/70">
                  "This profile is locked. It only exists to be beaten."
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to="/pricing"
                  className="inline-flex items-center justify-center border border-gold bg-gold px-7 py-3.5 text-sm font-medium uppercase tracking-[0.18em] text-[#0A0E0A] transition-all hover:opacity-90"
                >
                  Start 30-Day Journey — ₹300 →
                </Link>
                <Link
                  to="/tests"
                  className="inline-flex items-center justify-center border border-border/60 px-7 py-3.5 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground transition-all hover:border-gold/40 hover:text-foreground"
                >
                  Try free first
                </Link>
              </div>

              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">
                One-time · No subscription · Lifetime access
              </p>
            </div>

            {/* Right — OLQ preview card */}
            <div className="flex flex-col justify-center gap-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground/60 mb-1">
                Day 1 calibration — sample profile
              </p>
              {OLQ_LABELS.map((olq, i) => {
                const scores = [84, 71, 58, 79, 63, 88];
                const score  = scores[i] ?? 70;
                const strong = score >= 70;
                return (
                  <div key={olq} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 font-mono text-[10px] text-muted-foreground/70">{olq}</span>
                    <div className="h-px flex-1 bg-border/40 relative">
                      <div
                        className="absolute left-0 top-0 h-full"
                        style={{ width: `${score}%`, background: strong ? "var(--gold, #C9A84C)" : "rgba(138,154,132,.45)" }}
                      />
                    </div>
                    <span
                      className="w-6 text-right font-mono text-[11px] tabular-nums"
                      style={{ color: strong ? "#C9A84C" : "#8A9A84" }}
                    >
                      {score}
                    </span>
                  </div>
                );
              })}
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40 mt-2">
                + 9 more OLQs · Radar unlocks Day 30
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
