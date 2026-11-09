import { useState } from "react";
import { ratingFromScore } from "@/lib/wat-data";
import type { InterviewAnalysis, InterviewTurn } from "@/lib/interview-anthropic";
import { ROOM } from "./OfficeScene";

const FACTORS: { name: string; olqs: string[] }[] = [
  { name: "Planning and organising", olqs: ["Effective Intelligence", "Reasoning Ability", "Organising Ability", "Power of Expression"] },
  { name: "Social adjustment", olqs: ["Social Adaptability", "Cooperation", "Sense of Responsibility"] },
  { name: "Social effectiveness", olqs: ["Initiative", "Self Confidence", "Speed of Decision", "Ability to Influence", "Liveliness"] },
  { name: "Dynamic", olqs: ["Determination", "Courage", "Stamina"] },
];

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="m-0 border-b pb-2 text-[19px] font-bold" style={{ borderColor: ROOM.rule }}>{children}</h2>;
}

function Bullets({ items }: { items: string[] }) {
  if (!items?.length) return <p className="m-0 text-[16px]" style={{ color: ROOM.inkMuted }}>Nothing noted.</p>;
  return (
    <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-[16px] leading-[1.55]">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

export function InterviewFile({
  analysis,
  turns,
  chestNo,
  officerName,
  actions,
}: {
  analysis: InterviewAnalysis;
  turns: InterviewTurn[];
  chestNo: number;
  officerName: string;
  actions: React.ReactNode;
}) {
  const [showRecord, setShowRecord] = useState(false);
  const scores = analysis.olq_scores ?? {};
  const all = FACTORS.flatMap((f) => f.olqs.map((o) => scores[o] ?? 0));
  const composite = Math.round(all.reduce((a, b) => a + b, 0) / all.length);
  const rating = ratingFromScore(composite);
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-[100dvh] px-4 py-8 md:px-8 md:py-12 [&_h1]:[font-family:inherit] [&_h2]:[font-family:inherit]" style={{ background: ROOM.wall, color: ROOM.ink, fontFamily: ROOM.sans }}>
      <div className="mx-auto max-w-[860px]">
        <div className="relative px-5 pb-7 pt-6 md:px-12 md:pb-12 md:pt-10" style={{ background: ROOM.paperLight, boxShadow: "0 1px 0 #CFC7B4, 0 12px 30px rgba(30,29,26,0.10)" }}>
          <div aria-hidden="true" className="absolute left-0 right-0 top-0 h-[6px]" style={{ background: ROOM.khaki }} />

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="m-0 text-[14px]" style={{ fontFamily: ROOM.typed, color: ROOM.inkMuted }}>
                PERSONAL INTERVIEW · MOCK · CH. NO. {chestNo} · {date.toUpperCase()}
              </p>
              <h1 className="m-0 mt-2 text-[28px] font-bold leading-tight md:text-[34px]">Interviewing Officer's notes</h1>
              <p className="m-0 mt-1 text-[16px]" style={{ color: ROOM.inkSoft }}>{officerName}</p>
            </div>
            <div className="px-4 py-3 text-center" style={{ border: `2px solid ${ROOM.tape}`, color: ROOM.tape, transform: "rotate(-3deg)" }}>
              <p className="m-0 text-[30px] font-bold leading-none">{composite}</p>
              <p className="m-0 mt-1 text-[13px] font-bold uppercase" style={{ fontFamily: ROOM.typed }}>{rating.label}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-9">
            <section className="flex flex-col gap-3">
              <Heading>Overall</Heading>
              <p className="m-0 text-[17px] leading-[1.65]">{analysis.summary}</p>
              <p className="m-0 text-[14px]" style={{ color: ROOM.inkMuted }}>
                Five minutes gives a first picture, not a verdict, and it is not a prediction of a real board's decision.
              </p>
            </section>

            {analysis.bundle && (
              <section className="flex flex-col gap-3">
                <Heading>The bundle of questions</Heading>
                <p className="m-0 text-[17px] leading-[1.65]">{analysis.bundle}</p>
              </section>
            )}

            <section className="flex flex-col gap-4">
              <Heading>Qualities, by factor</Heading>
              <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
                {FACTORS.map((f) => {
                  const avg = Math.round(f.olqs.reduce((a, o) => a + (scores[o] ?? 0), 0) / f.olqs.length);
                  return (
                    <div key={f.name} className="flex flex-col gap-2">
                      <p className="m-0 flex justify-between text-[16px] font-bold">
                        <span>{f.name}</span>
                        <span>{avg}</span>
                      </p>
                      {f.olqs.map((o) => (
                        <div key={o} className="grid grid-cols-[150px_1fr_32px] items-center gap-3 text-[14px]">
                          <span style={{ color: ROOM.inkSoft }}>{o}</span>
                          <span className="h-[8px]" style={{ background: "#E8E1D0" }}>
                            <span className="block h-full" style={{ width: `${Math.max(2, Math.min(100, scores[o] ?? 0))}%`, background: ROOM.ink }} />
                          </span>
                          <span className="text-right" style={{ fontFamily: ROOM.typed }}>{scores[o] ?? 0}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </section>

            {analysis.conduct && (
              <section className="flex flex-col gap-3">
                <Heading>Conduct in the room</Heading>
                <p className="m-0 text-[17px] font-bold" style={{ color: analysis.conduct.rating === "Composed" ? ROOM.ink : ROOM.tape }}>
                  {analysis.conduct.rating}
                </p>
                <p className="m-0 text-[16px] leading-[1.6]">{analysis.conduct.notes}</p>
              </section>
            )}

            <section className="flex flex-col gap-4">
              <Heading>What held up</Heading>
              {(analysis.strong_moments ?? []).length ? (
                analysis.strong_moments.map((m, i) => (
                  <div key={i} className="border-l-[3px] pl-4" style={{ borderColor: ROOM.khaki }}>
                    <p className="m-0 text-[16px] italic leading-[1.55]">“{m.quote}”</p>
                    <p className="m-0 mt-1 text-[15px]" style={{ color: ROOM.inkSoft }}>{m.read}</p>
                  </div>
                ))
              ) : (
                <p className="m-0 text-[16px]" style={{ color: ROOM.inkMuted }}>Nothing stood out this time.</p>
              )}
            </section>

            <section className="flex flex-col gap-5">
              <Heading>What did not hold up</Heading>
              {(analysis.weak_moments ?? []).map((m, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <p className="m-0 text-[16px] italic leading-[1.55]">“{m.quote}”</p>
                  <p className="m-0 text-[15px]" style={{ color: ROOM.inkSoft }}>{m.issue}</p>
                  <p className="m-0 px-4 py-3 text-[15px] leading-[1.55]" style={{ background: "#F3EEDF" }}>
                    <strong>Stronger:</strong> {m.stronger}
                  </p>
                </div>
              ))}
            </section>

            <section className="flex flex-col gap-3">
              <Heading>What he would ask you next time</Heading>
              <Bullets items={analysis.profile?.claims_to_prepare ?? []} />
              {(analysis.profile?.gaps_shown ?? []).length > 0 && (
                <>
                  <p className="m-0 mt-2 text-[16px] font-bold">Where your answers were thin</p>
                  <Bullets items={analysis.profile.gaps_shown} />
                </>
              )}
            </section>

            <section className="flex flex-col gap-3">
              <Heading>Before your next interview</Heading>
              <Bullets items={analysis.next_steps ?? []} />
            </section>

            <section className="px-5 py-4" style={{ background: "#F3EEDF" }}>
              <p className="m-0 text-[17px] italic leading-[1.6]">{analysis.officer_note}</p>
              <p className="m-0 mt-2 text-[14px]" style={{ fontFamily: ROOM.typed, color: ROOM.inkMuted }}>— {officerName}</p>
            </section>

            <section className="flex flex-col gap-3">
              <button
                type="button"
                aria-expanded={showRecord}
                onClick={() => setShowRecord((v) => !v)}
                className="self-start text-[16px] underline underline-offset-4"
                style={{ color: ROOM.ink }}
              >
                {showRecord ? "Hide the record of the interview" : "Read the record of the interview"}
              </button>
              {showRecord && (
                <ol className="m-0 flex list-none flex-col gap-4 p-0 text-[14px] leading-[1.6]" style={{ fontFamily: ROOM.typed }}>
                  {turns.map((t, i) => (
                    <li key={i} className="flex flex-col gap-2">
                      <span><strong>IO:</strong> {t.question}</span>
                      <span className="border-l-2 pl-[14px]" style={{ borderColor: ROOM.rule }}><strong>Candidate:</strong> {t.answer}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-5">{actions}</div>
      </div>
    </div>
  );
}
