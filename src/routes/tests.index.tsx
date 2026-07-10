import { createFileRoute } from "@tanstack/react-router";
import { Brain, Image as ImageIcon, AlertTriangle } from "lucide-react";
import { ModuleCard } from "@/components/ModuleCard";

export const Route = createFileRoute("/tests/")({
  head: () => ({
    meta: [
      { title: "Psychology Tests — ForgeSSB" },
      {
        name: "description",
        content: "Psychological assessment modules: WAT, SRT and TAT. Train under real SSB conditions.",
      },
    ],
  }),
  component: TestsPage,
});

function TestsPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-12 max-w-2xl">
        <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-gold">Psychology</p>
        <h1 className="mt-3 font-serif text-5xl text-foreground">Psychology practice</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          The psychologist watches how you respond under pressure. Each test shows a different pattern. Two are
          open for practice now.
        </p>
      </div>

      <div className="grid gap-px bg-border md:grid-cols-3">
        <ModuleCard
          name="Word Association Test"
          abbreviation="WAT"
          description="One word. Fifteen seconds. Sixty rounds."
          icon={<Brain className="h-5 w-5" />}
          to="/tests/wat"
          bullets={["See which qualities to focus on", "Practice or full 60-word simulation"]}
        />
        <ModuleCard
          name="Situation Reaction Test"
          abbreviation="SRT"
          description="60 situations. 30 seconds each. How you react defines your profile."
          icon={<AlertTriangle className="h-5 w-5" />}
          to="/tests/srt"
          bullets={["See which qualities to focus on", "Practice or full 60-situation simulation"]}
        />
        <ModuleCard
          name="Thematic Apperception Test"
          abbreviation="TAT"
          description="You write 12 short stories. The psychologist reads each hero as you."
          icon={<ImageIcon className="h-5 w-5" />}
          to="/tests/tat"
          locked
          bullets={["30s view + 4 min write per picture", "Heaviest weight · Day 2 psych"]}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-b border-border py-3.5">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50">
          Also coming: GTO tasks, Personal Interview, Self Description
        </p>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-gold">TAT is coming next</span>
      </div>
    </section>
  );
}
