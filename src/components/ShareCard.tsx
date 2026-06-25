import React from "react";

export type ShareTestType = "wat_full" | "srt_full" | "wat_practice" | "srt_practice";

type Props = {
  testType: ShareTestType;
  compositeScore: number;
  olqScores: Record<string, number>;
  date: string;
};

const BG = "#0A0E0A";
const SURFACE = "#1A2218";
const GOLD = "#C9A84C";
const FG = "#E8EDE6";
const MUTED = "#8A9A84";
const SERIF = "'Playfair Display', Georgia, serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

function getHeadline(score: number, testType: string): string {
  const label = testType.includes("wat") ? "WAT" : "SRT";
  if (score >= 75) return "My OLQ profile, mapped.";
  if (score >= 50) return "Know where you stand.";
  return `I just completed ${label}.`;
}

function getTestLabel(testType: string): string {
  switch (testType) {
    case "wat_full": return "WAT FULL SIMULATION";
    case "srt_full": return "SRT FULL SIMULATION";
    case "wat_practice": return "WAT PRACTICE";
    case "srt_practice": return "SRT PRACTICE";
    default: return testType.toUpperCase();
  }
}

export const ShareCard = React.forwardRef<HTMLDivElement, Props>(
  ({ testType, compositeScore, olqScores, date }, ref) => {
    const topOlqs = Object.entries(olqScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const headline = getHeadline(compositeScore, testType);
    const testLabel = getTestLabel(testType);

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1080,
          background: BG,
          border: "0.5px solid rgba(201,168,76,0.22)",
          padding: "60px",
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* Grid texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(201,168,76,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,.025) 1px,transparent 1px)",
            backgroundSize: "32px 32px",
            pointerEvents: "none",
          }}
        />

        {/* Corner marks */}
        <div style={{ position: "absolute", top: 20, left: 20, width: 18, height: 18, borderTop: "1px solid rgba(201,168,76,.4)", borderLeft: "1px solid rgba(201,168,76,.4)" }} />
        <div style={{ position: "absolute", top: 20, right: 20, width: 18, height: 18, borderTop: "1px solid rgba(201,168,76,.4)", borderRight: "1px solid rgba(201,168,76,.4)" }} />
        <div style={{ position: "absolute", bottom: 20, left: 20, width: 18, height: 18, borderBottom: "1px solid rgba(201,168,76,.4)", borderLeft: "1px solid rgba(201,168,76,.4)" }} />
        <div style={{ position: "absolute", bottom: 20, right: 20, width: 18, height: 18, borderBottom: "1px solid rgba(201,168,76,.4)", borderRight: "1px solid rgba(201,168,76,.4)" }} />

        {/* Content */}
        <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>

          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
            <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase" }}>
              <span style={{ color: GOLD }}>Forge</span>
              <span style={{ color: "rgba(232,237,230,0.55)" }}>SSB</span>
            </span>
          </div>

          {/* Meta line */}
          <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: MUTED, margin: "0 0 14px 0" }}>
            SSB PREP · {testLabel} · {date}
          </p>

          {/* Headline */}
          <h2 style={{ fontFamily: SERIF, fontSize: 58, fontWeight: 700, color: FG, lineHeight: 1.1, margin: "0 0 28px 0" }}>
            {headline}
          </h2>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(201,168,76,.2)", marginBottom: 32 }} />

          {/* OLQ Profile block */}
          <div
            style={{
              background: SURFACE,
              border: "0.5px solid rgba(201,168,76,.18)",
              padding: "28px 32px",
              marginBottom: 28,
            }}
          >
            <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: MUTED, margin: "0 0 24px 0" }}>
              OLQ Profile · Top {topOlqs.length > 0 ? topOlqs.length : "—"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              {topOlqs.length > 0 ? (
                topOlqs.map(([name, score]) => (
                  <div key={name}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontFamily: MONO, fontSize: 13, color: FG, letterSpacing: "0.03em" }}>{name}</span>
                      <span style={{ fontFamily: MONO, fontSize: 13, color: GOLD, fontWeight: 700 }}>{score}</span>
                    </div>
                    <div style={{ height: 4, background: "rgba(201,168,76,0.12)", borderRadius: 2 }}>
                      <div
                        style={{
                          height: 4,
                          background: GOLD,
                          width: `${Math.min(score, 100)}%`,
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED, margin: 0 }}>No OLQ data available</p>
              )}
            </div>
          </div>

          {/* Composite score */}
          <div style={{ marginBottom: 0 }}>
            <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: MUTED, margin: "0 0 12px 0" }}>
              Composite OLQ Score
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <span style={{ fontFamily: SERIF, fontSize: 116, fontWeight: 700, color: GOLD, lineHeight: 1 }}>
                {compositeScore}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 22, color: MUTED }}>/ 100</span>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: "auto", paddingTop: 24, borderTop: "0.5px solid rgba(201,168,76,.12)" }}>
            <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(138,154,132,0.6)", margin: 0 }}>
              forgessb.com — practice under real SSB conditions
            </p>
          </div>
        </div>
      </div>
    );
  }
);

ShareCard.displayName = "ShareCard";
