import type { JourneySession } from "@/lib/journey-content";
import { SESSION_TYPE_DESC, SESSION_TYPE_TAGS, sessionTitle } from "@/lib/dashboard-content";

type Phase = { name: string; start: number; end: number };

type Props = {
  firstName: string;
  dayN: number;
  totalDays: number;
  phaseName: string;
  progressPct: number;
  allComplete: boolean;
  currentN: number | null;
  currentJourney: JourneySession | null;
  nextN: number | null;
  nextJourney: JourneySession | null;
  phaseRail: Phase[];
  currentPhaseIdx: number;
  latestObservation: string | null;
  onBeginSession: (n: number) => void;
  onGoReveal: () => void;
  onGoPractice: () => void;
};

export function HomeTab({
  firstName,
  dayN,
  totalDays,
  phaseName,
  progressPct,
  allComplete,
  currentN,
  currentJourney,
  nextN,
  nextJourney,
  phaseRail,
  currentPhaseIdx,
  latestObservation,
  onBeginSession,
  onGoReveal,
  onGoPractice,
}: Props) {
  const done = allComplete || currentN === null;

  return (
    <div>
      <div className="mb-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {firstName ? `Good day, ${firstName}.` : "Good day."}
        </p>
        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <span className="font-serif text-[38px] font-bold leading-none tracking-tight text-foreground">
            Day {allComplete ? totalDays : (dayN ?? 1)}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            of {totalDays} · {phaseName} phase · {progressPct}% complete
          </span>
        </div>
      </div>

      {done ? (
        <CompletedState
          dayN={dayN}
          allComplete={allComplete}
          currentJourney={currentJourney}
          nextN={nextN}
          nextJourney={nextJourney}
          latestObservation={latestObservation}
          onGoReveal={onGoReveal}
          onGoPractice={onGoPractice}
        />
      ) : (
        <ActiveState
          dayN={currentN as number}
          currentJourney={currentJourney as JourneySession}
          phaseRail={phaseRail}
          currentPhaseIdx={currentPhaseIdx}
          onBeginSession={onBeginSession}
        />
      )}
    </div>
  );
}

function ActiveState({
  dayN,
  currentJourney,
  phaseRail,
  currentPhaseIdx,
  onBeginSession,
}: {
  dayN: number;
  currentJourney: JourneySession;
  phaseRail: Phase[];
  currentPhaseIdx: number;
  onBeginSession: (n: number) => void;
}) {
  return (
    <div className="relative overflow-hidden border border-gold bg-surface-1">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-gold to-gold/30" />
      <div className="flex flex-col gap-8 p-5 sm:flex-row sm:p-7">
        <div className="min-w-0 flex-1">
          <div className="mb-2.5 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-gold">Day {dayN} · Today's session</span>
          </div>
          <p className="mb-2 font-serif text-[26px] font-bold leading-tight text-foreground">{sessionTitle(currentJourney)}</p>
          <p className="mb-4 max-w-[52ch] text-[13px] leading-relaxed text-muted-foreground">
            {SESSION_TYPE_DESC[currentJourney.session_type]}
          </p>
          <div className="mb-5 flex flex-wrap gap-1.5">
            {SESSION_TYPE_TAGS[currentJourney.session_type].map((tag) => (
              <span key={tag} className="border border-border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                {tag}
              </span>
            ))}
            <span className="border border-border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-gold">15 min</span>
          </div>
          <button
            type="button"
            onClick={() => onBeginSession(dayN)}
            className="inline-flex items-center justify-center bg-gold px-6 py-3.5 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-[#0A0E0A]"
          >
            Begin Today's Session →
          </button>
        </div>
        <div className="w-full shrink-0 sm:w-[190px]">
          <p className="mb-2.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Where you are</p>
          <div className="flex flex-col gap-2">
            {phaseRail.map((ph, i) => {
              const isDone = i < currentPhaseIdx;
              const isCurrent = i === currentPhaseIdx;
              const color = isCurrent ? "text-gold" : isDone ? "text-muted-foreground" : "text-muted-foreground/50";
              return (
                <div key={ph.name} className="flex items-center gap-2">
                  <span className={`w-3.5 shrink-0 text-center font-mono text-[11px] ${color}`}>{isDone ? "✓" : isCurrent ? "●" : "○"}</span>
                  <span className={`flex-1 text-xs ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>{ph.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompletedState({
  dayN,
  allComplete,
  currentJourney,
  nextN,
  nextJourney,
  latestObservation,
  onGoReveal,
  onGoPractice,
}: {
  dayN: number;
  allComplete: boolean;
  currentJourney: JourneySession | null;
  nextN: number | null;
  nextJourney: JourneySession | null;
  latestObservation: string | null;
  onGoReveal: () => void;
  onGoPractice: () => void;
}) {
  return (
    <div>
      <div className="mb-4 border-l-[3px] border-success bg-surface-1 p-6">
        <div className="mb-1.5 flex items-center gap-3">
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-success text-[15px] text-success">✓</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-success">
            {allComplete ? "Journey complete" : `Day ${dayN} complete`}
          </span>
        </div>
        <p className="mt-1.5 font-serif text-[24px] font-bold leading-tight text-foreground">
          {allComplete ? "30 sessions. The work is done." : `${currentJourney ? sessionTitle(currentJourney) : "Today"} — done.`}
        </p>
        <p className="mt-1 max-w-[54ch] text-[13px] leading-relaxed text-muted-foreground">
          {allComplete
            ? "Your Day 1 and Day 30 profiles are ready to compare."
            : `${dayN} sessions completed. See your full pattern in Insights.`}
        </p>
      </div>

      {latestObservation && (
        <div className="mb-4 border border-gold bg-surface-1 p-5">
          <p className="mb-2.5 font-mono text-[9px] uppercase tracking-[0.22em] text-gold">What we noticed today</p>
          <p className="font-serif text-base italic leading-relaxed text-foreground">"{latestObservation}"</p>
        </div>
      )}

      {allComplete ? (
        <button
          type="button"
          onClick={onGoReveal}
          className="mb-4 flex w-full items-center justify-between gap-4 border border-gold/40 bg-gold/10 px-5 py-4 text-left"
        >
          <p className="font-serif text-base text-foreground">View your Day 30 Reveal</p>
          <span className="font-mono text-lg text-gold">→</span>
        </button>
      ) : (
        nextN !== null &&
        nextJourney && (
          <div className="mb-4 border border-border bg-surface-1 p-5">
            <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Tomorrow · Day {nextN}</p>
            <p className="font-serif text-lg font-bold text-foreground">{sessionTitle(nextJourney)}</p>
          </div>
        )
      )}

      <button
        type="button"
        onClick={onGoPractice}
        className="flex w-full items-center justify-between gap-4 border border-gold/40 bg-gold/10 px-5 py-4 text-left"
      >
        <div>
          <p className="font-serif text-[15px] text-foreground">Your next session is tomorrow. You can practice more today.</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Run unlimited WAT &amp; SRT reps — keep the reflex sharp between missions.</p>
        </div>
        <span className="shrink-0 font-mono text-lg text-gold">→</span>
      </button>
    </div>
  );
}
