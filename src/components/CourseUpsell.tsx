import { Link } from "@tanstack/react-router";

interface Props {
  lowestOlq?: string;
}

export function CourseUpsell({ lowestOlq }: Props) {
  return (
    <div className="border border-gold/30 bg-[#0d120d] p-6 sm:p-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">
          30-Day Journey — ₹300
        </p>
        <h3 className="mt-3 font-serif text-2xl text-foreground leading-snug">
          {lowestOlq
            ? <>Your <span className="italic text-gold">{lowestOlq}</span> score shows the gap. The programme closes it.</>
            : <>You've seen your gaps. A structured 30 days closes them.</>}
        </h3>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xl">
          Day 1 maps all 15 OLQs through an AI calibration test. Days 2–30 drill your weakest quality each session — WAT practice, a reflection, and a daily mission that trains the behaviour, not just the test.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center border border-gold bg-gold px-7 py-3 text-sm font-medium uppercase tracking-[0.18em] text-[#0A0E0A] transition-all hover:opacity-90"
          >
            Start the Journey — ₹300 →
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center border border-border/60 px-7 py-3 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground transition-all hover:border-gold/40 hover:text-foreground"
          >
            See all plans
          </Link>
        </div>
        <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50">
          One payment · Lifetime access · No subscription
        </p>
      </div>
    </div>
  );
}
