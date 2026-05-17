"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePrototype } from "@/contexts/PrototypeContext";
import { StatusBadge } from "@platform/design-system";
import {
  DASHBOARD_TEAM_ROWS,
  MOCK_PO,
  MOCK_VR,
  type TeamKind,
} from "@/lib/prototype/constants";

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
  const poActive = MOCK_PO.filter((p) => p.status === "progress");

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="stat-label">عقارات نشطة اليوم</div>
          <div className="stat-value">43</div>
          <div className="stat-sub">هدف 40–50 يومياً</div>
        </div>
        <div className="stat-card warn">
          <div className="stat-label">قيد التنفيذ</div>
          <div className="stat-value">28</div>
          <div className="stat-sub">8 تنتهي اليوم</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">مكتملة هذا الأسبوع</div>
          <div className="stat-value">134</div>
          <div className="stat-sub">↑ 9% عن الأسبوع الماضي</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">تعذرات مفتوحة</div>
          <div className="stat-value">5</div>
          <div className="stat-sub">تحتاج مراجعة</div>
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
                {poActive.map((p) => (
                  <tr key={p.id} onClick={() => router.push("/po")}>
                    <td className="id-cell">{p.id}</td>
                    <td>
                      <span
                        className={`badge ${p.type === "قضائي" ? "b-survey" : "b-key"}`}
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
                            width: `${Math.round((p.done / p.count) * 100)}%`,
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
