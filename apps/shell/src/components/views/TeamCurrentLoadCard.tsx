const TEAM_LOAD_SPECIALISTS: [string, string, number, number, "o" | "g"][] = [
  ["أسامة الصالحي", "أخصائي", 14, 20, "o"],
  ["عمر الحمراني", "أخصائي", 10, 20, "g"],
  ["أيمن مجرشي", "أخصائي", 11, 20, "o"],
  ["وليد باشماخ", "أخصائي", 8, 20, "g"],
];

const TEAM_LOAD_PREPARERS: [string, string, number, number, "o" | "g"][] = [
  ["صالح الحبشي", "معد تقرير", 14, 20, "o"],
  ["أيمن بن محفوظ", "معد تقرير", 11, 20, "g"],
];

function LoadRow({
  name,
  roleLabel,
  value,
  max,
  barClass,
  compact,
}: {
  name: string;
  roleLabel: string;
  value: number;
  max: number;
  barClass: "o" | "g";
  compact?: boolean;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ marginBottom: compact ? 10 : 12 }}>
      <div className="kpi-lbl">
        <span>
          {name} <span style={{ color: "var(--text3)" }}>({roleLabel})</span>
        </span>
        <span style={compact ? undefined : { fontWeight: 600 }}>
          {value}/{max}
        </span>
      </div>
      <div className="prog-wrap">
        <div className={`prog-bar ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function TeamCurrentLoadCard() {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div className="card-header">
        <span className="card-title">حمل الفريق الحالي</span>
      </div>
      <div className="card-body">
        {TEAM_LOAD_SPECIALISTS.map(([n, r, v, m, c]) => (
          <LoadRow key={n} name={n} roleLabel={r} value={v} max={m} barClass={c} />
        ))}
        <div className="divider" />
        {TEAM_LOAD_PREPARERS.map(([n, r, v, m, c]) => (
          <LoadRow
            key={n}
            name={n}
            roleLabel={r}
            value={v}
            max={m}
            barClass={c}
            compact
          />
        ))}
      </div>
    </div>
  );
}
