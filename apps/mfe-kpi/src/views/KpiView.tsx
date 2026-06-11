const SPECIALIST_KPI: [string, number][] = [
  ["أسامة الصالحي", 82],
  ["عمر الحمراني", 76],
  ["أيمن مجرشي", 69],
  ["وليد باشماخ", 91],
];

const PROVIDER_KPI: [string, number][] = [
  ["أحمد سعيد — معاين", 88],
  ["عبدالله عبدالمانع — معاين", 94],
  ["حسن عطية — معاين (متعاون)", 79],
  ["عبدالله الكثيري — مقيم", 85],
  ["محمد العساف — مقيم", 82],
];

function barClass(v: number) {
  if (v >= 85) return "g";
  if (v >= 70) return "";
  return "r";
}

export function KpiView() {
  return (
    <>
      <div className="stat-grid">
        <div className="stat-card green">
          <div className="stat-label">معدل الإنجاز في الموعد</div>
          <div className="stat-value">89%</div>
          <div className="stat-sub">هدف: 90%</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">متوسط إنجاز العقار</div>
          <div className="stat-value">3.6 يوم</div>
          <div className="stat-sub">هدف: أقل من 4</div>
        </div>
        <div className="stat-card warn">
          <div className="stat-label">معدل التعذرات</div>
          <div className="stat-value">3.8%</div>
          <div className="stat-sub">هدف: أقل من 5%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">عقارات مُنجزة اليوم</div>
          <div className="stat-value">43</div>
          <div className="stat-sub">هدف: 40-50</div>
        </div>
      </div>
      <div className="grid-2">
        <article className="page-shell">
          <header className="po-subpage-hd">
            <div className="po-subpage-titles">
              <h2 className="po-subpage-title">أداء أخصائيي دراسة الحالة</h2>
            </div>
          </header>
          <div className="card-body">
            {SPECIALIST_KPI.map(([n, v]) => (
              <div key={n} style={{ marginBottom: 14 }}>
                <div className="kpi-lbl">
                  <span>{n}</span>
                  <span style={{ fontWeight: 600 }}>{v}%</span>
                </div>
                <div className="prog-wrap">
                  <div className={`prog-bar ${barClass(v)}`} style={{ width: `${v}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
        <article className="page-shell">
          <header className="po-subpage-hd">
            <div className="po-subpage-titles">
              <h2 className="po-subpage-title">أداء مزودي الخدمة</h2>
            </div>
          </header>
          <div className="card-body">
            {PROVIDER_KPI.map(([n, v]) => (
              <div key={n} style={{ marginBottom: 12 }}>
                <div className="kpi-lbl">
                  <span>{n}</span>
                  <span style={{ fontWeight: 600 }}>{v}%</span>
                </div>
                <div className="prog-wrap">
                  <div className={`prog-bar ${barClass(v)}`} style={{ width: `${v}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </>
  );
}
