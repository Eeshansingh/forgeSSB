import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/leaderboard/global")({
  head: () => ({
    meta: [{ title: "Global Leaderboard — ForgeSSB" }],
  }),
  component: GlobalLeaderboardPage,
});

function GlobalLeaderboardPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">Rankings</p>
      <h1 className="mt-2 font-serif text-4xl text-foreground sm:text-5xl">Leaderboard</h1>
      <p className="mt-3 text-base text-muted-foreground">
        Top candidates ranked by best composite OLQ score from full simulations.
      </p>

      {/* Tab bar */}
      <div className="mt-10 border-b border-border">
        <div className="flex">
          <TabLink to="/leaderboard/global" label="Global" />
          <TabLink to="/leaderboard/wat" label="WAT" />
          <TabLink to="/leaderboard/srt" label="SRT" />
        </div>
      </div>

      <div className="mt-16 flex flex-col items-center gap-4 py-16 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">Coming Soon</p>
        <p className="font-serif text-2xl text-foreground">Global rankings across all modules</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Once TAT and GTO are live, candidates will be ranked on a combined cross-module OLQ composite.
        </p>
        <Link
          to="/leaderboard/wat"
          className="mt-4 border border-gold bg-gold/10 px-6 py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-gold transition-all hover:bg-gold hover:text-primary-foreground"
        >
          View WAT Rankings →
        </Link>
      </div>
    </section>
  );
}

function TabLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to as "/leaderboard/global"}
      className="relative px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
      activeProps={{
        className:
          "relative px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-gold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gold",
      }}
    >
      {label}
    </Link>
  );
}
