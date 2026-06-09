"use client";

import { usePrototype } from "@platform/app-shared/contexts/PrototypeContext";
import { isSuperAdmin } from "@platform/app-shared/prototype/prototype-role-access";
import { MOCK_SURVEY_OFFICES } from "@platform/app-shared/prototype/constants";

export function SurveyView() {
  const { role } = usePrototype();
  const viewOnly = !isSuperAdmin(role) && role === "general-manager";

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="stat-label">إجمالي طلبات الرفع</div>
          <div className="stat-value">43</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">مكتملة</div>
          <div className="stat-value">18</div>
        </div>
        <div className="stat-card warn">
          <div className="stat-label">قيد التنفيذ</div>
          <div className="stat-value">21</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">لم تُسند</div>
          <div className="stat-value">4</div>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">المكاتب الهندسية المعتمدة</span>
          {!viewOnly ? (
            <button type="button" className="btn btn-sm btn-primary">
              + إضافة مكتب
            </button>
          ) : null}
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>اسم المكتب</th>
              <th>نشطة</th>
              <th>مكتملة هذا الشهر</th>
              <th>متوسط الإنجاز</th>
              <th>آلية التعاقد</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_SURVEY_OFFICES.map((row) => (
              <tr key={row.name}>
                <td style={{ fontWeight: 500 }}>{row.name}</td>
                <td>{row.active}</td>
                <td>{row.doneMonth}</td>
                <td>{row.avgDays}</td>
                <td>
                  <span className="badge b-cancel">{row.contract}</span>
                </td>
                <td>
                  {row.statusBusy ? (
                    <span className="badge b-prog">مشغول</span>
                  ) : (
                    <span className="badge b-done">نشط</span>
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
