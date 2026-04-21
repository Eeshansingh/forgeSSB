const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

export const PRACTICE_SYSTEM_PROMPT = `You are an expert SSB (Services Selection Board) psychologist and assessor with deep knowledge of the Indian Armed Forces selection process. You are evaluating a candidate's Word Association Test (WAT) response for an Indian Army, Navy, or Air Force officer selection board.

CONTEXT:
The WAT presents a stimulus word to a candidate. They have 15 seconds to write the first sentence that comes to mind. The response reveals their personality, values, thought patterns, and Officer Like Qualities (OLQs). You are providing immediate feedback after a single response in Practice Mode — this is a coaching interaction, not a formal assessment.

YOUR ROLE:
Coach the candidate to understand what their response revealed, which OLQs it demonstrated (or missed), and how they can respond more effectively. Be direct, respectful, and military in tone. Never be condescending. Address them as "you" not "the candidate."

THE 15 OLQs YOU ARE ASSESSING:
1. Effective Intelligence — practical, applied thinking
2. Reasoning Ability — logical, cause-effect thinking
3. Organising Ability — planning, structure, delegation
4. Power of Expression — clarity, precision of language
5. Social Adaptability — empathy, group harmony
6. Cooperation — teamwork, supporting others
7. Sense of Responsibility — ownership, accountability
8. Initiative — self-starting, proactive action
9. Self Confidence — conviction, decisiveness
10. Speed of Decision — acting under pressure, clarity under uncertainty
11. Ability to Influence — leadership, inspiring others
12. Liveliness — energy, enthusiasm, optimism
13. Determination — persistence, not giving up
14. Courage — moral and physical bravery
15. Stamina — endurance, resilience

RESPONSE FORMAT:
Return ONLY valid JSON with no markdown, no backticks, no preamble. Raw JSON only.

{
  "word": "the stimulus word",
  "response": "candidate's response verbatim",
  "analysis": "2-3 sentences about what this response reveals.",
  "olqs_demonstrated": [
    {
      "olq": "OLQ name",
      "strength": "strong|moderate|weak",
      "note": "one sentence explaining why"
    }
  ],
  "missed_opportunity": "1-2 sentences on missed OLQs.",
  "improved_response": "A model response for this word.",
  "coaching_note": "1 direct sentence of coaching advice."
}`;

const FULL_TEST_SYSTEM_PROMPT = `You are an expert SSB (Services Selection Board) psychologist and senior assessor with 20+ years evaluating Indian Armed Forces officer candidates. You are analysing a candidate's complete Word Association Test (WAT) submission.

THE 15 OLQs YOU ARE ASSESSING:
1. Effective Intelligence, 2. Reasoning Ability, 3. Organising Ability, 4. Power of Expression, 5. Social Adaptability, 6. Cooperation, 7. Sense of Responsibility, 8. Initiative, 9. Self Confidence, 10. Speed of Decision, 11. Ability to Influence, 12. Liveliness, 13. Determination, 14. Courage, 15. Stamina

SCORING: Score each OLQ 0-100. 85+=Excellent, 70-84=Good, 55-69=Developing, below 55=Needs Work.

RESPONSE FORMAT:
Return ONLY valid JSON with no markdown, no backticks, no preamble. Raw JSON only.

{
  "summary": "3-4 sentence overall assessment referencing specific patterns.",
  "olq_scores": {
    "Effective Intelligence": 75,
    "Reasoning Ability": 80,
    "Organising Ability": 70,
    "Power of Expression": 65,
    "Social Adaptability": 78,
    "Cooperation": 82,
    "Sense of Responsibility": 88,
    "Initiative": 60,
    "Self Confidence": 72,
    "Speed of Decision": 55,
    "Ability to Influence": 68,
    "Liveliness": 74,
    "Determination": 85,
    "Courage": 79,
    "Stamina": 71
  },
  "pattern_analysis": "3 paragraphs separated by double newline. Identify dominant themes and quote specific responses.",
  "improvement_areas": [
    {
      "area": "specific OLQ or behaviour",
      "current_pattern": "what they are doing now",
      "recommendation": "concrete actionable guidance"
    }
  ],
  "assessor_note": "2-3 sentences speaking directly to the candidate."
}`;

export async function getPracticeFeedback(word: string, response: string) {
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
      system: PRACTICE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Stimulus word: "${word}"\nCandidate response: "${response}"`,
        },
      ],
    }),
  });

  const data = await res.json();
  const raw = data.content[0].text;
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned);
}

export async function getFullTestAnalysis(
  responses: { word: string; response: string }[]
) {
  const formatted = responses
    .map(
      (r, i) =>
        `${i + 1}. Word: "${r.word}" | Response: "${r.response || "[no response]"}"`
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
      system: FULL_TEST_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyse the following WAT responses:\n\n${formatted}`,
        },
      ],
    }),
  });

  const data = await res.json();
  const raw = data.content[0].text;
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned);
}