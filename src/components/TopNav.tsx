import { Link } from "@tanstack/react-router";
import { StarMark } from "./StarMark";

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="group flex items-center gap-3">
          <span className="text-gold transition-transform group-hover:rotate-[8deg]">
            <StarMark size={22} />
          </span>
          <span className="font-serif text-xl tracking-tight">
            <span className="text-gold">Forge</span>
            <span className="text-foreground">SSB</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/tests"
            className="px-4 py-2 font-medium text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Tests
          </Link>
          <button
            type="button"
            className="ml-2 inline-flex items-center gap-2 border border-border px-4 py-2 font-medium text-foreground/90 transition-all hover:border-gold hover:text-gold"
          >
            <span className="h-1.5 w-1.5 bg-gold pulse-gold" />
            My Journey
          </button>
        </nav>
      </div>
    </header>
  );
}
