const DONUT_R = 14;
const DONUT_CIRC = 2 * Math.PI * DONUT_R;

export type CaseStudyProgressDonutProps = {
  pct: number;
  color: string;
  label: string;
  sub: string;
};

export function CaseStudyProgressDonut({
  pct,
  color,
  label,
  sub,
}: CaseStudyProgressDonutProps) {
  const offset = DONUT_CIRC * (1 - pct / 100);
  return (
    <div className="cs-mini-donut">
      <svg
        width="44"
        height="44"
        viewBox="0 0 36 36"
        className="cs-mini-donut-svg"
        aria-hidden="true"
      >
        <circle
          cx="18"
          cy="18"
          r={DONUT_R}
          fill="none"
          stroke="var(--border)"
          strokeWidth="3.5"
        />
        <circle
          cx="18"
          cy="18"
          r={DONUT_R}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeDasharray={`${DONUT_CIRC}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
        <text
          x="18"
          y="18"
          textAnchor="middle"
          dominantBaseline="central"
          className="cs-mini-donut-pct"
        >
          {pct}%
        </text>
      </svg>
      <div className="cs-mini-donut-meta">
        <span className="cs-mini-donut-label">{label}</span>
        <span className="cs-mini-donut-sub">{sub}</span>
      </div>
    </div>
  );
}
