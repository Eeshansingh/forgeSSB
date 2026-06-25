export type Profile = 'fresher' | 'repeater_1' | 'repeater_2';
export type Cluster = 'mirror' | 'drive' | 'mind' | 'others' | 'integration';
export type SessionType =
  | 'calibration' | 'olq_drill' | 'synthesis' | 'checkpoint'
  | 'simulation' | 'social' | 'sd' | 'consolidation' | 'reveal';

type ByProfile<T = string> = Record<Profile, T>;

interface BaselineNote { low: string; strong: string; }
interface BoardSees   { low: string; strong: string; }
interface Reflection  { good?: string; poor?: string; question?: string; nudge: string; }

export interface JourneySession {
  session_number: number;
  cluster: Cluster;
  session_type: SessionType;
  olq_focus: string;
  pull_quote?: ByProfile;
  what_this_means?: ByProfile;
  what_low_looks?: ByProfile;
  baseline_note?: ByProfile<BaselineNote>;
  board_sees?: ByProfile<BoardSees>;
  crisis_ack?: ByProfile;
  phase_opener?: string;
  callback?: string;
  framing?: string;
  questions?: string[];
  reads?: { transfer: string; lowTransfer: string };
  templated_insight?: string;
  pattern_observation?: string;
  post_sim_read?: string;
  consolidation_body?: ByProfile;
  reflection?: Reflection;
  mission?: string;
}

// NOTE engineering order ≠ document order: run S25 → S26 → S27 (doc lists S27 before S26 for grouping).

