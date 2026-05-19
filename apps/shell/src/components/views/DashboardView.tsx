"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { usePrototype } from "@/contexts/PrototypeContext";
import { StatusBadge } from "@platform/design-system";
import {
  DASHBOARD_TEAM_ROWS,
  MOCK_VR,
  type PoRow,
  type TeamKind,
} from "@/lib/prototype/constants";
import { assignmentTypeBadgeClass } from "@/lib/prototype/po-intake-data";
import {
  loadPoListRows,
  loadPropertyListItems,
} from "@/lib/prototype/po-intake-storage";
import { WORK_ORDERS_CHANGED_EVENT } from "@/lib/work-orders-api-config";

const MGR_ROLES = new Set([
  "general-manager",
  "section-supervisor",
  "operations-coordinator",
]);

function teamTint(t: TeamKind): { bg: string; fg: string } {
  if (t === "internal") return { bg: "var(--info-bg)", fg: "var(--info)" };
  if (t === "freelance") return { bg: "var(--warning-bg)", fg: "var(--warning)" };
  return { bg: "var(--success-bg)", fg: "var(--success)" };
}

export function DashboardView() {
  const router = useRouter();
  const { role } = usePrototype();
  const mgr = MGR_ROLES.has(role);
  const [poRows, setPoRows] = useState<PoRow[]>([]);
  const [propertyTotal, setPropertyTotal] = useState(0);
  const [propertyProgress, setPropertyProgress] = useState(0);
  const [propertyDone, setPropertyDone] = useState(0);
  const [propertyFail, setPropertyFail] = useState(0);

  const refresh = useCallback(async () => {
    const [poList, propertyItems] = await Promise.all([
      loadPoListRows(),
      loadPropertyListItems(),
    ]);
    setPoRows(poList);
    const rows = propertyItems.map((item) => item.row);
    setPropertyTotal(rows.length);
    setPropertyProgress(rows.filter((r) => r.status === "progress").length);
    setPropertyDone(rows.filter((r) => r.status === "done").length);
    setPropertyFail(rows.filter((r) => r.status === "fail").length);
  }, []);

  useEffect(() => {
    void refresh();
    const onChanged = () => void refresh();
    window.addEventListener(WORK_ORDERS_CHANGED_EVENT, onChanged);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "evalFailureRecords") void refresh();
    };
    const onFocus = () => void refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener(WORK_ORDERS_CHANGED_EVENT, onChanged);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  const poActive = poRows.filter((p) => p.status === "progress");

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="stat-label">عقارات مسجّلة</div>
          <div className="stat-value">{propertyTotal}</div>
          <div className="stat-sub">من استلام أوامر العمل</div>
        </div>
        <div className="stat-card warn">
          <div className="stat-label">قيد التنفيذ</div>
          <div className="stat-value">{propertyProgress}</div>
          <div className="stat-sub">بما فيها قيد التحقق</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">مكتملة</div>
          <div className="stat-value">{propertyDone}</div>
          <div className="stat-sub">
            {propertyTotal > 0
              ? `${Math.round((propertyDone / propertyTotal) * 100)}% من الإجمالي`
              : "—"}
          </div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">تعذرات</div>
          <div className="stat-value">{propertyFail}</div>
          <div className="stat-sub">
            {propertyFail > 0 ? "تحتاج مراجعة" : "لا تعذرات مسجّلة"}
          </div>
        </div>
      </div>

      {mgr ? (
        <div className="grid-2" style={{ marginBottom: 16 }}>
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <span className="card-title">أوامر العمل النشطة</span>
              <Link href="/po" className="btn btn-sm">
                عرض الكل
              </Link>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>PO</th>
                  <th>النوع</th>
                  <th>التقدم</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {poActive.length === 0 ? (
                  <tr className="tbl-empty">
                    <td
                      colSpan={4}
                      style={{ textAlign: "center", color: "var(--text3)" }}
                    >
                      لا توجد أوامر عمل نشطة
                    </td>
                  </tr>
                ) : null}
                {poActive.map((p) => (
                  <tr key={p.id} onClick={() => router.push("/po")}>
                    <td className="id-cell">{p.id}</td>
                    <td>
                      <span
                        className={`badge ${assignmentTypeBadgeClass(p.type)}`}
                      >
                        {p.type}
                      </span>
                    </td>
                    <td style={{ minWidth: 100 }}>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--text3)",
                          marginBottom: 3,
                        }}
                      >
                        {p.done}/{p.count}
                      </div>
                      <div className="prog-wrap">
                        <div
                          className="prog-bar"
                          style={{
                            width: `${p.count > 0 ? Math.round((p.done / p.count) * 100) : 0}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <span className="card-title">طلبات التقييم الأخيرة</span>
              <Link href="/valuation-requests" className="btn btn-sm">
                عرض الكل
              </Link>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>الطلب</th>
                  <th>العقار</th>
                  <th>المقيم</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_VR.map((v) => (
                  <tr key={v.id}>
                    <td className="id-cell">{v.id}</td>
                    <td>{v.propId}</td>
                    <td style={{ fontSize: 11 }}>{v.appraiser}</td>
                    <td>
                      <StatusBadge status={v.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="sec-title">الفريق الميداني — مزودو الخدمة الداخليين</div>
      <div className="note note-info">
        المعاينون والمقيمون يتبعون قسم التقييم العقاري ويخدمون القسمين كمورد
        مشترك
      </div>
      {DASHBOARD_TEAM_ROWS.length === 0 ? (
        <p className="field-team-empty">لا توجد بيانات فريق ميداني بعد.</p>
      ) : (
        <div className="grid-3">
          {DASHBOARD_TEAM_ROWS.map(([init, name, roleLine, t, count]) => {
            const { bg, fg } = teamTint(t);
            return (
              <div key={name} className="team-card">
                <div
                  className="avatar"
                  style={{
                    background: bg,
                    color: fg,
                    width: 34,
                    height: 34,
                    fontSize: 11,
                  }}
                >
                  {init}
                </div>
                <div className="team-info">
                  <div className="team-name">{name}</div>
                  <div className="team-role">{roleLine}</div>
                </div>
                <div className="team-count">{count}</div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
