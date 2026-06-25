import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StarMark } from "./StarMark";
import { supabase, getUserPurchase } from "@/lib/supabase";

export function TopNav() {
  const navigate = useNavigate();
  const [userId, setUserId]         = useState<string | null>(null);
  const [hasPurchase, setHasPurchase] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = async (uid: string | null) => {
      if (!uid) { if (mounted) { setUserId(null); setHasPurchase(false); } return; }
      const plan = await getUserPurchase(uid);
      if (mounted) { setUserId(uid); setHasPurchase(plan === "journey"); }
    };
    supabase.auth.getUser().then(({ data }) => void check(data.user?.id ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void check(session?.user?.id ?? null);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  function handleJourneyClick() {
    if (!userId) {
      void navigate({ to: "/pricing" });
      return;
    }
    void navigate({ to: hasPurchase ? "/journey/dashboard" : "/pricing" });
  }

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

        <nav className="flex items-center gap-0.5 text-sm sm:gap-1">
          <Link
            to="/tests"
            className="px-2 py-2 font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-4"
            activeProps={{ className: "text-foreground" }}
          >
            Tests
          </Link>
          <Link
            to="/leaderboard/wat"
            className="px-2 py-2 font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-4"
            activeProps={{ className: "text-foreground" }}
          >
            <span className="hidden sm:inline">Leaderboard</span>
            <span className="sm:hidden">Ranks</span>
          </Link>
          <button
            type="button"
            onClick={handleJourneyClick}
            className="ml-1 inline-flex items-center gap-1.5 border border-border px-2 py-2 font-medium text-foreground/90 transition-all hover:border-gold hover:text-gold sm:ml-2 sm:gap-2 sm:px-4"
          >
            <span className="h-1.5 w-1.5 bg-gold pulse-gold" />
            <span className="hidden sm:inline">My Journey</span>
            <span className="sm:hidden">Journey</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
