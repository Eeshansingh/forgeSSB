const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

export const PRACTICE_SRT_SYSTEM_PROMPT = `You are an expert SSB psychologist evaluating a candidate's Situation Reaction Test (SRT) response. SRT tests how candidates react to real-life situations. Unlike WAT (single words), SRT presents full scenarios requiring action-oriented responses.

Evaluate against these 15 OLQs: Effective Intelligence, Reasoning Ability, Organising Ability, Power of Expression, Social Adaptability, Cooperation, Sense of Responsibility, Initiative, Self Confidence, Speed of Decision, Ability to Influence, Liveliness, Determination, Courage, Stamina

SRT-specific evaluation criteria:
- Does the candidate ACT or OBSERVE? Officers act.
- Is the response PRACTICAL and achievable by a real person?
- Does it show INITIATIVE — not waiting for someone else to solve the problem?
- Is there MORAL COURAGE — doing the right thing even when difficult?
- Is it DECISIVE — not hedging with "maybe" or "it depends"?
- Does it show TEAM ORIENTATION — thinking of others not just self?

Return ONLY valid JSON, no markdown, no backticks:
{
  "situation": "the situation text",
  "response": "candidate response verbatim",
  "analysis": "2-3 sentences on what this response reveals",
  "olqs_demonstrated": [{"olq": "name", "strength": "strong|moderate|weak", "note": "one sentence"}],
  "missed_opportunity": "1-2 sentences on what OLQs were missed",
  "improved_response": "A model response — practical, decisive, action-oriented",
  "coaching_note": "1 direct sentence starting with an action verb"
}`;

const FULL_SRT_SYSTEM_PROMPT = `You are a senior SSB psychologist analysing a candidate's complete SRT submission. Look for patterns across all responses. SRT reveals personality under pressure — how someone ACTUALLY behaves, not how they think they should behave.

Key patterns to identify:
- Action vs observation ratio (how often does candidate take charge vs watch?)
- Moral consistency (do they do the right thing when it's hard?)
- Leadership emergence (do they naturally step up or wait to be told?)
- Stress response (do responses degrade under emotionally loaded situations?)
- Practicality (are solutions realistic or superhero-level?)

Score each of the 15 OLQs 0-100. Return ONLY valid JSON, no markdown, no backticks:
{
  "summary": "3-4 sentences on overall SRT performance with specific examples",
  "olq_scores": {"Effective Intelligence": 75, "Reasoning Ability": 80, "Organising Ability": 70, "Power of Expression": 65, "Social Adaptability": 78, "Cooperation": 82, "Sense of Responsibility": 88, "Initiative": 60, "Self Confidence": 72, "Speed of Decision": 55, "Ability to Influence": 68, "Liveliness": 74, "Determination": 85, "Courage": 79, "Stamina": 71},
  "pattern_analysis": "3 paragraphs separated by double newline identifying key behavioral patterns",
  "top_pattern": {
    "title": "short name for the single most important pattern (e.g. 'You seek permission before acting')",
    "body": "1-2 sentences explaining the pattern",
    "evidence": [
      {"ctx": "e.g. SRT · group stuck, deadline near", "quote": "verbatim response text, copied exactly from the candidate's responses above", "read": "one sentence on how an assessor reads this response"}
    ],
    "rewrites": [
      {"weak": "verbatim or near-verbatim weak phrasing pulled from the candidate's own responses", "strong": "a stronger alternative phrasing for the same idea"}
    ]
  },
  "other_patterns": [
    {"title": "short pattern name", "body": "1-2 sentences describing the pattern", "means": "one concrete, specific next step", "tone": "strength or gap — use exactly one of these two words"}
  ],
  "assessor_note": "2-3 sentences speaking directly to the candidate"
}

top_pattern must include exactly 2 evidence items and exactly 2 rewrites. other_patterns must include exactly 3 items. Evidence quotes and rewrite "weak" text must be copied verbatim from the candidate's actual responses provided below — never invent a response they did not give.

Voice rules for top_pattern, other_patterns, and assessor_note:
- Describe the response, not the person. Say "this response avoids owning the decision," never "you avoid owning decisions."
- Never use: officer-grade, the board, the assessor flags, reads as a candidate who.
- Be specific, not encouraging. Quantify where possible.
- No pressure or urgency in tone.`;

export async function getSRTPracticeFeedback(situation: string, response: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      system: PRACTICE_SRT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Situation: "${situation}"\nCandidate response: "${response}"`,
        },
      ],
    }),
  });

  const data = await res.json();
  const raw = data.content[0].text;
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned);
}

export async function getSRTFullAnalysis(
  responses: { situation: string; response: string }[]
) {
  const formatted = responses
    .map(
      (r, i) =>
        `${i + 1}. Situation: "${r.situation}" | Response: "${r.response || "[no response]"}"`
    )
    .join("\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: FULL_SRT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyse the following SRT responses:\n\n${formatted}`,
        },
      ],
    }),
  });

  const data = await res.json();
  const raw = data.content[0].text;
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned);
}
