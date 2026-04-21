import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Lock } from "lucide-react";

interface ModuleCardProps {
  name: string;
  abbreviation?: string;
  description: string;
  icon: ReactNode;
  to?: string;
  locked?: boolean;
}

export function ModuleCard({ name, abbreviation, description, icon, to, locked }: ModuleCardProps) {
  const content = (
    <div
      className={[
        "group relative flex h-full flex-col gap-4 border border-border bg-surface-1 p-6 transition-all duration-200",
        locked
          ? "opacity-40"
          : "hover:border-gold hover:bg-surface-2 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-12px_rgba(201,168,76,0.25)]",
      ].join(" ")}
    >
      {locked && (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 border border-border bg-background/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          <Lock className="h-2.5 w-2.5" /> Coming Soon
        </span>
      )}

      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center border border-border text-gold">
          {icon}
        </div>
        {abbreviation && !locked && (
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold/70">
            {abbreviation}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <h3 className="font-serif text-xl leading-tight text-foreground">{name}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>

      {!locked && (
        <div className="flex items-center gap-2 pt-2 text-xs font-medium uppercase tracking-[0.18em] text-gold/80 transition-colors group-hover:text-gold">
          Enter Module
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </div>
      )}
    </div>
  );

  if (locked || !to) return content;
  return <Link to={to}>{content}</Link>;
}
