import { Link } from "@tanstack/react-router";

export function LockedTab({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <div className="mb-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold">{title}</p>
        <h2 className="mt-1.5 font-serif text-[28px] font-bold text-foreground">Unlock with the 30-Day Journey</h2>
      </div>
      <div className="relative overflow-hidden border border-gold/40 bg-surface-1 p-7">
        <div className="pointer-events-none absolute inset-0 opacity-[0.35]" style={{ filter: "blur(1px)" }}>
          <div className="h-3 w-2/3 bg-border" />
          <div className="mt-4 h-3 w-1/2 bg-border" />
          <div className="mt-6 h-24 w-full bg-border" />
        </div>
        <div className="relative flex flex-col items-start gap-4">
          <span className="inline-flex items-center gap-2 border border-gold px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-gold">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Journey only
          </span>
          <p className="max-w-[52ch] text-sm leading-relaxed text-muted-foreground">{body}</p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 bg-gold px-6 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-[#0A0E0A] no-underline"
          >
            Start the 30-Day Journey · ₹300 →
          </Link>
        </div>
      </div>
    </div>
  );
}
