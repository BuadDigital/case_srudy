const TEAM_LOAD_SPECIALISTS: [string, string, number, number, "o" | "g"][] = [
  ["أسامة الصالحي", "أخصائي", 14, 20, "o"],
  ["عمر الحمراني", "أخصائي", 10, 20, "g"],
  ["أيمن مجرشي", "أخصائي", 11, 20, "o"],
  ["وليد باشماخ", "أخصائي", 8, 20, "g"],
];

function LoadRow({
  name,
  roleLabel,
  value,
  max,
  barClass,
}: {
  name: string;
  roleLabel: string;
  value: number;
  max: number;
  barClass: "o" | "g";
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="kpi-lbl">
        <span>
          {name} <span style={{ color: "var(--text3)" }}>({roleLabel})</span>
        </span>
        <span style={{ fontWeight: 600 }}>
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
    <article className="page-shell">
      <header className="po-subpage-hd">
        <div className="po-subpage-titles">
          <h2 className="po-subpage-title">حمل الفريق الحالي</h2>
        </div>
      </header>
      <div className="card-body">
        {TEAM_LOAD_SPECIALISTS.map(([n, r, v, m, c]) => (
          <LoadRow key={n} name={n} roleLabel={r} value={v} max={m} barClass={c} />
        ))}
      </div>
    </article>
  );
}
