const ASSIGN_PO_OPTIONS = ["PO-2024-018", "PO-2024-016"] as const;

const SPECIALIST_OPTIONS = [
  "أسامة الصالحي (14 عقار)",
  "عمر الحمراني (10 عقارات)",
  "أيمن مجرشي (11 عقاراً)",
  "وليد باشماخ (8 عقارات)",
] as const;

const PREPARER_OPTIONS = ["صالح الحبشي (14/20) — مقترح", "أيمن بن محفوظ (11/20)"] as const;

const INSPECTOR_OPTIONS = [
  "أحمد سعيد — مكة",
  "عبدالله عبدالمانع — جدة",
  "حسن عطية — الطائف (متعاون)",
] as const;

const ENGINEERING_OPTIONS = [
  "مكتب الرياض الهندسي",
  "مكتب جدة للمساحة",
  "مكتب مكة الهندسي",
] as const;

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
        <span style={{ fontWeight: 600 }}>{value}/{max}</span>
      </div>
      <div className="prog-wrap">
        <div className={`prog-bar ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LoadRowSmall({
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
    <div style={{ marginBottom: 10 }}>
      <div className="kpi-lbl">
        <span>
          {name} <span style={{ color: "var(--text3)" }}>({roleLabel})</span>
        </span>
        <span>
          {value}/{max}
        </span>
      </div>
      <div className="prog-wrap">
        <div className={`prog-bar ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function AssignmentView() {
  return (
    <>
      <div className="note note-warn">
        التوزيع التلقائي: الأقل حملاً ← نوع الإسناد ← الأخصائي المرتبط ← الأقل إجمالاً
      </div>
      <div className="grid-2">
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <span className="card-title">إسناد عقار جديد</span>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label" htmlFor="assign-po">
                أمر العمل (PO)
              </label>
              <select id="assign-po" className="form-control" defaultValue={ASSIGN_PO_OPTIONS[0]}>
                {ASSIGN_PO_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="assign-spec">
                أخصائي دراسة الحالة
              </label>
              <select id="assign-spec" className="form-control" defaultValue={SPECIALIST_OPTIONS[0]}>
                {SPECIALIST_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="assign-prep">
                معد التقرير{" "}
                <span style={{ color: "var(--accent)", fontSize: 10 }}>● تلقائي</span>
              </label>
              <select id="assign-prep" className="form-control" defaultValue={PREPARER_OPTIONS[0]}>
                {PREPARER_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="assign-insp">
                المعاين الميداني{" "}
                <span style={{ color: "var(--text3)", fontSize: 10 }}>مزود خدمة داخلي</span>
              </label>
              <select id="assign-insp" className="form-control" defaultValue={INSPECTOR_OPTIONS[0]}>
                {INSPECTOR_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="assign-eng">
                المكتب الهندسي
              </label>
              <select id="assign-eng" className="form-control" defaultValue={ENGINEERING_OPTIONS[0]}>
                {ENGINEERING_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="btn btn-primary">
              تأكيد الإسناد
            </button>
          </div>
        </div>
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
              <LoadRowSmall key={n} name={n} roleLabel={r} value={v} max={m} barClass={c} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
