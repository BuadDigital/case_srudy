import { StatusBadge, WorkflowStageBadge } from "@platform/design-system";
import { MOCK_PROPERTIES } from "@/lib/prototype/constants";

const AREA_FILTER_OPTIONS = [
  "جميع المناطق",
  "مكة المكرمة",
  "جدة",
  "الطائف",
] as const;

const STATUS_FILTER_OPTIONS = [
  "جميع الحالات",
  "جديد",
  "قيد التنفيذ",
  "مكتمل",
] as const;

export function PropertiesListView() {
  const total = MOCK_PROPERTIES.length;
  const done = MOCK_PROPERTIES.filter((p) => p.status === "done").length;
  const progress = MOCK_PROPERTIES.filter((p) => p.status === "progress").length;
  const fail = MOCK_PROPERTIES.filter((p) => p.status === "fail").length;

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="stat-label">إجمالي العقارات</div>
          <div className="stat-value">{total}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">مكتملة</div>
          <div className="stat-value">{done}</div>
        </div>
        <div className="stat-card warn">
          <div className="stat-label">قيد التنفيذ</div>
          <div className="stat-value">{progress}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">متعذرة</div>
          <div className="stat-value">{fail}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">جميع العقارات</span>
          <div style={{ display: "flex", gap: 8 }}>
            <select
              className="form-control"
              style={{ width: "auto", fontSize: 11 }}
              aria-label="تصفية حسب المنطقة"
              defaultValue={AREA_FILTER_OPTIONS[0]}
            >
              {AREA_FILTER_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <select
              className="form-control"
              style={{ width: "auto", fontSize: 11 }}
              aria-label="تصفية حسب الحالة"
              defaultValue={STATUS_FILTER_OPTIONS[0]}
            >
              {STATUS_FILTER_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>رقم العقار</th>
              <th>PO</th>
              <th>المنطقة</th>
              <th>النوع</th>
              <th>مفتاح</th>
              <th>رفع مساحي</th>
              <th>تقييم</th>
              <th>دراسة الحالة</th>
              <th>الأخصائي</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_PROPERTIES.map((p) => (
              <tr key={p.id}>
                <td className="id-cell">{p.id}</td>
                <td style={{ color: "var(--primary-light)", fontSize: 11 }}>
                  {p.po}
                </td>
                <td>{p.area}</td>
                <td>{p.type}</td>
                <td>
                  {p.key ? <span className="badge b-key">نعم</span> : "—"}
                </td>
                <td>
                  <WorkflowStageBadge stage={p.survey} />
                </td>
                <td>
                  <WorkflowStageBadge stage={p.val} />
                </td>
                <td>
                  <WorkflowStageBadge stage={p.study} />
                </td>
                <td style={{ fontSize: 11 }}>{p.specialist}</td>
                <td>
                  <StatusBadge status={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
