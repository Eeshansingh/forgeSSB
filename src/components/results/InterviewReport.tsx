import { OLQS, ratingFromScore, AVG_ASPIRANT_OLQ_SCORE } from "@/lib/wat-data";
import { OlqRadar } from "@/components/OlqRadar";
import type { InterviewAnalysis } from "@/lib/interview-anthropic";

const SHORT: Record<string, string> = {
  "Effective Intelligence": "Eff. Intel",
  "Reasoning Ability": "Reasoning",
  "Organising Ability": "Organising",
  "Power of Expression": "Expression",
  "Social Adaptability": "Adaptability",
  Cooperation: "Coop.",
  "Sense of Responsibility": "Responsib.",
  Initiative: "Initiative",
  "Self Confidence": "Self Conf",
  "Speed of Decision": "Decision",
  "Ability to Influence": "Influence",
  Liveliness: "Liveliness",
  Determination: "Determ.",
  Courage: "Courage",
  Stamina: "Stamina",
};

function Label({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold">{children}</p>;
}

function List({ items }: { items: string[] }) {
  if (!items?.length) return <p className="mt-2 text-sm text-muted-foreground">Nothing noted.</p>;
  return (
    <ul className="mt-2 space-y-2 text-sm leading-relaxed text-foreground/85">
      {items.map((t, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-2 h-1 w-1 shrink-0 bg-gold" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function InterviewReport({
  analysis,
  isSignedIn,
  onSignIn,
  children,
}: {
  analysis: InterviewAnalysis;
  isSignedIn: boolean;
  onSignIn: () => void;
  children?: React.ReactNode;
}) {
  const entries = OLQS.map((name) => ({ name, score: analysis.olq_scores?.[name] ?? 0 }));
  const composite = Math.round(entries.reduce((s, o) => s + o.score, 0) / OLQS.length);
  const rating = ratingFromScore(composite);
  const sorted = [...entries].sort((a, b) => b.score - a.score);
  const top = sorted.slice(0, 3);
  const weakest = sorted.slice(-3).reverse();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">Mock Interview · Complete</p>
      <h1 className="mt-3 font-serif text-4xl text-foreground">Your interview read</h1>

      <section className="mt-8 border border-border bg-surface-1/60 p-6">
        <div className="flex items-end gap-3">
          <span className="font-serif text-6xl text-foreground">{composite}</span>
          <span className="pb-2 font-mono text-xs text-muted-foreground">/ 100</span>
          <span className={`pb-2 font-mono text-xs uppercase tracking-[0.2em] ${rating.tone}`}>{rating.label}</span>
        </div>
        <p className="mt-4 text-base leading-relaxed text-foreground/90">{analysis.summary}</p>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          This was a short introductory session. Treat the scores as a first picture, not a verdict, and not a
          prediction of a real board's decision.
        </p>
      </section>

      <section className="mt-6 border border-border bg-surface-1/60 p-6">
        <Label>Quality profile</Label>
        <div className="mx-auto mt-4 max-w-sm">
          <OlqRadar
            olqs={entries.map((o) => ({ name: o.name, short: SHORT[o.name] ?? o.name, score: o.score }))}
            avgScore={AVG_ASPIRANT_OLQ_SCORE}
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Showed most</p>
            <p className="mt-1 text-sm text-foreground/90">{top.map((o) => `${o.name} ${o.score}`).join(" · ")}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Showed least</p>
            <p className="mt-1 text-sm text-foreground/90">{weakest.map((o) => `${o.name} ${o.score}`).join(" · ")}</p>
          </div>
        </div>
      </section>

      <section className="mt-6 border border-border bg-surface-1/60 p-6">
        <Label>What the officer learned about you</Label>
        <p className="mt-3 text-sm leading-relaxed text-foreground/90">{analysis.profile?.background}</p>
        <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Claims an officer could probe next
        </p>
        <List items={analysis.profile?.claims_to_prepare ?? []} />
        <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Where answers were thin</p>
        <List items={analysis.profile?.gaps_shown ?? []} />
      </section>

      <section className="mt-6 border border-border bg-surface-1/60 p-6">
        <Label>What worked</Label>
        <div className="mt-3 space-y-4">
          {(analysis.strong_moments ?? []).map((m, i) => (
            <div key={i} className="border-l-2 border-gold/60 pl-4">
              <p className="font-serif text-base italic text-foreground">“{m.quote}”</p>
              <p className="mt-1 text-sm text-foreground/80">{m.read}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 border border-border bg-surface-1/60 p-6">
        <Label>What an officer would question</Label>
        <div className="mt-3 space-y-6">
          {(analysis.weak_moments ?? []).map((m, i) => (
            <div key={i}>
              <p className="font-serif text-base italic text-foreground">“{m.quote}”</p>
              <p className="mt-1 text-sm text-foreground/80">{m.issue}</p>
              <p className="mt-2 border border-gold/30 bg-gold/5 p-3 text-sm leading-relaxed text-foreground/90">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">Stronger: </span>
                {m.stronger}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 border border-border bg-surface-1/60 p-6">
        <Label>Before your next interview</Label>
        <List items={analysis.next_steps ?? []} />
        <p className="mt-6 text-sm leading-relaxed text-foreground/85">{analysis.officer_note}</p>
      </section>

      {!isSignedIn && (
        <section className="mt-6 border border-gold/40 bg-surface-1/70 p-6">
          <Label>Save this report</Label>
          <p className="mt-3 text-sm leading-relaxed text-foreground/85">
            Sign in to keep this report on your account and see how your next interview compares.
          </p>
          <button
            type="button"
            onClick={onSignIn}
            className="mt-5 inline-flex items-center justify-center border border-gold bg-gold/10 px-6 py-3 font-mono text-xs uppercase tracking-[0.22em] text-gold transition-all hover:bg-gold hover:text-primary-foreground"
          >
            Sign In With Google
          </button>
        </section>
      )}

      {children}
    </div>
  );
}
