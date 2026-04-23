import { Outlet, Link, createRootRoute, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopNav } from "../components/TopNav";
import { Footer } from "../components/Footer";
import { supabase, signInWithGoogle } from "@/lib/supabase";

declare global {
  interface Window {
    forgeSSBAuth?: {
      user: unknown;
      signInWithGoogle: typeof signInWithGoogle;
    };
  }
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-gold">Position not held</p>
        <h1 className="mt-4 font-serif text-7xl text-foreground">404</h1>
        <h2 className="mt-2 font-serif text-xl text-foreground">Coordinate not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you requested is not on the map. Return to base.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 border border-gold px-5 py-2.5 text-sm font-medium uppercase tracking-[0.18em] text-gold transition-all hover:bg-gold hover:text-primary-foreground"
          >
            Command Centre →
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  const location = useLocation();
  const [user, setUser] = useState<unknown>(null);
  const isTestActive =
    location.pathname.startsWith("/tests/wat/full/test") ||
    location.pathname.startsWith("/tests/wat/practice") ||
    location.pathname.startsWith("/tests/srt/full/test") ||
    location.pathname.startsWith("/tests/srt/practice");

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) {
        setUser(data.user ?? null);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    window.forgeSSBAuth = { user, signInWithGoogle };
  }, [user]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {!isTestActive && <TopNav />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!isTestActive && <Footer />}
    </div>
  );
}