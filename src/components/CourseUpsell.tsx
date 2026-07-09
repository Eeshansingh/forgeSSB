import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface Props {
  lowestOlq?: string;
}

export function CourseUpsell({ lowestOlq }: Props) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-gold">Now what?</p>
      <h2 className="mt-1.5 font-serif text-[26px] font-bold leading-[1.1] text-foreground">
        You've taken the calibration.
        <br />
        The work starts here.
      </h2>
      <p className="mt-3 max-w-[60ch] text-[13px] leading-relaxed text-muted-foreground">
        {lowestOlq ? (
          <>
            Your <span className="italic text-gold">{lowestOlq}</span> score shows where to start. The Journey turns
            the 15 OLQs we just mapped into a 30-session training programme — one mission per day, priority order.
          </>
        ) : (
          <>
            The Journey turns the 15 OLQs we just mapped into a 30-session training programme — one mission per day,
            in priority order.
          </>
        )}
      </p>

      <div className="mt-5 bg-gold p-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <Tag>30 sessions</Tag>
          <Tag>Daily · 15 min</Tag>
          <Tag>AI-scored</Tag>
        </div>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-2.5 bg-[#0A0E0A]/90 px-6 py-4 font-mono text-xs font-bold uppercase tracking-[0.18em] text-gold no-underline"
        >
          Start the 30-Day Journey →
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          to="/pricing"
          className="border border-border px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-gold/40 hover:text-foreground"
        >
          See all plans
        </Link>
      </div>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="border border-[#0A0E0A]/30 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#0A0E0A]/80">
      {children}
    </span>
  );
}
