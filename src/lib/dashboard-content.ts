import type { JourneySession, SessionType } from "@/lib/journey-content";

// The journey/baseline system's OLQ names — note these differ slightly from
// wat-data.ts's OLQS (used by the separate WAT/SRT full-test scoring system):
// "Stamina & Fitness" not "Stamina", "Ability to Influence Group" not "Ability to Influence".
// This exact list must match BASELINE_SYSTEM_PROMPT in lib/anthropic.ts, since that's
// what determines the keys actually saved into a user's baseline practice_scores.
export const JOURNEY_OLQS = [
  "Effective Intelligence", "Reasoning Ability", "Organising Ability",
  "Power of Expression", "Social Adaptability", "Cooperation",
  "Sense of Responsibility", "Initiative", "Self Confidence",
  "Speed of Decision", "Ability to Influence Group", "Liveliness",
  "Determination", "Courage", "Stamina & Fitness",
] as const;

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  calibration: "Calibration",
  olq_drill: "OLQ Drill",
  synthesis: "Synthesis",
  checkpoint: "Check-In",
  simulation: "Simulation",
  social: "Social",
  sd: "Self-Description",
  consolidation: "Consolidation",
  reveal: "Reveal",
};

export const SESSION_TYPE_TAGS: Record<SessionType, string[]> = {
  calibration: ["Calibration", "Reflect"],
  olq_drill: ["Insight", "Practice", "Reflect"],
  synthesis: ["Insight", "Synthesis", "Reflect"],
  checkpoint: ["Check-In", "Reflect"],
  simulation: ["Simulation", "Reflect"],
  social: ["Insight", "Social Task", "Reflect"],
  sd: ["Self-Description", "Reflect"],
  consolidation: ["Insight", "Reflect"],
  reveal: ["Reveal"],
};

export const SESSION_TYPE_DESC: Record<SessionType, string> = {
  calibration: "Establish your OLQ baseline. Honest self-assessment sets the foundation for the next 29 sessions.",
  olq_drill: "Read the insight, complete a short practice drill, and write one reflection. Then your mission.",
  synthesis: "Connect the patterns across what you've practised. Apply them to a realistic SSB scenario.",
  checkpoint: "A structured check-in on your growth. What's moved, what hasn't, and why.",
  simulation: "A full SSB day simulation. AI feedback after.",
  social: "An insight on how the Board reads group behaviour — then a real-world task to test it.",
  sd: "Write your Self-Description. Structured, honest, officer-standard.",
  consolidation: "Pull together everything from this phase before moving forward.",
  reveal: "Your Day 30 profile. Day 1 vs. Day 30 comparison.",
};

export function sessionTitle(s: JourneySession): string {
  return s.olq_focus || SESSION_TYPE_LABELS[s.session_type];
}

export function daysUntilBoard(boardDate: string | null | undefined): number | null {
  if (!boardDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(boardDate);
  if (isNaN(target.getTime())) return null;
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
}

export function scoreOf(ps: Record<string, unknown> | null, olq: string): number | undefined {
  if (!ps) return undefined;
  const v = ps[olq];
  return typeof v === "number" ? v : undefined;
}
