type RadarOlq = { name: string; short: string; score: number };

type Props = {
  olqs: RadarOlq[];
  avgScore: number;
};

const CX = 170;
const CY = 162;
const R = 108;

function angle(i: number, n: number): number {
  return ((-90 + i * (360 / n)) * Math.PI) / 180;
}

function point(cx: number, cy: number, r: number, a: number): string {
  return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
}

export function OlqRadar({ olqs, avgScore }: Props) {
  const n = olqs.length;
  if (n === 0) return null;

  const poly = (vals: number[]) =>
    vals.map((v, i) => point(CX, CY, (v / 100) * R, angle(i, n))).join(" ");

  return (
    <svg viewBox="0 0 340 324" style={{ width: "100%", height: "auto", display: "block" }}>
      {[1, 0.75, 0.5, 0.25].map((f, i) => (
        <polygon
          key={`r${i}`}
          points={olqs.map((_, j) => point(CX, CY, f * R, angle(j, n))).join(" ")}
          fill="none"
          stroke="rgba(201,168,76,0.09)"
          strokeWidth={0.5}
        />
      ))}
      {olqs.map((_, i) => {
        const a = angle(i, n);
        return (
          <line
            key={`s${i}`}
            x1={CX}
            y1={CY}
            x2={(CX + R * Math.cos(a)).toFixed(1)}
            y2={(CY + R * Math.sin(a)).toFixed(1)}
            stroke="rgba(201,168,76,0.07)"
            strokeWidth={0.5}
          />
        );
      })}
      {olqs.map((o, i) => {
        const a = angle(i, n);
        const lx = CX + (R + 14) * Math.cos(a);
        const ly = CY + (R + 14) * Math.sin(a);
        const c = Math.cos(a);
        const anchor = c > 0.3 ? "start" : c < -0.3 ? "end" : "middle";
        return (
          <text
            key={`l${i}`}
            x={lx.toFixed(1)}
            y={(ly + 3).toFixed(1)}
            textAnchor={anchor}
            fill="#8A9A84"
            style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "7.5px" }}
          >
            {o.short}
          </text>
        );
      })}
      <polygon
        points={poly(olqs.map(() => avgScore))}
        fill="rgba(138,154,132,0.08)"
        stroke="rgba(138,154,132,0.45)"
        strokeWidth={1}
        strokeDasharray="3 3"
        strokeLinejoin="round"
      />
      <polygon
        points={poly(olqs.map((o) => o.score))}
        fill="rgba(201,168,76,0.16)"
        stroke="var(--color-gold)"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {olqs.map((o, i) => {
        const r = (o.score / 100) * R;
        const a = angle(i, n);
        return (
          <circle
            key={`d${i}`}
            cx={(CX + r * Math.cos(a)).toFixed(1)}
            cy={(CY + r * Math.sin(a)).toFixed(1)}
            r={1.7}
            fill="var(--color-gold)"
          />
        );
      })}
    </svg>
  );
}
