import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";

export type DashboardTab = "home" | "progress" | "insights" | "practice";

const NAV_ITEMS: { key: DashboardTab; label: string; icon: (color: string) => ReactNode }[] = [
  {
    key: "home",
    label: "Home",
    icon: (c) => (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="2" width="6" height="6" fill={c} />
        <rect x="10" y="2" width="6" height="6" fill={c} />
        <rect x="2" y="10" width="6" height="6" fill={c} />
        <rect x="10" y="10" width="6" height="6" fill={c} />
      </svg>
    ),
  },
  {
    key: "progress",
    label: "Progress",
    icon: (c) => (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="10" width="3.4" height="6" fill={c} />
        <rect x="7.3" y="6" width="3.4" height="10" fill={c} />
        <rect x="12.6" y="2" width="3.4" height="14" fill={c} />
      </svg>
    ),
  },
  {
    key: "insights",
    label: "Insights",
    icon: (c) => (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <polygon points="9,2 16,9 9,16 2,9" fill="none" stroke={c} strokeWidth="1.4" strokeLinejoin="round" />
        <circle cx="9" cy="9" r="1.8" fill={c} />
      </svg>
    ),
  },
  {
    key: "practice",
    label: "Practice",
    icon: (c) => (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="7" fill="none" stroke={c} strokeWidth="1.4" />
        <circle cx="9" cy="9" r="3" fill="none" stroke={c} strokeWidth="1.4" />
        <circle cx="9" cy="9" r="1" fill={c} />
      </svg>
    ),
  },
];

const SQUAD_ICON = (c: string) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="6" cy="7" r="2.6" fill={c} />
    <circle cx="13" cy="7" r="2.6" fill="none" stroke={c} strokeWidth="1.4" />
    <path d="M2 16c0-2.4 1.8-4 4-4s4 1.6 4 4" stroke={c} strokeWidth="1.3" fill="none" />
    <path d="M10 13.5c.7-1 1.9-1.5 3-1.5 2.2 0 4 1.6 4 4" stroke={c} strokeWidth="1.3" fill="none" />
  </svg>
);

type Props = {
  active: DashboardTab;
  onChange: (tab: DashboardTab) => void;
  userName: string;
  examLabel: string;
  dayLabel: string;
  streak: number;
  children: ReactNode;
};

export function DashboardShell({ active, onChange, userName, examLabel, dayLabel, streak, children }: Props) {
  const navigate = useNavigate();
  const goSite = () => void navigate({ to: "/" });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0A0E0A", color: "#E8EDE6" }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex"
        style={{
          width: 230,
          flexShrink: 0,
          borderRight: ".5px solid rgba(201,168,76,.14)",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          background: "#0A0E0A",
        }}
      >
        <button
          type="button"
          onClick={goSite}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "22px 22px 26px",
            fontFamily: "var(--font-serif)",
            fontSize: 19,
            fontWeight: 600,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "inherit",
            textAlign: "left",
          }}
        >
          <span style={{ color: "#C9A84C", fontSize: 16 }}>★</span>
          <span>
            <span style={{ color: "#C9A84C" }}>Forge</span>
            <span style={{ color: "#E8EDE6" }}>SSB</span>
          </span>
        </button>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 12px" }}>
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.key;
            const color = isActive ? "#C9A84C" : "#8A9A84";
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onChange(item.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  height: 44,
                  padding: "0 12px",
                  border: "none",
                  background: isActive ? "rgba(201,168,76,.06)" : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  color,
                }}
              >
                {item.icon(color)}
                <span style={{ fontSize: 13.5, letterSpacing: ".01em" }}>{item.label}</span>
              </button>
            );
          })}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              height: 44,
              padding: "0 12px",
              cursor: "default",
              color: "#8A9A84",
              opacity: 0.5,
            }}
          >
            {SQUAD_ICON("#8A9A84")}
            <span style={{ fontSize: 13.5 }}>Squad</span>
            <span
              style={{
                marginLeft: "auto",
                fontFamily: "var(--font-mono)",
                fontSize: 7,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                border: ".5px solid rgba(201,168,76,.28)",
                color: "#C9A84C",
                padding: "2px 5px",
                whiteSpace: "nowrap",
              }}
            >
              Soon
            </span>
          </div>
        </nav>
        <div style={{ marginTop: "auto", padding: 18, borderTop: ".5px solid rgba(201,168,76,.14)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "rgba(201,168,76,.10)",
                border: "1px solid rgba(201,168,76,.28)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-serif)",
                fontSize: 14,
                color: "#C9A84C",
                flexShrink: 0,
              }}
            >
              {userName ? userName[0]?.toUpperCase() : "A"}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, color: "#E8EDE6", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {userName || "Aspirant"}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 8,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  color: "#8A9A84",
                  margin: "2px 0 0",
                }}
              >
                {examLabel ? `${examLabel} · ` : ""}
                {dayLabel}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Mobile top bar */}
        <div
          className="flex md:hidden"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            alignItems: "center",
            justifyContent: "space-between",
            height: 54,
            padding: "0 18px",
            background: "rgba(10,14,10,.92)",
            backdropFilter: "blur(12px)",
            borderBottom: ".5px solid rgba(201,168,76,.14)",
          }}
        >
          <button
            type="button"
            onClick={goSite}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "var(--font-serif)",
              fontSize: 17,
              fontWeight: 600,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "inherit",
            }}
          >
            <span style={{ color: "#C9A84C", fontSize: 14 }}>★</span>
            <span>
              <span style={{ color: "#C9A84C" }}>Forge</span>
              <span style={{ color: "#E8EDE6" }}>SSB</span>
            </span>
          </button>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: ".5px solid rgba(201,168,76,.28)",
              background: "rgba(201,168,76,.10)",
              padding: "5px 9px",
            }}
          >
            <span style={{ color: "#C9A84C", fontSize: 11 }}>★</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#C9A84C" }}>{streak}</span>
          </div>
        </div>

        <main style={{ flex: 1, padding: "24px 24px 100px", maxWidth: 900 }}>{children}</main>

        {/* Mobile bottom tabs */}
        <nav
          className="flex md:hidden"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 30,
            height: 64,
            background: "rgba(10,14,10,.95)",
            borderTop: ".5px solid rgba(201,168,76,.14)",
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.key;
            const color = isActive ? "#C9A84C" : "#8A9A84";
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onChange(item.key)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color,
                }}
              >
                {item.icon(color)}
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: ".06em", textTransform: "uppercase" }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