export const JOURNEY: JourneySession[] = [
  // ── PHASE 1 — THE MIRROR (S1–6) ─────────────────────────────────────────
  {
    session_number: 1,
    cluster: 'mirror',
    session_type: 'calibration',
    olq_focus: '',
    pull_quote: {
      fresher: `SSB doesn't test what you know. It tests who you are when the situation is ambiguous, the group disagrees, and no one tells you what to do.`,
      repeater_1: `You know what SSB is. The question now is whether you know what it saw in you — and why.`,
      repeater_2: `Two boards. You know the process cold. The question is whether you know what's actually keeping you from being recommended.`,
    },
    what_this_means: {
      fresher: `Most candidates prepare for SSB like a written exam — memorise "correct" WAT responses, rehearse GTO moves, research what assessors want. The board sees through this in the first hour. The 15-second timer, the ambiguous images, the open situations are built specifically to get past rehearsed answers and reach your actual patterns. The board isn't looking for someone who knows the right answer. It's looking for someone whose first instinct, under pressure, is officer-like. That's not memorised. It's built — which is what the next 30 sessions are for.`,
      repeater_1: `You've sat in that room. You wrote the WAT, did the tasks, faced the interview. What most repeaters don't know is their specific pattern — the consistent behaviour across tests the assessor built a picture from. It's rarely one bad answer. It's a theme that showed in WAT, confirmed itself in SRT, appeared in the group task, and was visible in how you carried yourself in the mess. This session sets your Day-1 baseline. Not a judgment. A map.`,
      repeater_2: `Two boards in, you know the WAT timer, the GTO structure, the interview format. Here's what most 2nd+ repeaters get wrong: they think they need more practice. They don't. They need to break patterns that have calcified across two appearances — initiative performed at the right moment, cooperation displayed when watched, rehearsed PI answers. The board marks this. The psychologist tells the difference between a candidate who leads because they see something that needs doing and one who leads because they know boards reward it.`,
    },
    what_low_looks: {
      fresher: `Responses that sound rehearsed. WAT sentences that are grammatically perfect but empty. SRT answers describing what a "good officer" would do rather than what this candidate would actually do.`,
      repeater_1: `The same pattern across multiple tests without the candidate noticing — defaulted to authority in SRT, waited in GTO, gave cautious PI answers, and thought these were unrelated. They're one OLQ gap in different contexts.`,
      repeater_2: `Performed OLQs. Technically correct WAT that lacks authenticity. GTO behaviour that looks like leadership but doesn't emerge from reading the situation. The assessor has seen it before — and so have you, if you're honest.`,
    },
    reflection: {
      question: `Look at the 15 OLQs on this screen. Which three do you genuinely have — not because you've been told, but because you've seen evidence in your own behaviour? Which three are you most uncertain about? Don't answer from your best self. Answer from your honest self.`,
      nudge: `You've written [WORD_COUNT] words. The question asked for specific OLQs and your evidence. Name the qualities and describe a real situation where you saw each one — or didn't.`,
    },
    mission: `No mission today. The reflection is enough for Day 1. Come back tomorrow.`,
  },

  {
    session_number: 2,
    cluster: 'mirror',
    session_type: 'olq_drill',
    olq_focus: 'Self Confidence',
    pull_quote: {
      fresher: `Self confidence in SSB is not being sure you're right. It's being willing to act on your judgment even when you might be wrong.`,
      repeater_1: `Last time, the board watched you hesitate. Self confidence is the OLQ that hesitation leaks from.`,
      repeater_2: `By now you've learned to look confident. The board isn't scoring how you look. It's scoring whether you actually trust your own call.`,
    },
    what_this_means: {
      fresher: `Self confidence is acting on your own judgment without constantly seeking validation. Not arrogance — quiet certainty. In WAT it shows in the verbs you choose. "I decided", "I moved", "I told them" reads as confidence. "Perhaps", "one could", "it might be good to" reads as a candidate asking permission from the page. In SRT it shows in whether you commit to one action or hedge across three. The assessor reads hedging as a person who doesn't trust themselves — and an officer who doesn't trust themselves can't ask others to.`,
      repeater_1: `If you were screened out, look at whether your responses hedged. The repeater pattern here is subtle: you know the "right" answer but soften it so it can't be wrong. "It would probably be best to..." is a confidence tell, not a grammar choice. The board doesn't need you to be right every time. It needs you to back your judgment. Watch today's drill for how often you qualify a sentence you could have stated flat.`,
      repeater_2: `Two boards in, you've likely built a confident surface — steady voice, good posture, prepared answers. That's not the OLQ. Self confidence is internal: do you act on your read of a situation, or do you wait to see if it's safe first? The assessor catches the gap between performed confidence and the half-second of hesitation before you commit. Today, watch your first instinct versus your written answer. The distance between them is the gap.`,
    },
    what_low_looks: {
      fresher: `Hedging language in WAT — "perhaps", "one could", "it might be". Passive framing. SRT answers that seek validation ("I would ask my seniors if...") when the call is yours to make.`,
      repeater_1: `Answers that are technically right but softened so they can't be challenged. The qualifier added at the end of an otherwise strong sentence.`,
      repeater_2: `A confident surface over uncertain content. Rehearsed certainty on familiar questions, visible hesitation on unfamiliar ones.`,
    },
    baseline_note: {
      fresher: {
        low: `Your Self Confidence baseline is [SCORE]. Watch today's WAT for hedging words — that's where it's leaking.`,
        strong: `Your Self Confidence baseline is [SCORE], already solid. Today pushes into the harder words where even confident candidates start to qualify.`,
      },
      repeater_1: {
        low: `Your Self Confidence baseline is [SCORE]. Watch today's WAT for hedging words — that's where it's leaking.`,
        strong: `Your Self Confidence baseline is [SCORE], already solid. Today pushes into the harder words where even confident candidates start to qualify.`,
      },
      repeater_2: {
        low: `Your Self Confidence baseline is [SCORE]. Watch today's WAT for hedging words — that's where it's leaking.`,
        strong: `Your Self Confidence baseline is [SCORE], already solid. Today pushes into the harder words where even confident candidates start to qualify.`,
      },
    },
    reflection: {
      good: `Think of a decision you made recently where you backed your own judgment against what others thought — and were right. What did it feel like in the moment before you committed?`,
      poor: `Today your responses hedged on [N] of the harder words. Think of one time this week you knew your answer but softened it so it couldn't be wrong. What were you protecting?`,
      nudge: `You've written [WORD_COUNT] words. Name the specific moment — what you believed, who disagreed, what you did. Not the general habit.`,
    },
    mission: `Have one conversation today where you state your opinion directly, without softening it — no "I think maybe", no "but I could be wrong". Say what you mean once, flat. Notice what happens.`,
  },

  {
    session_number: 3,
    cluster: 'mirror',
    session_type: 'olq_drill',
    olq_focus: 'Speed of Decision',
    pull_quote: {
      fresher: `Speed of Decision is not being fast. It's not being paralysed.`,
      repeater_1: `The blanks in your last WAT weren't a vocabulary problem. They were a Speed of Decision problem.`,
      repeater_2: `You've learned to answer everything. The question is whether you're deciding, or just filling the box.`,
    },
    what_this_means: {
      fresher: `Speed of Decision is making a call at 70% information instead of waiting for 100%. Not impulsive — not frozen. The 15-second WAT timer is deliberate: it forces a decision before you can overthink. Most candidates who struggle here aren't indecisive in life. They're afraid of being wrong on paper, so they freeze on ambiguous words and leave blanks. In SRT it shows as answers that lay out two options without choosing one. The board reads an unchosen option as a candidate who, in the field, would still be deciding while the moment passed.`,
      repeater_1: `If you left WAT words blank or wrote SRT answers that never landed on an action, this is your gap. The repeater trap: you've now studied "good" responses, so you spend your 15 seconds searching for the best one instead of committing to a good one. A good decision made in time beats a perfect one made too late — that's the whole quality. Today, commit to your first real response and move. Watch how many you wanted to change.`,
      repeater_2: `By the second board you fill every box — you've trained yourself out of blanks. But filling isn't deciding. The assessor distinguishes a response that commits to an action from one that describes a consideration. "He thought about the safest route" is filled but undecided. "He took the ridge line" is a decision. Today, read your own SRT answers back and mark which ones actually chose.`,
    },
    what_low_looks: {
      fresher: `Blank WAT responses on ambiguous words. SRT answers presenting options without choosing. Visible overthinking — long, qualified responses that never reach an action.`,
      repeater_1: `Searching for the best answer until the timer kills the response. Changing answers repeatedly.`,
      repeater_2: `Boxes filled with considerations, not decisions. Hedged actions ("he would try to...").`,
    },
    baseline_note: {
      fresher: {
        low: `Your Speed of Decision baseline is [SCORE]. The blanks and the unchosen options are where it's showing. Today's drill is weighted toward forcing the commit.`,
        strong: `Your Speed of Decision baseline is [SCORE]. Today moves to harder, more ambiguous words — where speed without panic is the real test.`,
      },
      repeater_1: {
        low: `Your Speed of Decision baseline is [SCORE]. The blanks and the unchosen options are where it's showing. Today's drill is weighted toward forcing the commit.`,
        strong: `Your Speed of Decision baseline is [SCORE]. Today moves to harder, more ambiguous words — where speed without panic is the real test.`,
      },
      repeater_2: {
        low: `Your Speed of Decision baseline is [SCORE]. The blanks and the unchosen options are where it's showing. Today's drill is weighted toward forcing the commit.`,
        strong: `Your Speed of Decision baseline is [SCORE]. Today moves to harder, more ambiguous words — where speed without panic is the real test.`,
      },
    },
    reflection: {
      good: `Think of a decision this week you'd normally have slept on but made on the spot instead. How did it turn out? Would you trust that instinct again?`,
      poor: `Today your responses slowed or blanked under the timer. Think of a decision you delayed this week even though you already knew the answer. What were you waiting for?`,
      nudge: `You've written [WORD_COUNT] words. Name the specific decision — what you knew, what you didn't, what you did. Not the pattern.`,
    },
    mission: `Make one decision today you'd normally sleep on — small is fine. Trust your first instinct and act on it before the day ends. Notice whether the outcome was actually worse for being faster.`,
  },

  {
    session_number: 4,
    cluster: 'mirror',
    session_type: 'olq_drill',
    olq_focus: 'Initiative',
    pull_quote: {
      fresher: `Initiative is not being first. It's not waiting for permission.`,
      repeater_1: `If you waited for a leader to emerge in your GTO tasks, the board already had your Initiative score.`,
      repeater_2: `Volunteering at the right moment isn't Initiative. The board can tell the difference between seeing what's needed and seeing what's rewarded.`,
    },
    what_this_means: {
      fresher: `Initiative is starting things without being asked — seeing what needs doing and doing it. Not aggression, not rushing. It's the rarest OLQ in practice, because school and coaching train you to wait for instruction and reward you for it. In GTO tasks it looks like proposing a plan when the group is still milling — not necessarily the best plan, but a plan that gives the group something to move on. In WAT it shows in framing: the word "LEAD" produces "I stepped forward and organised the group" from a high-Initiative candidate, and "A leader guides his team" from a low one. One acts. One observes.`,
      repeater_1: `Screened-out candidates very often have an Initiative gap that showed in the group tasks — you waited to read the room before committing, and by the time you moved, someone else owned the task. In SRT it shows as "I would wait to see what the group decides" or "I would consult my seniors" in situations where action is clearly required and no senior exists. The fix isn't to talk more. It's to move when you see the gap, before you've confirmed it's safe to.`,
      repeater_2: `By the second board you know Initiative is valued, so you perform it — a plan proposed early to be seen proposing it, a task volunteered for at a visible moment. The assessor reads the difference between a candidate who moves because they read the situation and one who moves because they read the assessor. Performed initiative arrives slightly too clean, slightly too timed. Today, catch yourself acting for the watcher rather than the task.`,
    },
    what_low_looks: {
      fresher: `Waiting to see what the group decides. Writing "I would consult seniors before acting" when no senior exists. Observation where the situation demands movement.`,
      repeater_1: `Reading the room until the moment to act has passed. Letting a natural leader emerge instead of being one.`,
      repeater_2: `Action that's timed for visibility rather than need. Initiative that appears exactly when an assessor would notice.`,
    },
    baseline_note: {
      fresher: {
        low: `Your Initiative baseline is [SCORE] — often the lowest Drive-adjacent OLQ for candidates trained to wait. Today's drill is weighted toward action words. Watch whether you act or describe.`,
        strong: `Your Initiative baseline is [SCORE]. Today pushes into situations where acting first carries real risk — the harder test of the quality.`,
      },
      repeater_1: {
        low: `Your Initiative baseline is [SCORE] — often the lowest Drive-adjacent OLQ for candidates trained to wait. Today's drill is weighted toward action words. Watch whether you act or describe.`,
        strong: `Your Initiative baseline is [SCORE]. Today pushes into situations where acting first carries real risk — the harder test of the quality.`,
      },
      repeater_2: {
        low: `Your Initiative baseline is [SCORE] — often the lowest Drive-adjacent OLQ for candidates trained to wait. Today's drill is weighted toward action words. Watch whether you act or describe.`,
        strong: `Your Initiative baseline is [SCORE]. Today pushes into situations where acting first carries real risk — the harder test of the quality.`,
      },
    },
    reflection: {
      good: `When did you last do something that needed doing without anyone asking you to — and it cost you something? What made you move?`,
      poor: `Today you defaulted to consultation or observation on [N] responses. Think of one moment this week you saw something that needed doing and waited. What were you waiting for?`,
      nudge: `You've written [WORD_COUNT] words. One specific moment — what you saw, why you waited or moved, what happened. Not the general pattern.`,
    },
    mission: `Take initiative in the next group decision you're part of, however small — a college group, a family plan, a WhatsApp thread. Don't wait to be asked. Don't wait for clarity. Move first.`,
  },

  {
    session_number: 5,
    cluster: 'mirror',
    session_type: 'olq_drill',
    olq_focus: 'Effective Intelligence',
    pull_quote: {
      fresher: `Effective Intelligence is not your IQ. It's what happens to your thinking when the pressure is on and the information is incomplete.`,
      repeater_1: `If your last board was strong in some tests and flat in others, Effective Intelligence is usually the thread connecting them.`,
      repeater_2: `You've learned to think like an assessor. That's exactly what kills your Effective Intelligence score.`,
    },
    what_this_means: {
      fresher: `Effective Intelligence is applied thinking under pressure with incomplete information — not how smart you are, how well your thinking works when it's hard. In WAT it shows in abstract words: "SHADOW" produces "The shadow of doubt cleared once he committed to a plan" from high EI, and "Shadow is dark" from low. In SRT it's the quality of response when there's no clean answer — you're leading a trek, two members are hurt, the radio's dead, three hours of light left. High EI organises what's available, decides, and acts. Low EI describes the problem or waits for information that isn't coming. The 15-second timer tests your real thinking, not your rehearsed thinking.`,
      repeater_1: `Inconsistent board performance — sharp in some tests, vague in others — often traces to EI. It's the OLQ that connects the dots. Look at your SRT under pressure: do your answers stay structured and decisive on hard situations, or get vaguer and more descriptive as the situation escalates? That drift is EI under load, and it's exactly what the psych tests are built to surface. The repeater trap: second-guessing your first instinct and writing something more "correct". Your first instinct is usually the more officer-like one.`,
      repeater_2: `By the second board most candidates run a parallel process — what do I actually think, and what would an officer think — and filter their natural response through what they believe the board wants. This kills EI. The moment you calculate the "right" response it gets slower, more hedged, less decisive, and the assessor reads it as performance, not intelligence. The work is unlearning the filter. Today, count how many times you wrote a response and wanted to change it. That count is the filter running.`,
    },
    what_low_looks: {
      fresher: `Blank responses on abstract words. SRT answers that describe the situation instead of responding to it. Two options presented, none chosen. Thinking out loud in writing instead of reaching a conclusion.`,
      repeater_1: `Responses that hedge. Answers that weaken and get more descriptive as situations get harder.`,
      repeater_2: `Technically correct responses that feel hollow. WAT sentences that are officer-like in grammar but absent in substance.`,
    },
    baseline_note: {
      fresher: {
        low: `Your Effective Intelligence baseline is [SCORE]. Watch the abstract words — that's where EI shows clearest. Today's drill focuses there.`,
        strong: `Your Effective Intelligence baseline is [SCORE], already solid. Today builds on it — notice where your thinking gets sharpest under time pressure rather than where it breaks.`,
      },
      repeater_1: {
        low: `Your Effective Intelligence baseline is [SCORE]. Watch the abstract words — that's where EI shows clearest. Today's drill focuses there.`,
        strong: `Your Effective Intelligence baseline is [SCORE], already solid. Today builds on it — notice where your thinking gets sharpest under time pressure rather than where it breaks.`,
      },
      repeater_2: {
        low: `Your Effective Intelligence baseline is [SCORE]. Watch the abstract words — that's where EI shows clearest. Today's drill focuses there.`,
        strong: `Your Effective Intelligence baseline is [SCORE], already solid. Today builds on it — notice where your thinking gets sharpest under time pressure rather than where it breaks.`,
      },
    },
    reflection: {
      good: `Think of a decision in the last month where you had incomplete information and acted anyway. What did you know? What didn't you? Would you make the same call again?`,
      poor: `Today your responses got less decisive on the harder words. Think of a time this week you had a clear answer but didn't commit it. What stopped you?`,
      nudge: `You've written [WORD_COUNT] words. Name a specific decision — situation, what you knew, what you didn't, what you did.`,
    },
    mission: `Today, before responding to any real problem, write down three possible approaches first — even when the answer seems obvious. The habit of structuring before acting is what EI looks like in practice. Notice how it changes the decision.`,
  },

  {
    session_number: 6,
    cluster: 'mirror',
    session_type: 'synthesis',
    olq_focus: '',
    pull_quote: {
      fresher: `You've done five sessions. The pattern is starting to show. Here's what your data says about how you think under pressure.`,
      repeater_1: `You've done five sessions. The pattern is starting to show. Here's what your data says about how you think under pressure.`,
      repeater_2: `You've done five sessions. The pattern is starting to show. Here's what your data says about how you think under pressure.`,
    },
    templated_insight: `You've now logged enough responses to see a shape. Your strongest instinct quality is [STRONGEST_MIRROR_OLQ] at [SCORE] — it shows up consistently across your WAT and SRT, which means it's real, not occasional. Your weakest is [WEAKEST_MIRROR_OLQ] at [SCORE], and it's appeared the same way more than once: [PATTERN_PHRASE]. That repetition is the signal. A single weak response is noise. The same weak response four times is a pattern the board would have built a picture from. The next two weeks target exactly this.`,
    pattern_observation: `Your instinct profile says you operate by [INSTINCT_SUMMARY — e.g. "deciding fast but hedging the decision", or "thinking clearly but waiting for permission to act"]. That combination is your starting signature. Keep it in mind through the Drive phase — the same signature will show up there under more pressure.`,
    reflection: {
      question: `After one week, what pattern did you not expect to see in yourself? Not the one you came in knowing about — the one the data surfaced.`,
      nudge: `You've written [WORD_COUNT] words. Name the specific pattern and where it showed — which test, which kind of word or situation.`,
    },
    mission: `Tell one person close to you one thing you learned about yourself this week. Say it out loud, not in writing.`,
  },

  // ── PHASE 2 — DRIVE (S7–12) ──────────────────────────────────────────────
  {
    session_number: 7,
    cluster: 'drive',
    session_type: 'olq_drill',
    olq_focus: 'Courage',
    pull_quote: {
      fresher: `Courage at SSB isn't being fearless. That's recklessness. It's feeling the cost and moving anyway.`,
      repeater_1: `The cautious answers in your last board weren't safe. To the assessor, caution where action was needed reads as low Courage.`,
      repeater_2: `Volunteering for the hard task to show Courage is the opposite of Courage. The board can see which one it is.`,
    },
    what_this_means: {
      fresher: `Courage is acting despite fear — knowing the cost and going anyway. The board is not looking for someone who feels no fear; it's looking for someone who feels it and moves. The tell for low Courage is specific: passive framing in WAT — "one should be careful", "it is important to think before acting" — and risk-avoidant SRT answers that choose the safe option when the safe option is clearly wrong. You're the only one who saw a child fall into the canal; high Courage goes in, low Courage runs for help that's too far away. The board reads the cautious choice in an urgent situation as a candidate who, under real pressure, would hesitate when others can't afford it.`,
      repeater_1: `If you were screened out, look for caution in your psych responses — answers that managed risk instead of meeting it. The repeater pattern is consulting authority that isn't present, or describing the danger instead of responding to it. Courage at SSB usually fails in the SRT situations that require acting against a senior's wrong order, or taking a risk with an uncertain outcome. Those are the situations the board weights. Today, watch which situations you soften — they'll be the same kind that cost you last time.`,
      repeater_2: `By the second board you've learned Courage is valued, so you perform it — speaking up at the strategic moment, volunteering visibly. The assessor reads performed courage in about thirty seconds, because it arrives when it's safe to and not when it costs something. Real Courage shows in the unwatched moment — the answer you commit to when there's no advantage in it. Today, find the response where the brave choice has a real downside, and watch whether you take it or route around it.`,
    },
    what_low_looks: {
      fresher: `Passive, risk-avoidant framing. Choosing the safe option where it's clearly wrong. Describing the risk instead of responding to it.`,
      repeater_1: `Consulting absent authority. Managing danger rather than meeting it. Softening exactly the situations that demand directness.`,
      repeater_2: `Courage that appears only when it's safe and visible. The brave choice avoided where it carries an actual cost.`,
    },
    baseline_note: {
      fresher: {
        low: `Your Courage baseline is [SCORE]. The avoidance shows in the urgent situations. Today's drill weights toward exactly those.`,
        strong: `Your Courage baseline is [SCORE]. Today moves to situations where the courageous choice carries a real, named cost — the harder test.`,
      },
      repeater_1: {
        low: `Your Courage baseline is [SCORE]. The avoidance shows in the urgent situations. Today's drill weights toward exactly those.`,
        strong: `Your Courage baseline is [SCORE]. Today moves to situations where the courageous choice carries a real, named cost — the harder test.`,
      },
      repeater_2: {
        low: `Your Courage baseline is [SCORE]. The avoidance shows in the urgent situations. Today's drill weights toward exactly those.`,
        strong: `Your Courage baseline is [SCORE]. Today moves to situations where the courageous choice carries a real, named cost — the harder test.`,
      },
    },
    reflection: {
      good: `When did you last do something that scared you because it was the right thing — and what did it cost? Be specific about the fear, not just the outcome.`,
      poor: `Today you chose the cautious path on [N] situations that called for action. Think of one real moment this week you saw the right thing to do and took the safer route. What were you avoiding?`,
      nudge: `You've written [WORD_COUNT] words. Name the moment, the fear, and what you actually did. Hypotheticals don't count here.`,
    },
    mission: `Do one thing today you've been avoiding because it's uncomfortable — a conversation, a decision, a confrontation you've been putting off. Before tomorrow.`,
  },

  {
    session_number: 8,
    cluster: 'drive',
    session_type: 'olq_drill',
    olq_focus: 'Determination',
    pull_quote: {
      fresher: `Determination is not refusing to quit. It's what you do after the first plan fails.`,
      repeater_1: `The board doesn't fail you for the first plan not working. It fails you for what you did next.`,
      repeater_2: `Repeating the same approach harder isn't Determination. Neither is escalating the moment you're blocked.`,
    },
    what_this_means: {
      fresher: `Determination is what you do after the first plan fails — adapting and continuing toward the objective, not stubbornly repeating a dead approach and not giving up. GTO tasks are designed to fail: the obstacle has a bottleneck, the resources are short, the time is tight. The whole point is to watch what you do when the first approach doesn't work. In SRT, low Determination shows when the first solution is blocked and the candidate gives up, escalates to authority, or runs the same failed approach again. High Determination changes the plan, uses what's available differently, and keeps moving. The objective stays fixed; the method flexes.`,
      repeater_1: `If you made it some way into the tasks and stalled, Determination is often where it broke. The repeater pattern: when blocked, you either handed the problem upward ("I would report this to my senior") or restated the obstacle instead of working around it. The board reads both as a candidate who stops at the first wall. Look at yesterday's mission — you did something uncomfortable. Did you finish it when it got hard, or find a reason to stop? That's the same quality the SRT is testing.`,
      repeater_2: `By the second board you persist — you've learned not to give up visibly. But persistence and Determination aren't the same. Repeating a failed approach with more force looks like determination and reads, to the assessor, as someone who can't adapt. Genuine Determination abandons the method the instant it's clearly not working and finds another route to the same objective. Today, watch the situations where your first idea is blocked — do you adapt, or do you push the same idea harder?`,
    },
    what_low_looks: {
      fresher: `Giving up when the first solution is blocked. Escalating to authority instead of adapting. Repeating the same approach that already failed.`,
      repeater_1: `Handing a blocked problem upward. Restating the obstacle instead of routing around it.`,
      repeater_2: `Persisting with a failed method through force rather than adapting it. Mistaking stubbornness for resolve.`,
    },
    baseline_note: {
      fresher: {
        low: `Your Determination baseline is [SCORE]. It shows in the blocked situations — watch what you do at the wall. Today's drill weights toward exactly those.`,
        strong: `Your Determination baseline is [SCORE]. Today moves to situations where adapting is harder than persisting — where the obvious move is to repeat, not rethink.`,
      },
      repeater_1: {
        low: `Your Determination baseline is [SCORE]. It shows in the blocked situations — watch what you do at the wall. Today's drill weights toward exactly those.`,
        strong: `Your Determination baseline is [SCORE]. Today moves to situations where adapting is harder than persisting — where the obvious move is to repeat, not rethink.`,
      },
      repeater_2: {
        low: `Your Determination baseline is [SCORE]. It shows in the blocked situations — watch what you do at the wall. Today's drill weights toward exactly those.`,
        strong: `Your Determination baseline is [SCORE]. Today moves to situations where adapting is harder than persisting — where the obvious move is to repeat, not rethink.`,
      },
    },
    reflection: {
      good: `Think of something you wanted that the first attempt failed at. What did you change the second time — the goal, or the method? What does that tell you?`,
      poor: `Today, when the situation blocked your first solution, you stopped or escalated on [N] of them. Think of one real thing this week you gave up on at the first wall. Was the wall actually impassable, or just the first idea?`,
      nudge: `You've written [WORD_COUNT] words. Name the specific thing, the first failure, and what you did next — adapt, escalate, or stop.`,
    },
    mission: `Pick something you started recently and stalled on. Today, when you hit the obstacle that stopped you, change the method — not the goal — and take one more step.`,
  },

  {
    session_number: 9,
    cluster: 'drive',
    session_type: 'olq_drill',
    olq_focus: 'Sense of Responsibility',
    pull_quote: {
      fresher: `Sense of Responsibility is not doing your job well. It's owning the outcome even when the failing part wasn't yours.`,
      repeater_1: `If you did your part correctly and the group still failed, the board may have marked you down. Your part was never the whole job.`,
      repeater_2: `Stepping up only when it's noticed isn't responsibility. The board watches what you do when the struggling person isn't your problem.`,
    },
    what_this_means: {
      fresher: `Sense of Responsibility is stepping up when things go wrong — owning the outcome, not just completing your assigned task. In GTO group tasks the assessor watches what you do when someone else is struggling: do you finish your part and stop, or do you notice the group is failing and move to fix it even though no one assigned that to you? In SRT it shows in situations where the formal responsibility is unclear — a junior makes a costly mistake, a task no one owns is failing. High Responsibility takes ownership of the result. Low Responsibility stays inside the lines of the assigned task. The board commissions officers, and an officer owns what happens on their watch, not just what they were told to do.`,
      repeater_1: `Screened-out candidates often did exactly what they were asked and no more — which looks fine until you realise the board is testing whether you'll own the unassigned. The pattern: staying quiet when a group member was visibly struggling, or completing your obstacle and waiting rather than turning back to help the group clear theirs. In SRT, watch the situations where the problem isn't formally yours. The board is asking: when it goes wrong and no one's responsible, do you become responsible?`,
      repeater_2: `By the second board you know to look engaged and helpful. But Responsibility isn't visible helpfulness — it's ownership when there's no credit in it. The assessor distinguishes the candidate who helps the struggling teammate because it's seen from the one who does it because leaving them stuck is unacceptable to them. Today, watch the situations where stepping up costs you — your time, your task, your standing — and no one would blame you for staying out. That's where the OLQ actually lives.`,
    },
    what_low_looks: {
      fresher: `Doing your assigned part and stopping. Staying quiet when someone in the group is struggling. Treating the outcome as someone else's job.`,
      repeater_1: `Completing your task and waiting. Watching a group fail without moving to own the fix.`,
      repeater_2: `Ownership that appears only when it's visible. Stepping up where there's credit, staying out where there's only cost.`,
    },
    baseline_note: {
      fresher: {
        low: `Your Sense of Responsibility baseline is [SCORE]. It shows in the situations where the problem isn't formally yours. Today's drill weights toward those.`,
        strong: `Your Sense of Responsibility baseline is [SCORE]. Today moves to situations where owning the outcome costs you something real.`,
      },
      repeater_1: {
        low: `Your Sense of Responsibility baseline is [SCORE]. It shows in the situations where the problem isn't formally yours. Today's drill weights toward those.`,
        strong: `Your Sense of Responsibility baseline is [SCORE]. Today moves to situations where owning the outcome costs you something real.`,
      },
      repeater_2: {
        low: `Your Sense of Responsibility baseline is [SCORE]. It shows in the situations where the problem isn't formally yours. Today's drill weights toward those.`,
        strong: `Your Sense of Responsibility baseline is [SCORE]. Today moves to situations where owning the outcome costs you something real.`,
      },
    },
    reflection: {
      good: `When did you last take responsibility for something that wasn't your fault or your job, because the outcome mattered more than the boundary? What did it cost you?`,
      poor: `Today you stayed inside your assigned role on [N] situations the board was watching for ownership. Think of one time this week something failed near you and you treated it as not your problem.`,
      nudge: `You've written [WORD_COUNT] words. Name the situation, whose "job" it formally was, and what you did. The boundary is the point — describe it.`,
    },
    mission: `Today, own one thing that isn't formally your responsibility — fix a problem you'd normally walk past, take charge of something stuck because no one else has. No one needs to notice.`,
  },

  {
    session_number: 10,
    cluster: 'drive',
    session_type: 'checkpoint',
    olq_focus: '',
    framing: `The practice only works if it's reaching real life. Before today's session, a quick check — five questions, two minutes. Answer them about the last seven days, not about how you'd like to be.`,
    questions: [
      `In the last 7 days, did you start something without being asked?`,
      `Did you handle a disagreement differently than you would have before starting this?`,
      `Did you make a decision faster than usual — without waiting for more information?`,
      `Did you do something uncomfortable you'd normally avoid?`,
      `Did you catch yourself thinking about the OLQs in a real situation, even briefly?`,
    ],
    reads: {
      transfer: `[TRANSFER_COUNT] of 5. The work is moving off the screen. That's the only signal that matters at this stage — practice scores rise for everyone, but real-life transfer is what the board actually sees on Day 2. Keep noticing it. The second half is built to push it further.`,
      lowTransfer: `[TRANSFER_COUNT] of 5. Your practice scores are moving but real life isn't catching up yet — and real life is what the board reads. This is the most common reason candidates plateau: they get good at the app and stop there. For the next week, treat every mission as the actual point of the session, not the afterthought. The drill trains the pattern; the mission is where it becomes you.`,
    },
    mission: `None today — the check-in is the work. Tomorrow is Stamina.`,
  },

  {
    session_number: 11,
    cluster: 'drive',
    session_type: 'olq_drill',
    olq_focus: 'Stamina & Fitness',
    crisis_ack: {
      fresher: `You're at Session 11. This is statistically where most people in any 30-session program stop showing up — not because it gets harder, but because the novelty is gone and the results feel slow. The fact that you opened this today is the thing. It's also, not by accident, exactly what Stamina looks like when there's no applause for it.`,
      repeater_1: `You know this feeling from last time — the early energy of preparation wearing off into the grind. Last time, this is roughly where the consistency slipped. You're still here. That's the difference that matters.`,
      repeater_2: `Two boards in, you know the patterns are harder to break than you thought walking in, and Session 11 is where that realisation usually lands. Staying in the work past the point where it stops feeling exciting is the entire quality you're here to build. You're doing it right now.`,
    },
    pull_quote: {
      fresher: `Stamina at SSB is not how fit you are. It's whether you're the same person on Day 4 that you were on Day 1.`,
      repeater_1: `Stamina at SSB is not how fit you are. It's whether you're the same person on Day 4 that you were on Day 1.`,
      repeater_2: `Stamina at SSB is not how fit you are. It's whether you're the same person on Day 4 that you were on Day 1.`,
    },
    what_this_means: {
      fresher: `Stamina is physical and mental endurance across five days — and the board observes you from roughly 6am to 10pm, including the informal moments in the mess and on walks between activities. The tell for low Stamina is subtle: it's not collapse, it's drift. Sharp at 9am, flat by 4pm. Shorter GTO contributions late in the day. Less engaged in the informal conversations the assessor is quietly watching. Over five days the board builds a picture of who you are when you're tired — and tired is when most masks slip. The question the OLQ answers is: when your energy runs low, what's the first thing you stop doing?`,
      repeater_1: `If your last board felt strong early and faded, Stamina is part of the picture. Five days is long, and the assessment doesn't stop when the formal task ends — the mess, the breaks, the downtime are all observed. The repeater pattern: managing energy carefully through the visible tasks and going flat in the informal moments, not realising those count. Look at how you show up when you're tired in normal life — because that's exactly what the board sees on Day 4.`,
      repeater_2: `By the second board you pace yourself through the structured tasks. But Stamina isn't pacing — it's whether the quality of your presence holds when you're depleted and unobserved. The assessor reads the candidate who's warm and engaged in the mess on Day 4 differently from the one running on fumes and going quiet. Today's not about a workout. It's about noticing what part of you switches off first when you're drained — because that's the part the board will meet at the end of a long week.`,
    },
    what_low_looks: {
      fresher: `Shorter, less thoughtful responses later in the day. Flat energy in informal moments. The first thing to drop when tired — engagement, warmth, or care.`,
      repeater_1: `Strong early, fading late. Going quiet in the unstructured moments that are still being observed.`,
      repeater_2: `Presence that holds under observation but drops when depleted and unwatched.`,
    },
    baseline_note: {
      fresher: {
        low: `Your Stamina baseline is [SCORE] — and note, this OLQ is read across days, not in a single drill. The real test is consistency. Today's reflection and mission matter more than the score here.`,
        strong: `Your Stamina baseline is [SCORE]. The work now is protecting it across the back half of this journey — the endurance test is the journey itself.`,
      },
      repeater_1: {
        low: `Your Stamina baseline is [SCORE] — and note, this OLQ is read across days, not in a single drill. The real test is consistency. Today's reflection and mission matter more than the score here.`,
        strong: `Your Stamina baseline is [SCORE]. The work now is protecting it across the back half of this journey — the endurance test is the journey itself.`,
      },
      repeater_2: {
        low: `Your Stamina baseline is [SCORE] — and note, this OLQ is read across days, not in a single drill. The real test is consistency. Today's reflection and mission matter more than the score here.`,
        strong: `Your Stamina baseline is [SCORE]. The work now is protecting it across the back half of this journey — the endurance test is the journey itself.`,
      },
    },
    reflection: {
      good: `When you're tired or stressed, what's the first thing you stop doing — and is it something the board would notice on Day 4? Be specific about your own drop-off.`,
      poor: `You're at the point in this program where consistency usually slips. Be honest: what's made it hardest to keep showing up this week — and is it the same thing that would make Day 4 of a real board hard?`,
      nudge: `You've written [WORD_COUNT] words. Name the specific thing that drops first when you're depleted — engagement, patience, effort, warmth. One real example.`,
    },
    mission: `Do one physical thing today — a run, a swim, a long walk — and push slightly past the point you'd normally stop. The board tests endurance because the job demands it. Treat this as the same test.`,
  },

  {
    session_number: 12,
    cluster: 'drive',
    session_type: 'synthesis',
    olq_focus: '',
    pull_quote: {
      fresher: `Two weeks in. The Drive qualities are the ones most candidates underperform — and they're where the board separates officers from candidates. Here's where yours stand.`,
      repeater_1: `Two weeks in. The Drive qualities are the ones most candidates underperform — and they're where the board separates officers from candidates. Here's where yours stand.`,
      repeater_2: `Two weeks in. The Drive qualities are the ones most candidates underperform — and they're where the board separates officers from candidates. Here's where yours stand.`,
    },
    templated_insight: `Across the Drive phase your strongest is [STRONGEST_DRIVE_OLQ] at [WEEK2_SCORE], up from [WEEK1_SCORE]. Your weakest is [WEAKEST_DRIVE_OLQ] at [SCORE]. Here's the pattern worth seeing: most candidates have Drive in comfortable situations and lose it in uncomfortable ones. Your responses show [DRIVE_PATTERN — e.g. "Courage that holds until the risk is personal", or "Determination that adapts on paper but escalates under real pressure"]. That gap between comfortable Drive and tested Drive is exactly what the board's harder situations are built to expose.`,
    pattern_observation: `Look back at Synthesis I. Your Phase-1 signature was [INSTINCT_SUMMARY]. Under the heavier Drive pressure it became [DRIVE_SUMMARY]. Whether your instinct held or shifted under load is the most useful thing you've learned about yourself in two weeks.`,
    reflection: {
      question: `Where does your drive actually come from? Not the answer you'd give in the interview — the real one. Why do you want this enough to keep going when it's hard?`,
      nudge: `You've written [WORD_COUNT] words. This one resists a generic answer on purpose. Name the real reason, even if it's not the noble one.`,
    },
    mission: `Write down, in one paragraph, your actual reason for wanting to be an officer. No one will read it. Be honest, not impressive.`,
  },

  // ── PHASE 3 — THE MIND (S13–16) ──────────────────────────────────────────
  {
    session_number: 13,
    cluster: 'mind',
    session_type: 'olq_drill',
    olq_focus: 'Reasoning Ability',
    phase_opener: `You met the engine in week one — Effective Intelligence, your raw thinking under pressure. This week is the rest of the machine: how you reason, organise, and express what that engine produces. Start with Reasoning.`,
    callback: `You met the engine in week one — Effective Intelligence, your raw thinking under pressure. This week is the rest of the machine: how you reason, organise, and express what that engine produces. Start with Reasoning.`,
    pull_quote: {
      fresher: `Reasoning Ability is not being logical. It's staying logical when the situation is built to make you emotional.`,
      repeater_1: `The situations that tripped you last time were probably the ones that felt unfair. That's not a coincidence — that's where Reasoning is tested.`,
      repeater_2: `By now you've learned which situations are traps. The problem is you learned to avoid them, not solve them.`,
    },
    what_this_means: {
      fresher: `Reasoning Ability is structured thinking that holds under emotional stress — logic under pressure. SRT situations are written to trigger emotion: an unfair accusation, a subordinate's costly mistake, a clash between what's right and what's easy. The assessor designs these to see whether your reasoning survives the feeling. High Reasoning reads a hard situation and structures the response — identify the problem, weigh who's affected, choose the action that serves the objective. Low Reasoning reacts — fixes the emotion instead of the problem. In WAT it shows on morally loaded words like "BLAME", "MISTAKE", "UNFAIR": do you react to the word, or respond to it? That difference is the score.`,
      repeater_1: `Repeaters usually have a specific situation type where reasoning breaks — almost always one of three: authority (a senior gives a wrong order), injustice (you're blamed for something you didn't do), or no-good-option (limited resources, two people to help). In these, candidates either appease authority or react emotionally, and the board scores neither well. High Reasoning keeps the same structured approach whether the situation is fair or not. Today, notice which situations made you write something impulsive — that type is probably what cost you last time.`,
      repeater_2: `Two boards in, you know which SRT situations are designed to test Reasoning under pressure, and you've learned to be careful with them. Careful is not officer-like. The assessor isn't looking for a candidate who tiptoes through the trap — they're looking for one whose reasoning is so naturally structured that the trap registers as just another problem to solve. If your hard-situation responses are visibly more measured than your easy-situation ones, that gap is the tell. Bring the same speed and directness to the unfair situations that you bring to the clean ones.`,
    },
    what_low_looks: {
      fresher: `Fixing the symptom instead of the cause. Prioritising how people feel over what the situation requires. Vague or avoidant responses on emotionally loaded words. Reasoning that collapses when something feels unfair.`,
      repeater_1: `Appeasing authority. Reacting emotionally to injustice. Paralysis on no-good-option situations. Describing the problem instead of solving it.`,
      repeater_2: `Hard-situation responses noticeably more cautious than easy ones. Over-explained reasoning. Hedging where a decision is clearly required.`,
    },
    baseline_note: {
      fresher: {
        low: `Your Reasoning Ability baseline is [SCORE]. Watch how your responses change when the situation gets unfair or emotionally loaded — that's where the gap shows. Today's drill weights toward those.`,
        strong: `Your Reasoning Ability baseline is [SCORE], strong. Today pushes into ambiguity with no clean resolution — reasoning where there isn't a tidy right answer.`,
      },
      repeater_1: {
        low: `Your Reasoning Ability baseline is [SCORE]. Watch how your responses change when the situation gets unfair or emotionally loaded — that's where the gap shows. Today's drill weights toward those.`,
        strong: `Your Reasoning Ability baseline is [SCORE], strong. Today pushes into ambiguity with no clean resolution — reasoning where there isn't a tidy right answer.`,
      },
      repeater_2: {
        low: `Your Reasoning Ability baseline is [SCORE]. Watch how your responses change when the situation gets unfair or emotionally loaded — that's where the gap shows. Today's drill weights toward those.`,
        strong: `Your Reasoning Ability baseline is [SCORE], strong. Today pushes into ambiguity with no clean resolution — reasoning where there isn't a tidy right answer.`,
      },
    },
    reflection: {
      good: `Think of a situation this week where you stayed structured while something felt unfair. What did you do differently than you would have a year ago?`,
      poor: `Today your responses weakened on the emotionally loaded situations. Think of one moment this week you reacted before you reasoned. What triggered it? What would a structured response have looked like?`,
      nudge: `You've written [WORD_COUNT] words. Name the situation — what happened, what you felt, what you did, and what structured would have produced instead.`,
    },
    mission: `Today, when something frustrates you, name the actual problem before you respond — not the emotion, the problem. Then take one action that addresses the problem, not the feeling. Notice if the outcome differs.`,
  },

  {
    session_number: 14,
    cluster: 'mind',
    session_type: 'olq_drill',
    olq_focus: 'Organising Ability',
    pull_quote: {
      fresher: `Organising Ability is not being organised. It's creating order when no one assigns it.`,
      repeater_1: `If you waited for the group to structure itself in your tasks, the board read that as missing Organising Ability — not patience.`,
      repeater_2: `A neat plan delivered to impress isn't Organising. The board watches whether order actually emerges from you, or just gets performed.`,
    },
    what_this_means: {
      fresher: `Organising Ability is creating order in chaos — making a plan and executing it when no one assigns tasks. In GTO planning exercises the group is handed a messy problem and no leader; the assessor watches who imposes a usable structure. In SRT it shows in situations with many moving parts under time pressure — do you sequence the actions, or list everything at once with no order? The clearest low tell: writing "I would wait for the group to decide" or "I would ask my senior how to proceed" when no senior exists and the group is looking for someone to organise it. The board needs officers who turn a chaotic situation into a sequence of actions other people can follow.`,
      repeater_1: `Screened-out candidates often had the right ideas but couldn't structure them fast enough for the group to use — so someone else's rougher plan won because it came with a sequence. The pattern: contributing points without organising them, or deferring the structuring to others. In SRT, watch the multi-part situations — do you triage and sequence, or react to whatever's most urgent first? The board reads a structured response as a candidate who can run a task, and a scattered one as a candidate who can only contribute to it.`,
      repeater_2: `By the second board you can produce a clean plan — you've practised it. But Organising isn't a tidy artefact; it's whether order genuinely flows from how you think under pressure. The assessor distinguishes a plan built to look organised from a candidate who naturally sequences chaos into steps. Today, watch the messy situations: do you reach for structure instinctively, or assemble a neat-looking answer after the fact? The first is the OLQ. The second is preparation showing.`,
    },
    what_low_looks: {
      fresher: `Waiting for the group to structure itself. Listing actions with no sequence. Deferring to absent authority.`,
      repeater_1: `Good ideas delivered without structure. Reacting to the most urgent item instead of triaging the whole.`,
      repeater_2: `A clean plan assembled to impress rather than order that emerges naturally from reading the situation.`,
    },
    baseline_note: {
      fresher: {
        low: `Your Organising Ability baseline is [SCORE]. It shows in the multi-part situations — watch whether you sequence or scatter. Today's drill weights toward those.`,
        strong: `Your Organising Ability baseline is [SCORE]. Today moves to situations with more moving parts and less time — where structure has to come fast.`,
      },
      repeater_1: {
        low: `Your Organising Ability baseline is [SCORE]. It shows in the multi-part situations — watch whether you sequence or scatter. Today's drill weights toward those.`,
        strong: `Your Organising Ability baseline is [SCORE]. Today moves to situations with more moving parts and less time — where structure has to come fast.`,
      },
      repeater_2: {
        low: `Your Organising Ability baseline is [SCORE]. It shows in the multi-part situations — watch whether you sequence or scatter. Today's drill weights toward those.`,
        strong: `Your Organising Ability baseline is [SCORE]. Today moves to situations with more moving parts and less time — where structure has to come fast.`,
      },
    },
    reflection: {
      good: `Think of a chaotic situation recently where you brought order no one asked you to bring. What did you do first? Why that first?`,
      poor: `Today your responses scattered on the multi-part situations. Think of one recent time things were chaotic and you waited, followed, or froze instead of organising. What stopped you stepping in?`,
      nudge: `You've written [WORD_COUNT] words. Name the chaotic situation and the first thing you did — or didn't. The sequence is the point.`,
    },
    mission: `Take one thing in your environment that's genuinely disordered — a backlog, a messy plan, a stuck group decision — and bring real structure to it today. Not tidy it. Sequence it so someone else could act on it.`,
  },

  {
    session_number: 15,
    cluster: 'mind',
    session_type: 'olq_drill',
    olq_focus: 'Power of Expression',
    pull_quote: {
      fresher: `Power of Expression is the OLQ that punishes you for being right badly. Correct thinking, unclear expression — you still lose the marks.`,
      repeater_1: `If you knew your answers in the interview but couldn't land them, your thinking wasn't the problem. Your expression was.`,
      repeater_2: `You've polished what you say. The board scores whether you say what you mean — clearly, once, under pressure.`,
    },
    what_this_means: {
      fresher: `Power of Expression is saying what you mean clearly and concisely. The trap is that it's independent of intelligence: a candidate can reason brilliantly and still lose marks because the expression is vague, long, or trailing. In WAT it's writing one clear, active, complete sentence inside 15 seconds. In the PI it's answering what was asked without qualifying, restating the question, or trailing off mid-thought. In SRT it's describing an action plainly, not narrating a consideration. Many intelligent candidates underperform here — not because their thinking is poor, but because under pressure it comes out as a meandering response that never quite says the thing.`,
      repeater_1: `If your interview felt like you knew more than you managed to convey, this is your gap. The repeater pattern in PI: long, hedged answers that circle the point, restating the question to buy time, qualifying a clear thought until it's mushy. The board can only score what you actually express — your unspoken reasoning earns nothing. In WAT, watch for sentences that start strong and trail into vagueness. Clear and complete in 15 seconds beats clever and unfinished.`,
      repeater_2: `By the second board you've prepared what you say — rehearsed PI answers, smooth phrasing. But Power of Expression under pressure is about the unrehearsed moment: the follow-up question you didn't prepare, the WAT word that doesn't fit your practised patterns. The assessor reads the gap between your polished prepared answers and your messier spontaneous ones. Today, watch the responses where you have no rehearsed line — that's where your real Power of Expression sits.`,
    },
    what_low_looks: {
      fresher: `Long, meandering WAT responses. Vague SRT answers that describe the situation instead of responding to it. Sentences that trail off before they land.`,
      repeater_1: `PI answers that circle the point. Restating the question. Qualifying a clear thought into mush.`,
      repeater_2: `A gap between polished prepared answers and vague spontaneous ones. Clarity that depends on rehearsal.`,
    },
    baseline_note: {
      fresher: {
        low: `Your Power of Expression baseline is [SCORE]. Watch for sentences that start clear and trail into vagueness. Today's drill weights toward forcing one complete sentence per word.`,
        strong: `Your Power of Expression baseline is [SCORE]. Today moves to harder, more abstract prompts — where clear expression is hardest to hold.`,
      },
      repeater_1: {
        low: `Your Power of Expression baseline is [SCORE]. Watch for sentences that start clear and trail into vagueness. Today's drill weights toward forcing one complete sentence per word.`,
        strong: `Your Power of Expression baseline is [SCORE]. Today moves to harder, more abstract prompts — where clear expression is hardest to hold.`,
      },
      repeater_2: {
        low: `Your Power of Expression baseline is [SCORE]. Watch for sentences that start clear and trail into vagueness. Today's drill weights toward forcing one complete sentence per word.`,
        strong: `Your Power of Expression baseline is [SCORE]. Today moves to harder, more abstract prompts — where clear expression is hardest to hold.`,
      },
    },
    reflection: {
      good: `Think of a time recently you said a difficult thing clearly, in one go, and it landed. What made it clear — and could you do it again under pressure?`,
      poor: `Today [N] of your responses said less than you were thinking. Think of a moment this week you knew exactly what you meant but it came out vague or long. What got in the way?`,
      nudge: `You've written [WORD_COUNT] words. State your point in one sentence first, then explain it. If you can't get it into one sentence, that's the work.`,
    },
    mission: `Today, say one difficult or important thing to someone in a single clear sentence — no preamble, no qualifying, no trailing off. Say it once. Notice whether it lands harder than your usual way.`,
  },

  {
    session_number: 16,
    cluster: 'mind',
    session_type: 'synthesis',
    olq_focus: '',
    pull_quote: {
      fresher: `Three weeks. You've now been measured on how you decide, how you drive, and how you think. The cognitive picture is the clearest of the three.`,
      repeater_1: `Three weeks. You've now been measured on how you decide, how you drive, and how you think. The cognitive picture is the clearest of the three.`,
      repeater_2: `Three weeks. You've now been measured on how you decide, how you drive, and how you think. The cognitive picture is the clearest of the three.`,
    },
    templated_insight: `Across the Mind phase your strongest is [STRONGEST_MIND_OLQ] at [SCORE], weakest [WEAKEST_MIND_OLQ] at [SCORE]. The useful thing here is the join: your Effective Intelligence from week one was [EI_SCORE], and the rest of the cognitive cluster has come in [CONSISTENT/UNEVEN] with it. [If consistent: "Your thinking is reliable across the board — it holds whether you're reasoning, organising, or expressing."] [If uneven: "You think clearly but [WEAK_LINK] is the bottleneck — strong reasoning the board never fully sees because the expression or the structure loses it on the way out."]`,
    pattern_observation: `Most candidates are stronger at having good thoughts than at conveying them in a form the board can score. Your profile suggests [THINKING_SUMMARY]. The back half of the journey — full simulations — is where thinking, drive, and instinct have to work together under time, so a clear read on where your cognition leaks is exactly what you need walking into it.`,
    reflection: {
      question: `Across three weeks, which is more true of you: you think better than you show, or you show better than you think? Be honest — the answer changes what you work on next.`,
      nudge: `You've written [WORD_COUNT] words. Pick one. Then name the specific evidence from your own responses that makes it true.`,
    },
    mission: `Explain one thing you understand well to someone who doesn't — out loud, in plain words, in under a minute. If they get it, your expression is doing its job.`,
  },

  // ── PHASE 4 — OTHERS (S17–21) ────────────────────────────────────────────
  {
    session_number: 17,
    cluster: 'others',
    session_type: 'social',
    olq_focus: 'Social Adaptability',
    phase_opener: `The last three weeks measured you alone — your instinct, your drive, your thinking. But half of SSB happens in a group: the GTO tasks, the discussions, the mess. These next sessions are about your effect on other people. We can't score this from a screen — no app can. So this week the mission is the session. Do them for real.`,
    pull_quote: {
      fresher: `Social Adaptability is not being likeable. It's being effective with people who are nothing like you.`,
      repeater_1: `If you were comfortable with half your group and quiet with the other half, the board saw an adaptability gap.`,
      repeater_2: `Being smooth with people like you is easy. The board is watching the moment the group includes someone you'd never choose.`,
    },
    what_this_means: {
      fresher: `Social Adaptability is being effective with people different from you — different background, temperament, region, opinion. Not popularity; effectiveness. In GTO tasks the group is deliberately mixed, and the assessor watches whether you work just as well with the people unlike you as the ones like you. The tell for low adaptability is gravitating to the candidates who feel familiar and going quieter or more rigid with the ones who don't. The Army puts you in command of people from everywhere, so the board is asking a real question: can you lead the soldier who's nothing like you as well as the one who is?`,
      repeater_1: `Screened-out candidates often connected well with part of the group and disengaged from the rest — and the board reads selective engagement as limited adaptability. The pattern: becoming less involved when the group's approach or personalities don't match yours. Watch your own instinct to write people off as difficult. The board wants the candidate who adjusts to the group, not the one who needs the group to suit them.`,
      repeater_2: `By the second board you can be socially smooth. But adaptability isn't smoothness — it's whether you stay effective when the group contains someone who irritates you, disagrees with you, or operates completely differently. The assessor watches whether your contribution holds or drops when the dynamic isn't to your liking. Today's mission targets exactly that: not the easy social setting, the friction one.`,
    },
    board_sees: {
      fresher: {
        low: `Engaging warmly with the familiar half of the group, going quiet or rigid with the rest. Disengaging when the group's style doesn't match yours.`,
        strong: `Equal effectiveness across the whole group, including the people you'd never have chosen to work with.`,
      },
      repeater_1: {
        low: `Engaging warmly with the familiar half of the group, going quiet or rigid with the rest. Disengaging when the group's style doesn't match yours.`,
        strong: `Equal effectiveness across the whole group, including the people you'd never have chosen to work with.`,
      },
      repeater_2: {
        low: `Engaging warmly with the familiar half of the group, going quiet or rigid with the rest. Disengaging when the group's style doesn't match yours.`,
        strong: `Equal effectiveness across the whole group, including the people you'd never have chosen to work with.`,
      },
    },
    reflection: {
      question: `When did you last work well with someone you didn't like or didn't understand? What did you adjust in yourself to make it work — and could you do it on demand at a board?`,
      nudge: `You've written [WORD_COUNT] words. Name the specific person and the specific adjustment. "I got along with everyone" is not an answer.`,
    },
    mission: `Today, have a real conversation with someone you'd normally not engage — someone older, very different, or whose views you don't share. Not small talk. Find one thing you actually understand about them you didn't before.`,
  },

  {
    session_number: 18,
    cluster: 'others',
    session_type: 'social',
    olq_focus: 'Cooperation',
    pull_quote: {
      fresher: `Cooperation is not agreeing. It's contributing fully to a plan you argued against.`,
      repeater_1: `If you went along with the group but held back once your idea lost, the board scored that as low Cooperation — not teamwork.`,
      repeater_2: `Visible agreement isn't Cooperation. The board watches what you give after your idea is rejected.`,
    },
    what_this_means: {
      fresher: `Cooperation is contributing to the group's outcome even when you disagree with the approach. The hard case is the one the board cares about: your idea loses the vote, the group goes another way — do you commit to it fully, or do you comply on the surface while quietly withdrawing your best effort? In GTO tasks the assessor watches the candidate whose plan wasn't chosen. High Cooperation gives the chosen plan everything, even the plan they argued against. Low Cooperation goes through the motions, makes it subtly known they disagreed, or waits to be proven right. An officer who only commits to their own ideas can't serve under anyone.`,
      repeater_1: `The repeater pattern here is passive resistance: agreeing out loud, then contributing less because it's not your plan. The board reads the drop in energy after your idea loses as a Cooperation gap — and it's a common screen-out cause, because it shows you put your ego above the group's result. Watch the mission today for the moment your suggestion isn't taken. What you do next is the whole OLQ.`,
      repeater_2: `By the second board you know not to sulk visibly. But Cooperation isn't the absence of sulking — it's positive contribution to a direction you disagree with. The assessor distinguishes the candidate who commits genuinely to the rejected plan from the one who complies neutrally and stays ready to say "I told you so". Today, deliberately back something you disagree with, and give it your real effort. Notice how hard that is — that difficulty is the measure.`,
    },
    board_sees: {
      fresher: {
        low: `Surface agreement, withdrawn effort once your idea loses. Making your disagreement quietly known. Compliance without contribution.`,
        strong: `Full effort behind the chosen plan, including one you argued against. Disagreeing in the discussion, committing in the execution.`,
      },
      repeater_1: {
        low: `Surface agreement, withdrawn effort once your idea loses. Making your disagreement quietly known. Compliance without contribution.`,
        strong: `Full effort behind the chosen plan, including one you argued against. Disagreeing in the discussion, committing in the execution.`,
      },
      repeater_2: {
        low: `Surface agreement, withdrawn effort once your idea loses. Making your disagreement quietly known. Compliance without contribution.`,
        strong: `Full effort behind the chosen plan, including one you argued against. Disagreeing in the discussion, committing in the execution.`,
      },
    },
    reflection: {
      question: `When did you last give your full effort to something you'd argued against? Or did you hold back to be proven right? Be honest about which.`,
      nudge: `You've written [WORD_COUNT] words. Name the specific plan you disagreed with and exactly what you did once it was chosen — effort or withdrawal.`,
    },
    mission: `Today, fully back a group decision you disagree with — at home, at work, anywhere a choice goes against your preference. Give it your real effort, not grudging compliance. Notice the pull to hold back.`,
  },

  {
    session_number: 19,
    cluster: 'others',
    session_type: 'social',
    olq_focus: 'Ability to Influence Group',
    pull_quote: {
      fresher: `Ability to Influence is moving people toward a goal without any authority over them.`,
      repeater_1: `If your good ideas didn't move the group last time, the gap wasn't your ideas. It was influence.`,
      repeater_2: `Talking more isn't influence. Going silent when your idea is rejected is the opposite of it.`,
    },
    what_this_means: {
      fresher: `Ability to Influence Group is moving people toward a goal when you have no authority over them — which is exactly the GTO situation: a group of equals, no assigned leader. Influence isn't volume or dominance; it's getting others to genuinely adopt a direction. The tell for low influence is using authority language you haven't earned — "we should", "the right thing is to" — to a group that owes you nothing, or proposing a good idea once and going silent when it isn't immediately taken. High influence reads the group, brings people in, and builds agreement rather than demanding it. The Army runs on officers who can move people who don't yet have to obey them.`,
      repeater_1: `Screened-out candidates often had sound ideas the group never adopted — and an idea that doesn't move anyone scores as low influence regardless of how good it was. The pattern: stating your point once, and when it's not picked up, withdrawing instead of building support for it. Influence is persistence plus reading the room — re-entering with the idea framed for the people who resisted it, not just repeating it louder. Watch the mission for the moment your suggestion stalls. Do you build, or retreat?`,
      repeater_2: `By the second board you can command a room's attention. But attention isn't influence — influence is whether the group actually moves where you're pointing. The assessor distinguishes the candidate who dominates the discussion from the one who quietly gets their direction adopted, often by giving others credit for it. Today, move a group toward something without pulling rank, raising your voice, or making it about you. If they get there thinking it was their idea, that's the highest form of the OLQ.`,
    },
    board_sees: {
      fresher: {
        low: `Unearned authority language to a group of equals. One proposal, then silence when it's rejected. Volume mistaken for influence.`,
        strong: `Direction adopted by the group without rank or dominance. Persistence that re-frames rather than repeats. Bringing resisters in.`,
      },
      repeater_1: {
        low: `Unearned authority language to a group of equals. One proposal, then silence when it's rejected. Volume mistaken for influence.`,
        strong: `Direction adopted by the group without rank or dominance. Persistence that re-frames rather than repeats. Bringing resisters in.`,
      },
      repeater_2: {
        low: `Unearned authority language to a group of equals. One proposal, then silence when it's rejected. Volume mistaken for influence.`,
        strong: `Direction adopted by the group without rank or dominance. Persistence that re-frames rather than repeats. Bringing resisters in.`,
      },
    },
    reflection: {
      question: `When did you last change a group's direction without any authority to? How did you do it — and was it about the idea, or about you needing to win?`,
      nudge: `You've written [WORD_COUNT] words. Name the group, the direction, and the specific thing you did to move them. "I convinced them" is not a method.`,
    },
    mission: `Today, move a group decision toward what you think is right — without pulling rank, raising your voice, or making it about you. Build agreement. If it works, notice what actually moved them.`,
  },

  {
    session_number: 20,
    cluster: 'others',
    session_type: 'social',
    olq_focus: 'Liveliness',
    pull_quote: {
      fresher: `Liveliness is the energy that makes people want to follow you. The board can tell the real kind from the performed kind.`,
      repeater_1: `If you tried to seem enthusiastic last time, the board likely saw the effort. Performed energy reads as performed.`,
      repeater_2: `Talking more to seem positive isn't Liveliness. Real energy doesn't need volume.`,
    },
    what_this_means: {
      fresher: `Liveliness is genuine energy and warmth — the quality that makes people want to be around you and follow you. It matters because officers carry the morale of the people under them; a leader who drains a room can't lead it. The catch is that assessors are trained to tell performed energy from real energy, and they have five days to do it. The tell for low or fake Liveliness is trying to seem enthusiastic by talking more, or positivity that doesn't match the rest of your behaviour — bright in the task, flat in the mess. Real Liveliness is consistent and effortless; it shows in the informal moments as much as the formal ones.`,
      repeater_1: `The repeater pattern: turning up the enthusiasm in observed tasks and going flat when you think no one's watching. The board watches the unwatched moments specifically, and a mismatch between performed task-energy and real downtime-energy reads as inauthentic. You can't manufacture Liveliness for five days — it has to be genuine or the gap shows. Watch your own energy this week in the moments that don't "count". Those are the ones that do.`,
      repeater_2: `By the second board you've learned energy is valued, so you produce it on cue — and produced-on-cue is exactly what the assessor is trained to catch. Real Liveliness isn't a performance you switch on; it's how present and warm you are by default, including when you're tired or unobserved. Today's not about being louder. It's about whether your genuine energy is available to a room — and if it isn't, that's worth knowing now rather than on Day 4 of a board.`,
    },
    board_sees: {
      fresher: {
        low: `Energy that switches on for tasks and off in downtime. Talking more to seem enthusiastic. Positivity that doesn't match the rest of the behaviour.`,
        strong: `Consistent, genuine warmth across formal and informal moments. Energy that draws people in without effort or volume.`,
      },
      repeater_1: {
        low: `Energy that switches on for tasks and off in downtime. Talking more to seem enthusiastic. Positivity that doesn't match the rest of the behaviour.`,
        strong: `Consistent, genuine warmth across formal and informal moments. Energy that draws people in without effort or volume.`,
      },
      repeater_2: {
        low: `Energy that switches on for tasks and off in downtime. Talking more to seem enthusiastic. Positivity that doesn't match the rest of the behaviour.`,
        strong: `Consistent, genuine warmth across formal and informal moments. Energy that draws people in without effort or volume.`,
      },
    },
    reflection: {
      question: `Are you someone whose energy lifts a room or flattens it — honestly? When you're tired, which way do you tip? The board will meet the tired version.`,
      nudge: `You've written [WORD_COUNT] words. Don't answer aspirationally. Name a real recent moment your energy affected a group — up or down.`,
    },
    mission: `Today, walk into one low-energy room or conversation and lift it — genuinely, not by performing. Bring real attention and warmth. Notice whether it costs you effort, and whether that effort shows.`,
  },

  {
    session_number: 21,
    cluster: 'others',
    session_type: 'synthesis',
    olq_focus: '',
    pull_quote: {
      fresher: `Four weeks. You've now looked at yourself alone and yourself among others. The second picture is the one half of SSB is built on — and the one you can't fake for five days.`,
      repeater_1: `Four weeks. You've now looked at yourself alone and yourself among others. The second picture is the one half of SSB is built on — and the one you can't fake for five days.`,
      repeater_2: `Four weeks. You've now looked at yourself alone and yourself among others. The second picture is the one half of SSB is built on — and the one you can't fake for five days.`,
    },
    templated_insight: `The social qualities don't come with a number, because no honest app can score how you affect a real room. What we can show is your own record: across the Others phase you reported [MISSION_SUMMARY — e.g. "following through on the harder social missions but flagging Liveliness as the one that felt least natural"]. Take that seriously — the OLQ you found hardest to do for real is the one the board is most likely to catch, because it's the one you can't perform your way through over five days.`,
    pattern_observation: `Put the two halves together. Alone, your signature is [SELF_SUMMARY from earlier synthesis]. Among others, it's [SOCIAL_SUMMARY]. The candidates who get recommended are usually consistent across both — the same person solving an SRT and standing in a GTO circle. Where your two halves don't match is where the board's five-day, multi-context observation will find the seam. That's the most useful thing to know walking into the simulations.`,
    reflection: {
      question: `Which is the real you — the one in the solo tests, or the one in a group? If they're different people, the board will notice. Which one walks into the board?`,
      nudge: `You've written [WORD_COUNT] words. Don't say "both". Name where the two versions of you actually diverge, with one example.`,
    },
    mission: `Tell one person you trust what you're working on and why — not to impress them, to make it real. The social qualities only grow when they leave your head.`,
  },

  // ── PHASE 5 — INTEGRATION (S22–30) ───────────────────────────────────────
  {
    session_number: 22,
    cluster: 'integration',
    session_type: 'simulation',
    olq_focus: '',
    framing: `For three weeks you've drilled in pieces — five words, a focused set. Today is the full WAT under board conditions: 60 words, 15 seconds each, no pause, no second pass. This isn't a lesson. It's a test of whether the work transferred. Don't try to remember what you learned about each OLQ — that's the trap. Just respond. The point is to see what your instinct does now, when there's no time to think, versus what it did on Day 1.`,
    post_sim_read: `You completed the full WAT. Compared with your Day-1 baseline, your instinct held its shape on [N] of the qualities and shifted on [M]. The fatigue across 60 words matters — note where your responses thinned out in the back third. That drift is what five days of real assessment magnifies. Tomorrow: the full SRT.`,
    reflection: {
      question: `Across 60 words with no time to think — did you respond as the person you've been building, or did the old pattern come back under pressure? Where specifically?`,
      nudge: `You've written [WORD_COUNT] words. Name the words or the stretch where the old instinct returned. The back third is usually where it shows.`,
    },
    mission: `Rest properly tonight. The next two sessions are full simulations and the board itself is five days of sustained performance. Treating recovery as part of preparation is the Stamina lesson applied.`,
  },

  {
    session_number: 23,
    cluster: 'integration',
    session_type: 'simulation',
    olq_focus: '',
    framing: `The full SRT — 60 situations, 30 seconds each. Yesterday tested your word-level instinct; today tests your situational judgment at scale. The same rule applies: don't perform the qualities, respond. The board reads 60 situations as one continuous picture of how you handle pressure, ambiguity, authority, and people. By now you know your own tells — the authority situations, the no-good-option ones, the moments you hedge. Watch for them, but don't manage them. Just see whether they've actually changed.`,
    post_sim_read: `Full SRT complete. Your strongest situation types were [STRONG_TYPES]; your responses still weaken on [WEAK_TYPES] — the same family that showed up in Phase 1 and [IMPROVED/PERSISTED] since. Two full simulations now give a real signal, not a single-session reading. Tomorrow we put both together.`,
    reflection: {
      question: `Which situation type still breaks your reasoning under the full-length pressure? Name it precisely — it's the one to walk into the board already knowing about.`,
      nudge: `You've written [WORD_COUNT] words. Authority, injustice, no-good-option, or something else — name the type and one situation where it showed today.`,
    },
    mission: `None — two full simulations is a real load. Let it settle. Tomorrow is the debrief.`,
  },

  {
    session_number: 24,
    cluster: 'integration',
    session_type: 'synthesis',
    olq_focus: '',
    pull_quote: {
      fresher: `Two full simulations. This is the closest you've come to the real thing — and the clearest read you've had of who shows up under sustained pressure.`,
      repeater_1: `Two full simulations. This is the closest you've come to the real thing — and the clearest read you've had of who shows up under sustained pressure.`,
      repeater_2: `Two full simulations. This is the closest you've come to the real thing — and the clearest read you've had of who shows up under sustained pressure.`,
    },
    templated_insight: `Across both simulations, the through-line is [CROSS_SIM_PATTERN — e.g. "your instinct is markedly stronger than Day 1, but it thins under fatigue — strong for 40 words, drifting by 55"]. That's the single most important thing to know about your current readiness, because the board is not one test — it's five days, and fatigue is the variable that separates a strong first impression from a recommendation. Your most improved quality since Day 1 is [MOST_IMPROVED] ([D1]→[NOW]). The one still holding you back is [STILL_WEAK] — and it's the same one flagged in [EARLIER_SYNTHESIS]. Consistency of the gap across four weeks means it's structural, not incidental. That's where the last week points.`,
    reflection: {
      question: `If the board were tomorrow, what's the one thing about your performance you'd most want to fix — and is it fixable in a week, or is it something to manage rather than fix?`,
      nudge: `You've written [WORD_COUNT] words. Name the one thing, and be honest about whether a week changes it or you walk in managing it.`,
    },
    mission: `Write down the one pattern you most want to hold steady at the board, and the one you most need to watch. Two lines. Keep them where you'll see them.`,
  },

  // Engineering order: S25 → S26 → S27 (doc groups S27 before S26 for cluster clarity)
  {
    session_number: 25,
    cluster: 'integration',
    session_type: 'checkpoint',
    olq_focus: '',
    framing: `One more real-life check — the last one before the final stretch. The board, whenever yours falls, is closer than when you started. These five questions aren't about the app. They're about whether the person the board will meet has actually changed.`,
    questions: [
      `In the last 7 days, did you act on something without waiting to be told?`,
      `Did you stay structured in a situation that would have rattled you a month ago?`,
      `Did you commit to a decision others were still debating?`,
      `Did you contribute fully to something you disagreed with?`,
      `Did someone respond to your energy or direction in a group?`,
    ],
    reads: {
      transfer: `[TRANSFER_COUNT] of 5, and notice these are harder questions than the Session 10 set. The change is reaching the situations that actually resemble a board. This is the real result — not your scores, this. You're not practising being recommendable anymore; you're becoming it.`,
      lowTransfer: `[TRANSFER_COUNT] of 5. Your simulations have improved but real life hasn't fully followed — and the board reads real life, not your practice history. You have a window before the board. Spend it forcing the patterns into real situations, not more drills. The last sessions are built for exactly that.`,
    },
    mission: `None today. The check-in is the work. Next: Self-Description.`,
  },

  {
    session_number: 26,
    cluster: 'integration',
    session_type: 'simulation',
    olq_focus: '',
    framing: `Both tests, back to back, under time — the closest the app gets to the psych battery of Day 2. No warm-up between them, because the board doesn't give you one. This is where instinct, drive, and thinking either work together or compete. Watch the handover: does your performance hold from WAT into SRT, or does fatigue from the first drop the quality of the second? That handover is exactly what Day 2 tests.`,
    post_sim_read: `Integrated simulation complete. Holding quality across both tests back-to-back is the real measure, and yours [HELD/DROPPED] at the handover. Combined with your two earlier full sims, your readiness signature is [READINESS_SUMMARY]. One more review session puts the whole 30 days in front of you.`,
    reflection: {
      question: `Running both under fatigue — did the second test get the same person as the first? That consistency under load is what five days demands.`,
      nudge: `You've written [WORD_COUNT] words. Name where the handover cost you — and whether it was speed, clarity, or care that dropped first.`,
    },
    mission: `None. Rest. The next two sessions close the journey.`,
  },

  {
    session_number: 27,
    cluster: 'integration',
    session_type: 'sd',
    olq_focus: '',
    pull_quote: {
      fresher: `Self-Description is the one test you can't drill. It only works if you actually know yourself.`,
      repeater_1: `If your interview and your SD didn't match last time, the board saw a person who doesn't fully know themselves.`,
      repeater_2: `A polished self-description the board has heard before tells them nothing. The honest one tells them everything.`,
    },
    what_this_means: {
      fresher: `In the SD test you describe yourself from five viewpoints — how you see yourself, how your parents see you, how a teacher or employer sees you, how a friend sees you, and how you'd like to be. It sounds simple and it's deeply revealing, because the gaps between the five versions show the assessor how self-aware and how integrated you are. A candidate who writes five flattering, near-identical descriptions reveals someone performing rather than knowing. A candidate whose versions differ honestly — strengths a friend sees that a teacher wouldn't, a flaw their parents know — reveals someone with real self-knowledge. This whole journey has been pointed here: you can only describe yourself accurately if you've actually looked.`,
      repeater_1: `If you were screened out, one quiet possibility is that your SD, PI, and psych tests told three slightly different stories — and inconsistency across them reads as a candidate who hasn't done the self-work. The repeater fix isn't a better-written SD; it's a more honest one. Four weeks of reflections have given you material most candidates never gather. Use it. Write the version that's true across all five viewpoints, including the unflattering overlaps.`,
      repeater_2: `By the second board you can write a clean, officer-sounding self-description — and the assessor has read a thousand of them. What they're actually looking for is the candidate whose five views are honestly different and still clearly one person. Polished sameness is a tell. Today, write the version you'd be slightly uncomfortable handing over — the one where your parents' view and your own view don't fully agree. That discomfort is the evidence of real self-knowledge.`,
    },
    board_sees: {
      fresher: {
        low: `Five flattering, near-identical descriptions. No gaps, no flaws, no real differences between viewpoints. Performed self-awareness.`,
        strong: `Five honestly different views that still cohere into one integrated person. Flaws owned. The self-knowledge the journey was built to produce.`,
      },
      repeater_1: {
        low: `Five flattering, near-identical descriptions. No gaps, no flaws, no real differences between viewpoints. Performed self-awareness.`,
        strong: `Five honestly different views that still cohere into one integrated person. Flaws owned. The self-knowledge the journey was built to produce.`,
      },
      repeater_2: {
        low: `Five flattering, near-identical descriptions. No gaps, no flaws, no real differences between viewpoints. Performed self-awareness.`,
        strong: `Five honestly different views that still cohere into one integrated person. Flaws owned. The self-knowledge the journey was built to produce.`,
      },
    },
    reflection: {
      question: `Write the five descriptions now — honestly. Where do they disagree most? That disagreement is the thing the board will probe, and the thing you most need to understand before they do.`,
      nudge: `You've written [WORD_COUNT] words. Five viewpoints. If they all say the same flattering thing, you haven't done it yet — find where they actually differ.`,
    },
    mission: `Ask one person who knows you well how they'd describe you — and listen without defending. Compare it to your own version. The gap is your homework.`,
  },

  {
    session_number: 28,
    cluster: 'integration',
    session_type: 'synthesis',
    olq_focus: '',
    pull_quote: {
      fresher: `Thirty days of data. For the first time, all 15 qualities, side by side, then and now. This is the picture the board would build — except you've seen it first.`,
      repeater_1: `Thirty days of data. For the first time, all 15 qualities, side by side, then and now. This is the picture the board would build — except you've seen it first.`,
      repeater_2: `Thirty days of data. For the first time, all 15 qualities, side by side, then and now. This is the picture the board would build — except you've seen it first.`,
    },
    templated_insight: `Here is your full movement, Day 1 to now. Biggest gains: [TOP_3_IMPROVED with D1→NOW]. Still your weakest, even after the work: [BOTTOM_2 with scores]. What this picture says about you: [WHOLE_PROFILE_READ — e.g. "a candidate who came in deciding fast but hedging, and now decides fast and commits — with Cooperation still the quality to watch when your idea loses"]. The board would read this same shape. The difference is you know it walking in, which means nothing on Day 2 can surprise you about yourself. That is what "knowing yourself" was always pointing at.`,
    pattern_observation: `Across all four synthesis points — instinct, drive, thinking, social — the consistent through-line in your profile is [MASTER_THROUGHLINE]. That one sentence is the truest thing this journey has learned about you. Carry it into the board.`,
    reflection: {
      question: `Looking at all 15 together — who were you on Day 1, and who walks into the board now? Say it in your own words, not the scores'.`,
      nudge: `You've written [WORD_COUNT] words. Name the before and the after as two specific people, not two sets of numbers.`,
    },
    mission: `None. Tomorrow: what to hold onto when you walk in.`,
  },

  {
    session_number: 29,
    cluster: 'integration',
    session_type: 'consolidation',
    olq_focus: '',
    pull_quote: {
      fresher: `You can't take 30 days of notes into the board. You take one thing: knowing yourself. That's enough.`,
      repeater_1: `Last time you walked in hoping. This time you walk in knowing. That's the whole difference.`,
      repeater_2: `You've done the work twice over now. Walk in as yourself — that's the only version the board recommends.`,
    },
    consolidation_body: {
      fresher: `The board is not a test you can cram for tomorrow, and trying to is the one thing that undoes 30 days of work — it puts the performance filter back on right when you need your real instinct. So this session isn't new content. It's subtraction. Walk in holding three things, nothing more: the one pattern you've built that you most want to show (your most-improved quality), the one gap you know about and will manage rather than hide, and the plain fact that you've actually looked at yourself for 30 days, which almost no one in that room has done. Everything else — the OLQ definitions, the response templates, the strategies — let them go. They were scaffolding. The building is you.\n\nFirst board. You don't have a failure to overwrite — you have a foundation. Trust it.`,
      repeater_1: `The board is not a test you can cram for tomorrow, and trying to is the one thing that undoes 30 days of work — it puts the performance filter back on right when you need your real instinct. So this session isn't new content. It's subtraction. Walk in holding three things, nothing more: the one pattern you've built that you most want to show (your most-improved quality), the one gap you know about and will manage rather than hide, and the plain fact that you've actually looked at yourself for 30 days, which almost no one in that room has done. Everything else — the OLQ definitions, the response templates, the strategies — let them go. They were scaffolding. The building is you.\n\nYou know what the room feels like now, and you know your pattern. Walk in and let the board meet the version you built, not the one that was screened out.`,
      repeater_2: `The board is not a test you can cram for tomorrow, and trying to is the one thing that undoes 30 days of work — it puts the performance filter back on right when you need your real instinct. So this session isn't new content. It's subtraction. Walk in holding three things, nothing more: the one pattern you've built that you most want to show (your most-improved quality), the one gap you know about and will manage rather than hide, and the plain fact that you've actually looked at yourself for 30 days, which almost no one in that room has done. Everything else — the OLQ definitions, the response templates, the strategies — let them go. They were scaffolding. The building is you.\n\nTwice before, you walked in performing. This time, don't. The recommended candidate isn't the best performer in the room — it's the one who's most clearly themselves under pressure. After 30 days, that can be you.`,
    },
    reflection: {
      question: `What are the three things you're walking in with? Write them down — the strength to show, the gap to manage, and your reason for being there. This is your board, in three lines.`,
      nudge: `You've written [WORD_COUNT] words. Three things, specific to you. Not advice you've read — the three that are actually yours.`,
    },
    mission: `Read your three lines out loud once. Then close the app and go live the day. You're ready. The reveal is waiting for Day 30.`,
  },

  {
    session_number: 30,
    cluster: 'integration',
    session_type: 'reveal',
    olq_focus: '',
    templated_insight: `You made it. Thirty days of showing up. Most candidates never do this. You did.\n\nSee how much you've changed.\n\nYour OLQ profile, Day 1 and Day 30, side by side. Biggest movement: [TOP_OLQ] [D1]→[D30] (+[DELTA]). "Your [TOP_OLQ] moved from [D1] to [D30]. That's not a number. That's 30 days of showing up when it was easier not to." Composite: Day 1 [D1_COMPOSITE] → Day 30 [D30_COMPOSITE], +[GROWTH]. [PERCENTILE] of all journey completers.`,
    mission: `Start another 30-day cycle (with your known gap targeted from Session 1) · Refer someone who needs this · If your board has passed, tell us how it went.`,
  },
];

export function getSession(n: number): JourneySession {
  const s = JOURNEY.find((j) => j.session_number === n);
  if (!s) throw new Error(`Session ${n} not found`);
  return s;
}

export function getProfileText<T>(field: ByProfile<T>, p: Profile): T {
  return field[p];
}

export function clusterOf(n: number): Cluster {
  if (n >= 1 && n <= 6)  return 'mirror';
  if (n >= 7 && n <= 12) return 'drive';
  if (n >= 13 && n <= 16) return 'mind';
  if (n >= 17 && n <= 21) return 'others';
  if (n >= 22 && n <= 30) return 'integration';
  throw new Error(`Session number ${n} out of range 1–30`);
}
