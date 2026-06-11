"use client";

import { usePrototype } from "@platform/app-shared/contexts/PrototypeContext";
import { StatusBadge } from "@platform/design-system";
import { MOCK_VR, type RoleId } from "@platform/app-shared/prototype/constants";
import { isSuperAdmin } from "@platform/app-shared/prototype/prototype-role-access";

function isValuationMgr(role: RoleId) {
  return (
    isSuperAdmin(role) ||
    role === "general-manager" ||
    role === "valuation-coordinator"
  );
}

export function ValuationRequestsView() {
  const { role } = usePrototype();
  const mgr = isValuationMgr(role);
  const isApp = role === "real-estate-appraiser";
  const vr = MOCK_VR;
  const done = vr.filter((v) => v.status === "done").length;
  const prog = vr.filter((v) => v.status === "progress").length;

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="stat-label">طلبات نشطة</div>
          <div className="stat-value">{vr.length}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">مكتملة</div>
          <div className="stat-value">{done}</div>
        </div>
        <div className="stat-card warn">
          <div className="stat-label">قيد التنفيذ</div>
          <div className="stat-value">{prog}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">مقيمون متاحون</div>
          <div className="stat-value">2</div>
        </div>
      </div>
      <div className="note note-info">
        هذه الطلبات واردة من قسم دراسة الحالة — يتولى منسق التقييم توزيعها على المقيمين المؤهلين
      </div>
      <article className="page-shell">
        <header className="po-subpage-hd">
          <div className="po-subpage-titles">
            <h2 className="po-subpage-title">طلبات التقييم الواردة من دراسة الحالة</h2>
          </div>
        </header>
        <table className="tbl">
          <thead>
            <tr>
              <th>رقم الطلب</th>
              <th>العقار</th>
              <th>المنطقة</th>
              <th>النوع</th>
              <th>المقيم المُسند</th>
              <th>الحالة</th>
              <th>التاريخ</th>
              <th>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {vr.map((v) => (
              <tr key={v.id}>
                <td className="id-cell">{v.id}</td>
                <td style={{ color: "var(--primary-light)", fontSize: 11 }}>{v.propId}</td>
                <td>{v.area}</td>
                <td>{v.type}</td>
                <td style={{ fontSize: 11 }}>{v.appraiser}</td>
                <td>
                  <StatusBadge status={v.status} />
                </td>
                <td style={{ color: "var(--text3)", fontSize: 11 }}>{v.date}</td>
                <td>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {isApp && v.status === "progress" ? (
                      <>
                        <button type="button" className="btn btn-sm btn-accent">
                          رفع التقرير
                        </button>
                        <button type="button" className="btn btn-sm btn-danger">
                          تعذّر
                        </button>
                      </>
                    ) : null}
                    {mgr && v.status === "progress" ? (
                      <button type="button" className="btn btn-sm">
                        عرض
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </>
  );
}
