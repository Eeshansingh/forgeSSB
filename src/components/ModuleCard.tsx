import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface ModuleCardProps {
  name: string;
  abbreviation?: string;
  description: string;
  icon: ReactNode;
  to?: string;
  locked?: boolean;
  bullets?: string[];
  ctaLabel?: string;
}

export function ModuleCard({ name, abbreviation, description, icon, to, locked, bullets, ctaLabel }: ModuleCardProps) {
  const cta = ctaLabel ?? (locked ? "Learn more →" : "Begin Practice →");

  const content = (
    <div
      className={
        locked
          ? "flex h-full flex-col gap-4 bg-[#0d1209] p-6 sm:p-7"
          : "flex h-full flex-col gap-4 bg-surface-1 p-6 transition-colors duration-200 hover:bg-surface-2 sm:p-7"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center border ${
            locked ? "border-white/5 text-muted-foreground" : "border-border text-gold"
          }`}
        >
          {icon}
        </div>
        {locked ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border border-gold px-2 py-1 font-mono text-[8px] uppercase tracking-[0.16em] text-gold">
            <span className="h-1 w-1 rounded-full bg-gold" />
            Coming Soon
          </span>
        ) : (
          abbreviation && (
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-gold/60">{abbreviation}</span>
          )
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        <h3 className={`font-serif text-xl leading-tight ${locked ? "text-muted-foreground" : "text-foreground"}`}>{name}</h3>
        <p className={`text-sm leading-relaxed ${locked ? "text-muted-foreground/55" : "text-muted-foreground"}`}>{description}</p>
      </div>

      {bullets && bullets.length > 0 && (
        <div className={`flex flex-col gap-1.5 border-t pt-3.5 ${locked ? "border-white/[0.04]" : "border-border/60"}`}>
          {bullets.map((b) => (
            <p key={b} className="flex items-start gap-2 text-xs leading-relaxed">
              <span
                className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${locked ? "border border-gold/30 bg-transparent" : "bg-gold"}`}
              />
              <span className={locked ? "text-muted-foreground/50" : "text-muted-foreground"}>{b}</span>
            </p>
          ))}
        </div>
      )}

      <p className={`font-mono text-[10px] uppercase tracking-[0.14em] ${locked ? "text-gold/35" : "text-gold"}`}>{cta}</p>
    </div>
  );

  if (!to) return content;
  return (
    <Link to={to} className="no-underline">
      {content}
    </Link>
  );
}
