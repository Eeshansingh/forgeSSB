import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/tests/interview/")({
  head: () => ({
    meta: [
      { title: "Personal Interview — Mock — ForgeSSB" },
      {
        name: "description",
        content:
          "A short mock of the SSB personal interview. An officer asks, follows up on your answers, and gives you a report scored on the 15 Officer Like Qualities.",
      },
    ],
  }),
  component: InterviewLanding,
});

const WHAT_TO_EXPECT = [
  { n: "01", label: "A bundle, then follow-ups", body: "Like the real thing, he asks a string of questions about your life in one go, then digs into what you actually said." },
  { n: "02", label: "No hints, no praise", body: "The officer stays neutral. You only find out how it went in the report at the end." },
  { n: "03", label: "No form needed", body: "You do not have to fill anything in first. The officer learns about you as you talk." },
];

function InterviewLanding() {
  return (
    <div>
      <div className="mx-auto max-w-4xl px-6 pt-6">
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
          Tests · <span className="text-gold">Personal Interview</span>
        </p>
      </div>

      <section className="mx-auto max-w-4xl px-6 py-16 text-center sm:py-20">
        <p className="mb-3.5 font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground">Interview · Mock</p>
        <h1 className="font-serif text-[38px] font-bold leading-[1.04] text-foreground sm:text-[58px]">
          Personal Interview
        </h1>
        <p className="mx-auto mt-6 max-w-[54ch] text-base leading-relaxed text-muted-foreground">
          In the real SSB, an interviewing officer talks to you one-on-one for 30 to 60 minutes, often built around your
          own life and your own claims. This is a five-minute mock of it: a bundle of questions about your life, then follow-ups on what you say. You can speak or type.
        </p>
        <div className="mt-10">
          <Link
            to="/tests/interview/mock"
            className="inline-flex items-center justify-center gap-2 border border-gold bg-gold/10 px-8 py-3.5 font-mono text-xs uppercase tracking-[0.22em] text-gold transition-all hover:bg-gold hover:text-primary-foreground"
          >
            Begin the free mock →
          </Link>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Free · No sign-in needed for your first one
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="grid gap-px bg-border md:grid-cols-3">
          {WHAT_TO_EXPECT.map((s) => (
            <div key={s.n} className="bg-surface-1 p-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold">{s.n}</p>
              <h3 className="mt-3 font-serif text-xl text-foreground">{s.label}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground/80">
          This is practice. The report shows how your answers read against the 15 Officer Like Qualities. It is not a
          prediction of a real board's decision.
        </p>
      </section>
    </div>
  );
}
