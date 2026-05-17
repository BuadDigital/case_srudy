"use client";

import { usePrototype } from "@/contexts/PrototypeContext";
import { MOCK_PROPERTIES } from "@/lib/prototype/constants";

export function KeysView() {
  const { role } = usePrototype();
  const viewOnly = role === "general-manager";
  const kp = MOCK_PROPERTIES.filter((p) => p.key);

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="stat-label">إجمالي المفاتيح</div>
          <div className="stat-value">{kp.length}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">مستلمة</div>
          <div className="stat-value">1</div>
        </div>
        <div className="stat-card warn">
          <div className="stat-label">بانتظار الاستلام</div>
          <div className="stat-value">{Math.max(0, kp.length - 1)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">مندوبو المحكمة</div>
          <div className="stat-value">2</div>
        </div>
      </div>
      <div className="note note-warn">مندوبا المحكمة المعتمدان: فراس كمرين — خالد الشريف</div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">العقارات التي تحتاج مفاتيح</span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>رقم العقار</th>
              <th>PO</th>
              <th>المنطقة</th>
              <th>المحكمة</th>
              <th>حالة المفتاح</th>
              <th>المندوب</th>
              <th>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {kp.map((p) => (
              <tr key={p.id}>
                <td className="id-cell">{p.id}</td>
                <td style={{ fontSize: 11, color: "var(--primary-light)" }}>{p.po}</td>
                <td>{p.area}</td>
                <td>محكمة {p.area}</td>
                <td>
                  {p.id === "E-4403" ? (
                    <span className="badge b-done">مستلم</span>
                  ) : (
                    <span className="badge b-prog">بانتظار الاستلام</span>
                  )}
                </td>
                <td>فراس كمرين</td>
                <td>
                  {p.id === "E-4403" || viewOnly ? (
                    "—"
                  ) : (
                    <button type="button" className="btn btn-sm btn-primary">
                      تسجيل الاستلام
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
