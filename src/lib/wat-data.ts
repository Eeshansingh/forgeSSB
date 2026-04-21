// Stimulus words for the WAT (Word Association Test).
export const WAT_WORDS = [
  "DUTY", "HONOUR", "FATHER", "FAILURE", "ENEMY", "COURAGE", "MOTHER", "DARK",
  "VICTORY", "DEFEAT", "FRIEND", "NIGHT", "BATTLE", "FEAR", "LEADER", "ALONE",
  "ORDER", "RIVER", "SACRIFICE", "STORM", "BROTHER", "SILENCE", "FLAG", "DEATH",
  "TRUTH", "HOPE", "MOUNTAIN", "PAIN", "TEAM", "WINTER", "FIRE", "MISSION",
  "DOUBT", "DISCIPLINE", "COMRADE", "BORDER", "PRIDE", "LOSS", "CHALLENGE", "RAIN",
  "CALM", "STRUGGLE", "FAMILY", "HOME", "STRANGER", "LOYALTY", "RISK", "TRAIN",
  "JUNGLE", "MEMORY", "OFFICER", "OBSTACLE", "RIVAL", "SUNRISE", "JUDGEMENT",
  "WOUND", "TARGET", "SACRED", "DEFEND", "HORIZON",
];

export const OLQS = [
  "Effective Intelligence",
  "Reasoning Ability",
  "Organising Ability",
  "Power of Expression",
  "Social Adaptability",
  "Cooperation",
  "Sense of Responsibility",
  "Initiative",
  "Self Confidence",
  "Speed of Decision",
  "Ability to Influence",
  "Liveliness",
  "Determination",
  "Courage",
  "Stamina",
] as const;

export type Olq = (typeof OLQS)[number];

export function ratingFromScore(score: number): {
  label: "Excellent" | "Good" | "Developing" | "Needs Work";
  tone: string;
} {
  if (score >= 85) return { label: "Excellent", tone: "text-success" };
  if (score >= 70) return { label: "Good", tone: "text-gold" };
  if (score >= 55) return { label: "Developing", tone: "text-amber" };
  return { label: "Needs Work", tone: "text-danger" };
}

// Deterministic mock OLQ scores so results feel realistic and stable.
export function mockOlqScores(): Record<Olq, number> {
  const base: Record<string, number> = {
    "Effective Intelligence": 82,
    "Reasoning Ability": 78,
    "Organising Ability": 71,
    "Power of Expression": 69,
    "Social Adaptability": 84,
    "Cooperation": 88,
    "Sense of Responsibility": 91,
    "Initiative": 64,
    "Self Confidence": 76,
    "Speed of Decision": 58,
    "Ability to Influence": 67,
    "Liveliness": 73,
    "Determination": 86,
    "Courage": 80,
    "Stamina": 74,
  };
  return base as Record<Olq, number>;
}

export const MOCK_AI_NOTES = [
  "Action-oriented response. Reflects initiative.",
  "Constructive framing. Suggests positive outlook.",
  "Slightly defensive. Watch for negative bias.",
  "Strong leadership tone.",
  "Generic — try to anchor in personal action.",
  "Empathetic and team-aware.",
  "Decisive. Indicates speed of judgement.",
  "Reflects discipline under pressure.",
  "Cooperative framing — good OLQ signal.",
  "Slightly passive. Add agency.",
];
