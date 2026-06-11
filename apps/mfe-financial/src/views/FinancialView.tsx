const REVENUE_ROWS = [
  { po: "PO-2024-014", billed: 8, excluded: 0, value: "18,400 ر", status: "done" as const },
  { po: "PO-2024-015", billed: 1, excluded: 0, value: "2,200 ر", status: "done" as const },
  { po: "PO-2024-017", billed: 3, excluded: 0, value: "6,600 ر", status: "done" as const },
  { po: "PO-2024-016", billed: 13, excluded: 2, value: "28,600 ر", status: "progress" as const },
];

const COST_ROWS = [
  { name: "مكتب الرياض الهندسي", type: "ext" as const, cost: "18,400 ر", cat: "رفع مساحي" },
  { name: "عبدالله الكثيري", type: "int" as const, cost: "12,000 ر", cat: "تقييم" },
  { name: "حسن عطية", type: "free" as const, cost: "3,200 ر", cat: "معاينة" },
];

function ContractBadge({ type }: { type: "ext" | "int" | "free" }) {
  if (type === "ext")
    return <span className="badge b-ext">خارجي</span>;
  if (type === "int")
    return <span className="badge b-int">داخلي</span>;
  return <span className="badge b-free">متعاون</span>;
}

export function FinancialView() {
  return (
    <>
      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="stat-label">إيرادات يناير</div>
          <div className="stat-value" style={{ fontSize: 20 }}>
            312,400
          </div>
          <div className="stat-sub">ريال سعودي</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">تكاليف خارجية</div>
          <div className="stat-value" style={{ fontSize: 20 }}>
            87,600
          </div>
          <div className="stat-sub">مكاتب + متعاونون</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">هامش الربح</div>
          <div className="stat-value" style={{ fontSize: 20 }}>
            224,800
          </div>
          <div className="stat-sub">72% من الإيرادات</div>
        </div>
        <div className="stat-card warn">
          <div className="stat-label">مستحقات معلقة</div>
          <div className="stat-value" style={{ fontSize: 20 }}>
            43,200
          </div>
          <div className="stat-sub">ريال سعودي</div>
        </div>
      </div>
      <div className="grid-2">
        <article className="page-shell">
          <header className="po-subpage-hd">
            <div className="po-subpage-titles">
              <h2 className="po-subpage-title">إيرادات إنفاذ</h2>
            </div>
          </header>
          <table className="tbl">
            <thead>
              <tr>
                <th>PO</th>
                <th>مُفوتَرة</th>
                <th>مستثنيات</th>
                <th>القيمة</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {REVENUE_ROWS.map((r) => (
                <tr key={r.po}>
                  <td className="id-cell">{r.po}</td>
                  <td>{r.billed}</td>
                  <td>{r.excluded}</td>
                  <td>{r.value}</td>
                  <td>
                    {r.status === "done" ? (
                      <span className="badge b-done">مُفوتَر</span>
                    ) : (
                      <span className="badge b-prog">جزئي</span>
                    )}
                  </td>
                </tr>
              ))}
              <tr style={{ background: "var(--surface2)", fontWeight: 600 }}>
                <td colSpan={3}>الإجمالي</td>
                <td>55,800 ر</td>
                <td />
              </tr>
            </tbody>
          </table>
        </article>
        <article className="page-shell">
          <header className="po-subpage-hd">
            <div className="po-subpage-titles">
              <h2 className="po-subpage-title">تكاليف مزودي الخدمة</h2>
            </div>
          </header>
          <table className="tbl">
            <thead>
              <tr>
                <th>المزود</th>
                <th>النوع</th>
                <th>التكلفة</th>
                <th>الفئة</th>
              </tr>
            </thead>
            <tbody>
              {COST_ROWS.map((r) => (
                <tr key={r.name}>
                  <td style={{ fontWeight: 500 }}>{r.name}</td>
                  <td>
                    <ContractBadge type={r.type} />
                  </td>
                  <td>{r.cost}</td>
                  <td>{r.cat}</td>
                </tr>
              ))}
              <tr style={{ background: "var(--surface2)", fontWeight: 600 }}>
                <td colSpan={2}>الإجمالي</td>
                <td>33,600 ر</td>
                <td />
              </tr>
            </tbody>
          </table>
        </article>
      </div>
    </>
  );
}
