import { createFileRoute } from "@tanstack/react-router";
import { Brain, Image as ImageIcon, AlertTriangle } from "lucide-react";
import { ModuleCard } from "@/components/ModuleCard";

export const Route = createFileRoute("/tests/")({
  component: TestsPage,
});

function TestsPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-14 max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">
          Phase II · Psychology
        </p>
        <h1 className="mt-3 font-serif text-5xl text-foreground">Psychological Assessments</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          The psychologist's room measures temperament, decision-making and the shape of
          your spontaneous mind. Three instruments — one open, two on standby.
        </p>
      </div>

      <div className="grid gap-px bg-border md:grid-cols-3">
        <ModuleCard
          name="Word Association Test"
          abbreviation="WAT"
          description="One word. Fifteen seconds. Sixty rounds. Train spontaneity under load."
          icon={<Brain className="h-5 w-5" />}
          to="/tests/wat"
        />
        <ModuleCard
          name="Thematic Apperception Test"
          abbreviation="TAT"
          description="Construct narratives from ambiguous imagery. Reveal motivation and worldview."
          icon={<ImageIcon className="h-5 w-5" />}
          locked
        />
        <ModuleCard
          name="Situation Reaction Test"
          abbreviation="SRT"
          description="Sixty scenarios. Limited time. Demonstrate judgement and resolve."
          icon={<AlertTriangle className="h-5 w-5" />}
          locked
        />
      </div>
    </section>
  );
}