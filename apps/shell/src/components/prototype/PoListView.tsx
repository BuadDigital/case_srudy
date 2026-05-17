"use client";

import { usePrototype } from "@/contexts/PrototypeContext";
import { StatusBadge } from "@platform/design-system";
import { MOCK_PO } from "@/lib/prototype/constants";

function isViewOnlyRole(role: string) {
  return role === "general-manager";
}

export function PoListView() {
  const { role } = usePrototype();
  const viewOnly = isViewOnlyRole(role);

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="stat-label">PO نشطة</div>
          <div className="stat-value">7</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">مكتملة هذا الشهر</div>
          <div className="stat-value">23</div>
        </div>
        <div className="stat-card warn">
          <div className="stat-label">عقارات نشطة</div>
          <div className="stat-value">43</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">متوسط العقارات/PO</div>
          <div className="stat-value">8.6</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">أوامر العمل الواردة من إنفاذ</span>
          {!viewOnly ? (
            <button type="button" className="btn btn-sm btn-primary">
              + استلام PO جديد
            </button>
          ) : null}
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>رقم PO</th>
              <th>نوع الإسناد</th>
              <th>العقارات</th>
              <th>المكتملة</th>
              <th>التقدم</th>
              <th>الحالة</th>
              <th>تاريخ الاستلام</th>
              <th>الأخصائي</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_PO.map((p) => (
              <tr key={p.id}>
                <td className="id-cell">{p.id}</td>
                <td>
                  <span
                    className={`badge ${p.type === "قضائي" ? "b-survey" : "b-key"}`}
                  >
                    {p.type}
                  </span>
                </td>
                <td>{p.count}</td>
                <td>{p.done}</td>
                <td style={{ minWidth: 110 }}>
                  <div className="prog-wrap">
                    <div
                      className={`prog-bar ${p.status === "done" ? "g" : ""}`}
                      style={{
                        width: `${Math.round((p.done / p.count) * 100)}%`,
                      }}
                    />
                  </div>
                </td>
                <td>
                  <StatusBadge status={p.status} />
                </td>
                <td style={{ color: "var(--text3)", fontSize: 11 }}>{p.date}</td>
                <td style={{ fontSize: 11 }}>{p.specialist}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
