import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, recordPurchase, signInWithGoogle } from "@/lib/supabase";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [{ title: "Plans — ForgeSSB" }],
  }),
  component: PricingPage,
});

// ── CSS (same design system as the rest of the journey) ───────────────────────

const CSS = `
.ssb-pr {
  --bg: #0A0E0A;
  --s1: #1A2218;
  --s2: #212b1f;
  --fg: #E8EDE6;
  --muted: #8A9A84;
  --gold: #C9A84C;
  --gold-dim: rgba(201,168,76,0.10);
  --gold-b: rgba(201,168,76,0.28);
  --border: rgba(201,168,76,0.14);
  --border-2: rgba(232,237,230,0.055);
  --serif: 'Playfair Display',Georgia,serif;
  --mono: 'JetBrains Mono',monospace;
  background: var(--bg);
  min-height: 100vh;
  color: var(--fg);
}
.ssb-pr .pr-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(10,14,10,.92);
  backdrop-filter: blur(12px);
  border-bottom: 0.5px solid var(--border);
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
}
.ssb-pr .wm {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--serif);
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  color: inherit;
  text-decoration: none;
}
.ssb-pr .wm-g { color: var(--gold); }
.ssb-pr .label {
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: 0.30em;
  text-transform: uppercase;
  color: var(--muted);
}
.ssb-pr .btn-g {
  background: none;
  border: 0.5px solid var(--border);
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--muted);
  padding: 8px 14px;
  cursor: pointer;
}
.ssb-pr .btn-g:hover { color: var(--fg); }
.ssb-pr .btn-pay {
  width: 100%;
  padding: 15px 24px;
  border: none;
  background: var(--gold);
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.20em;
  text-transform: uppercase;
  color: var(--bg);
  cursor: pointer;
  font-weight: 500;
  transition: opacity .15s;
}
.ssb-pr .btn-pay:hover { opacity: 0.88; }
.ssb-pr .btn-pay:disabled { opacity: 0.4; cursor: not-allowed; }
.ssb-pr .btn-s {
  width: 100%;
  padding: 13px 24px;
  border: 0.5px solid var(--border);
  background: none;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
  cursor: pointer;
  transition: border-color .15s, color .15s;
}
.ssb-pr .btn-s:hover { border-color: rgba(201,168,76,.4); color: var(--fg); }
.ssb-pr .tier {
  margin: 0 20px;
  border: 1px solid var(--border);
  background: var(--s1);
}
.ssb-pr .tier-featured {
  border-color: var(--gold);
  position: relative;
}
.ssb-pr .tier-featured::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--gold);
}
.ssb-pr .feature-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 13px;
  line-height: 1.55;
}
.ssb-pr .feature-dot { color: var(--gold); flex-shrink: 0; margin-top: 1px; }
`;

// ── Razorpay loader ────────────────────────────────────────────────────────────

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as { Razorpay?: unknown }).Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ── Types ──────────────────────────────────────────────────────────────────────

type Plan = "practice" | "journey";
type PayState = "idle" | "loading" | "success" | "error";

// ── Component ──────────────────────────────────────────────────────────────────

