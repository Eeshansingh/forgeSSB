import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getTestAttempts, recordTestAttempt, signInWithGoogle, supabase } from "@/lib/supabase";

const ADMIN_EMAILS = ["s.eeshan3333@gmail.com", "ridhimanegiflip@gmail.com"];

export const Route = createFileRoute("/tests/wat/full/setup")({
  head: () => ({
    meta: [{ title: "WAT Setup — ForgeSSB" }],
  }),
  component: SetupPage,
});

function SetupPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [attemptLimitReached, setAttemptLimitReached] = useState(false);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState<string>("your account");

  function getAnonymousId() {
    const key = "forgessb_anonymous_id";
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const generated =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, generated);
    return generated;
  }

  async function commence() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && ADMIN_EMAILS.includes(user.email ?? "")) {
      const attemptId = await recordTestAttempt(
        user.id,
        undefined,
        "wat_full",
        undefined,
        undefined,
        undefined,
        user.email ?? undefined
      );
      if (attemptId) sessionStorage.setItem("forgessb_current_attempt_id", attemptId);
      sessionStorage.setItem("forgessb_attempt_in_progress", "true");
      sessionStorage.setItem("wat_word_count", "60");
      navigate({ to: "/tests/wat/full/test" });
      return;
    }

    if (!user) {
      const attemptCount = Number(localStorage.getItem("forgessb_attempt_count") ?? "0");
      if (attemptCount >= 1) {
        setRequiresLogin(true);
        return;
      }
      localStorage.setItem("forgessb_attempt_count", "1");
      sessionStorage.setItem("forgessb_attempt_in_progress", "true");
      const anonId = getAnonymousId();
      const attemptId = await recordTestAttempt(undefined, anonId, "wat_full");
      if (attemptId) sessionStorage.setItem("forgessb_current_attempt_id", attemptId);
    } else {
      const count = await getTestAttempts(user.id);
      if (count >= 3) {
        setAttemptLimitReached(true);
        return;
      }
      const attemptId = await recordTestAttempt(user?.id, undefined, "wat_full", undefined, undefined, undefined, user?.email ?? undefined);
      if (attemptId) sessionStorage.setItem("forgessb_current_attempt_id", attemptId);
      sessionStorage.setItem("forgessb_attempt_in_progress", "true");
    }

    sessionStorage.setItem("wat_word_count", "60");
    navigate({ to: "/tests/wat/full/test" });
  }

  useEffect(() => {
    const run = async () => {
      try {
        setWaitlistJoined(localStorage.getItem("forgessb_waitlist") === "true");
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.email) {
          setWaitlistEmail(user.email);
        }
        if (!user) {
          const attemptCount = Number(localStorage.getItem("forgessb_attempt_count") ?? "0");
          if (attemptCount >= 1) {
            setRequiresLogin(true);
          }
          return;
        }
        if (ADMIN_EMAILS.includes(user.email ?? "")) {
          return;
        }

        const count = await getTestAttempts(user.id);
        if (count >= 3) {
          setAttemptLimitReached(true);
        }
      } finally {
        setChecking(false);
      }
    };
    void run();
  }, []);

  async function notifyWaitlist() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id || !user?.email) return;
    setWaitlistLoading(true);
    try {
      await supabase.from("waitlist").insert({ user_id: user.id, email: user.email });
      localStorage.setItem("forgessb_waitlist", "true");
      setWaitlistJoined(true);
      setWaitlistEmail(user.email);
    } finally {
      setWaitlistLoading(false);
    }
  }

  if (checking) {
    return (
      <section className="relative">
        <div className="absolute inset-0 grid-texture-fine opacity-60" aria-hidden="true" />
        <div className="relative mx-auto max-w-2xl px-6 py-20 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">Verifying Access</p>
          <p className="mt-4 text-foreground/80">Stand by while we validate your assessment allocation.</p>
        </div>
      </section>
    );
  }

  if (requiresLogin) {
    return (
      <section className="relative">
        <div className="absolute inset-0 grid-texture-fine opacity-60" aria-hidden="true" />
        <div className="relative mx-auto max-w-2xl px-6 py-20">
          <div className="border border-gold/40 bg-surface-1/70 p-8 sm:p-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">Account Required</p>
            <h1 className="mt-4 font-serif text-3xl text-foreground sm:text-4xl">Save your progress</h1>
            <p className="mt-6 text-base leading-relaxed text-foreground/85">
              Sign in to track your OLQ profile across sessions and pick up where you left off.
            </p>
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="mt-8 inline-flex items-center justify-center border border-gold bg-gold/10 px-7 py-3.5 font-mono text-xs uppercase tracking-[0.22em] text-gold transition-all hover:bg-gold hover:text-primary-foreground"
            >
              Sign In With Google
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (attemptLimitReached) {
    const displayEmail = waitlistEmail;
    return (
      <section className="relative">
        <div className="absolute inset-0 grid-texture-fine opacity-60" aria-hidden="true" />
        <div className="relative mx-auto max-w-2xl px-6 py-20">
          <div className="border border-gold/40 bg-surface-1/70 p-8 sm:p-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">Free Assessments Used</p>
            <h1 className="mt-4 font-serif text-3xl text-foreground sm:text-4xl">You have completed your 3 free assessments.</h1>
            <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-gold/80">
              Registered Account · {displayEmail}
            </p>
            {waitlistJoined ? (
              <p className="mt-6 text-base leading-relaxed text-foreground/85">
                You are on the list. We will be in touch at {displayEmail}.
              </p>
            ) : (
              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => void notifyWaitlist()}
                  disabled={waitlistLoading}
                  className="inline-flex items-center justify-center border border-gold bg-gold/10 px-7 py-3.5 font-mono text-xs uppercase tracking-[0.22em] text-gold transition-all hover:bg-gold hover:text-primary-foreground disabled:opacity-60"
                >
                  {waitlistLoading ? "Submitting..." : "Notify me"}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative">
      <div className="absolute inset-0 grid-texture-fine opacity-60" aria-hidden="true" />
      <div className="relative mx-auto max-w-2xl px-6 py-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">
          Full Simulation · Setup
        </p>
        <h1 className="mt-3 font-serif text-4xl text-foreground sm:text-5xl">
          Confirm Assessment Parameters
        </h1>
        <div className="mt-6 h-px w-20 bg-gold/50" />

        <p className="mt-8 text-base leading-relaxed text-foreground/80">
          This full simulation mirrors the standard SSB WAT format. The run is fixed at
          sixty stimulus words with fifteen minutes total duration.
        </p>

        <div className="mt-10 border border-gold/40 bg-surface-1/50 p-6 sm:p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Mission Profile
          </p>
          <p className="mt-2 font-serif text-3xl text-gold sm:text-4xl">60 words · 15 min</p>
          <p className="mt-4 text-sm leading-relaxed text-foreground/75">
            Once commenced, words will advance every 15 seconds. Complete all responses in
            sequence for final OLQ analysis.
          </p>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 border-t border-border pt-10">
          <button
            type="button"
            onClick={commence}
            className="inline-flex w-full items-center justify-center gap-3 border border-gold bg-gold/10 px-8 py-4 text-center text-sm font-medium uppercase tracking-[0.2em] text-gold transition-all hover:bg-gold hover:text-primary-foreground sm:w-auto"
          >
            Commence Assessment →
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/tests/wat/full/instructions" })}
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
          >
            ← Return to Briefing
          </button>
        </div>
      </div>
    </section>
  );
}