function PricingPage() {
  const navigate = useNavigate();
  const [userId, setUserId]       = useState<string | null>(null);
  const [payState, setPayState]   = useState<PayState>("idle");
  const [activePlan, setActive]   = useState<Plan | null>(null);
  const [errorMsg, setErrorMsg]   = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  async function handleSelect(plan: Plan) {
    setErrorMsg("");

    // Must be signed in first
    if (!userId) {
      await signInWithGoogle();
      return;
    }

    const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;
    if (!rzpKey) {
      // Dev fallback — write a mock active purchase directly
      setActive(plan);
      setPayState("loading");
      try {
        await recordPurchase({
          user_id: userId,
          plan,
          amount_paise: plan === "journey" ? 30000 : 10000,
          razorpay_order_id: `dev_order_${Date.now()}`,
          razorpay_payment_id: `dev_pay_${Date.now()}`,
        });
        setPayState("success");
      } catch (err) {
        console.error(err);
        setPayState("error");
        setErrorMsg("Purchase recording failed. Please try again.");
      }
      return;
    }

    setActive(plan);
    setPayState("loading");

    // Step 1: Create order server-side (locks in amount, prevents tampering)
    const { data: orderData, error: orderErr } = await supabase.functions.invoke("create-order", {
      body: { plan },
    });
    if (orderErr || !(orderData as { order_id?: string })?.order_id) {
      setPayState("error");
      setErrorMsg("Could not initialise payment. Please try again.");
      return;
    }
    const { order_id, amount } = orderData as { order_id: string; amount: number };

    // Step 2: Load Razorpay SDK
    const loaded = await loadRazorpay();
    if (!loaded) {
      setPayState("error");
      setErrorMsg("Payment service unavailable. Check your connection and try again.");
      return;
    }

    const planName = plan === "journey" ? "30-Day Journey" : "Practice Pass";

    const options = {
      key: rzpKey,
      amount,
      currency: "INR",
      order_id,
      name: "ForgeSSB",
      description: planName,
      handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
        // Step 3: Verify HMAC signature server-side, then activate purchase
        const { error: verifyErr } = await supabase.functions.invoke("verify-payment", {
          body: {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            plan,
          },
        });
        if (verifyErr) {
          setPayState("error");
          setErrorMsg("Payment received but activation failed. Contact support with your payment ID: " + response.razorpay_payment_id);
          return;
        }
        setPayState("success");
      },
      modal: {
        ondismiss: () => {
          setPayState("idle");
          setActive(null);
        },
      },
      prefill: {},
      theme: { color: "#C9A84C" },
    };

    setPayState("idle"); // Razorpay modal is open; state resolves in handler
    const rzp = new (window as { Razorpay: new (o: typeof options) => { open(): void } }).Razorpay(options);
    rzp.open();
  }

  async function handleSuccess() {
    if (activePlan === "journey") {
      void navigate({ to: "/journey/onboarding" });
    } else {
      void navigate({ to: "/tests" });
    }
  }

  const goHome = () => void navigate({ to: "/" });

  if (payState === "success") {
    return (
      <>
        <style>{CSS}</style>
        <div className="ssb-pr" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "40px 24px", textAlign: "center", gap: "24px" }}>
          <div style={{ width: "64px", height: "64px", border: "1px solid var(--gold-b)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          </div>
          <div>
            <p className="label" style={{ color: "var(--gold)", marginBottom: "8px" }}>Access Granted</p>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: "28px", fontWeight: 700, color: "var(--fg)", lineHeight: 1.1 }}>
              {activePlan === "journey" ? "Your 30-day path begins now." : "Unlimited practice unlocked."}
            </h2>
          </div>
          <button className="btn-pay" type="button" onClick={handleSuccess} style={{ maxWidth: "320px" }}>
            {activePlan === "journey" ? "Begin Onboarding →" : "Go to Tests →"}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="ssb-pr">

        {/* Nav */}
        <nav className="pr-nav">
          <button className="wm" type="button" onClick={goHome}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
            </svg>
            <span><span className="wm-g">Forge</span>SSB</span>
          </button>
          <button className="btn-g" type="button" onClick={goHome}>← Back</button>
        </nav>

        {/* Header */}
        <div style={{ padding: "40px 24px 28px", borderBottom: "0.5px solid var(--border)" }}>
          <p className="label" style={{ marginBottom: "8px" }}>Plans</p>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "34px", fontWeight: 700, color: "var(--fg)", lineHeight: 1.05, letterSpacing: "-.02em", marginBottom: "10px" }}>
            Know what the Board<br />sees. At any scale.
          </h1>
          <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.7 }}>
            Start free. Upgrade when you're serious.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "24px 0 40px" }}>

          {/* ── Free tier ── */}
          <div className="tier">
            <div style={{ padding: "22px 22px 6px" }}>
              <p className="label" style={{ marginBottom: "8px" }}>Free</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span style={{ fontFamily: "var(--serif)", fontSize: "36px", fontWeight: 700, color: "var(--fg)" }}>₹0</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", letterSpacing: ".12em" }}>forever</span>
              </div>
            </div>
            <div style={{ padding: "16px 22px", borderTop: "0.5px solid var(--border-2)", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="feature-row"><span className="feature-dot">·</span><span style={{ color: "var(--muted)" }}>3 full assessments (WAT or SRT)</span></div>
              <div className="feature-row"><span className="feature-dot">·</span><span style={{ color: "var(--muted)" }}>Full AI OLQ report on each</span></div>
              <div className="feature-row"><span className="feature-dot">·</span><span style={{ color: "var(--muted)" }}>Leaderboard rank</span></div>
            </div>
            <div style={{ padding: "16px 22px 22px" }}>
              <button className="btn-s" type="button" onClick={() => void navigate({ to: "/tests" })}>
                Take a free test →
              </button>
            </div>
          </div>

          {/* ── Practice Pass ── */}
          <div className="tier" style={{ margin: "0 20px" }}>
            <div style={{ padding: "22px 22px 6px" }}>
              <p className="label" style={{ marginBottom: "8px" }}>Practice Pass</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span style={{ fontFamily: "var(--serif)", fontSize: "36px", fontWeight: 700, color: "var(--fg)" }}>₹100</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", letterSpacing: ".12em" }}>one-time</span>
              </div>
            </div>
            <div style={{ padding: "16px 22px", borderTop: "0.5px solid var(--border-2)", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="feature-row"><span className="feature-dot">·</span><span style={{ color: "var(--fg)" }}>Unlimited WAT + SRT assessments</span></div>
              <div className="feature-row"><span className="feature-dot">·</span><span style={{ color: "var(--fg)" }}>All 15 OLQ breakdown + assessor notes</span></div>
              <div className="feature-row"><span className="feature-dot">·</span><span style={{ color: "var(--fg)" }}>Leaderboard tracking + history</span></div>
            </div>
            <div style={{ padding: "16px 22px 22px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                className="btn-pay"
                type="button"
                style={{ background: "var(--s2)", color: "var(--fg)", border: "0.5px solid var(--border)" }}
                disabled={payState === "loading" && activePlan === "practice"}
                onClick={() => void handleSelect("practice")}
              >
                {payState === "loading" && activePlan === "practice" ? "Opening payment…" : userId ? "Get Practice Pass →" : "Sign in to purchase →"}
              </button>
            </div>
          </div>

          {/* ── Journey (featured) ── */}
          <div className="tier tier-featured">
            <div style={{ padding: "8px 22px 0", display: "flex", justifyContent: "flex-end" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: "8px", letterSpacing: ".22em", textTransform: "uppercase", background: "var(--gold)", color: "var(--bg)", padding: "3px 10px" }}>
                Recommended
              </span>
            </div>
            <div style={{ padding: "14px 22px 6px" }}>
              <p className="label" style={{ color: "var(--gold)", marginBottom: "8px" }}>30-Day Journey</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--serif)", fontSize: "36px", fontWeight: 700, color: "var(--gold)" }}>₹300</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", letterSpacing: ".12em" }}>one-time</span>
              </div>
              <p style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)", letterSpacing: ".12em", marginTop: "4px" }}>
                Includes everything in Practice Pass
              </p>
            </div>
            <div style={{ padding: "16px 22px", borderTop: "0.5px solid var(--gold-b)", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="feature-row"><span className="feature-dot">·</span><span style={{ color: "var(--fg)" }}>Unlimited WAT + SRT assessments</span></div>
              <div className="feature-row"><span className="feature-dot">·</span><span style={{ color: "var(--fg)" }}>Full 30-day structured programme</span></div>
              <div className="feature-row"><span className="feature-dot">·</span><span style={{ color: "var(--fg)" }}>AI calibration on Day 1 — all 15 OLQs mapped</span></div>
              <div className="feature-row"><span className="feature-dot">·</span><span style={{ color: "var(--fg)" }}>Daily WAT drills, reflection, missions</span></div>
              <div className="feature-row"><span className="feature-dot">·</span><span style={{ color: "var(--fg)" }}>Day 30 before/after OLQ reveal</span></div>
            </div>
            <div style={{ padding: "16px 22px 22px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                className="btn-pay"
                type="button"
                disabled={payState === "loading" && activePlan === "journey"}
                onClick={() => void handleSelect("journey")}
              >
                {payState === "loading" && activePlan === "journey" ? "Opening payment…" : userId ? "Start 30-Day Journey →" : "Sign in to purchase →"}
              </button>
              <p style={{ fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: ".15em", textTransform: "uppercase", color: "var(--muted)", textAlign: "center" }}>
                One payment · Lifetime access · No hidden fees
              </p>
            </div>
          </div>

          {/* Error */}
          {payState === "error" && (
            <div style={{ margin: "0 20px", padding: "14px 16px", border: "0.5px solid rgba(192,57,43,.4)", background: "rgba(192,57,43,.06)" }}>
              <p style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "#c0392b" }}>{errorMsg}</p>
            </div>
          )}

          {/* FAQ */}
          <div style={{ margin: "20px 20px 0", display: "flex", flexDirection: "column", gap: "0" }}>
            <p className="label" style={{ marginBottom: "16px" }}>Common questions</p>
            {[
              ["Is this a subscription?", "No. Both paid plans are one-time payments. Pay once, access forever."],
              ["What happens after 30 days?", "Your journey data and OLQ history remain. You can re-run the 30-day course anytime."],
              ["Can I upgrade from Practice to Journey?", "Yes — contact us and we'll apply a ₹200 credit toward the Journey plan."],
            ].map(([q, a]) => (
              <div key={q} style={{ padding: "16px 0", borderTop: "0.5px solid var(--border-2)" }}>
                <p style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--fg)", marginBottom: "6px" }}>{q}</p>
                <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.65 }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
