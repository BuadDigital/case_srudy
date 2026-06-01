"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { StatValue } from "@/components/ui/StatValue";
import { usePrototype } from "@/contexts/PrototypeContext";
import { StatusBadge } from "@platform/design-system";
import {
  DASHBOARD_TEAM_ROWS,
  MOCK_VR,
  type TeamKind,
} from "@/lib/prototype/constants";
import { assignmentTypeBadgeClass } from "@/lib/prototype/po-intake-data";
import {
  usePoListRowsQuery,
  usePropertyListItemsQuery,
} from "@/lib/query/prototype-queries";
import { TeamCurrentLoadCard } from "@/components/views/TeamCurrentLoadCard";

const MGR_ROLES = new Set([
  "general-manager",
  "section-supervisor",
  "operations-coordinator",
]);

const TEAM_LOAD_ROLES = new Set([...MGR_ROLES, "cdo"]);

function teamTint(t: TeamKind): { bg: string; fg: string } {
  if (t === "internal") return { bg: "var(--info-bg)", fg: "var(--info)" };
  if (t === "freelance") return { bg: "var(--warning-bg)", fg: "var(--warning)" };
  return { bg: "var(--success-bg)", fg: "var(--success)" };
}

export function DashboardView() {
  const router = useRouter();
  const { role } = usePrototype();
  const mgr = MGR_ROLES.has(role);
  const showTeamLoad = TEAM_LOAD_ROLES.has(role);
  const { data: poRows } = usePoListRowsQuery();
  const { data: propertyItems } = usePropertyListItemsQuery();

  const propertyStats = useMemo(() => {
    if (!propertyItems) return undefined;
    const rows = propertyItems.map((item) => item.row);
    const total = rows.length;
    const done = rows.filter((r) => r.status === "done").length;
    return {
      total,
      progress: rows.filter((r) => r.status === "progress").length,
      done,
      fail: rows.filter((r) => r.status === "fail").length,
      donePct: total > 0 ? `${Math.round((done / total) * 100)}% من الإجمالي` : "—",
    };
  }, [propertyItems]);

  const poActive = (poRows ?? []).filter((p) => p.status === "progress");
  const poReady = poRows !== undefined;

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="stat-label">عقارات مسجّلة</div>
          <StatValue value={propertyStats?.total} />
          <div className="stat-sub">من استلام أوامر العمل</div>
        </div>
        <div className="stat-card warn">
          <div className="stat-label">قيد التنفيذ</div>
          <StatValue value={propertyStats?.progress} />
          <div className="stat-sub">بما فيها قيد التحقق</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">مكتملة</div>
          <StatValue value={propertyStats?.done} />
          <div className="stat-sub">{propertyStats?.donePct ?? "—"}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">تعذرات</div>
          <StatValue value={propertyStats?.fail} />
          <div className="stat-sub">
            {propertyStats && propertyStats.fail > 0
              ? "تحتاج مراجعة"
              : "لا تعذرات مسجّلة"}
          </div>
        </div>
      </div>

      {showTeamLoad ? (
        <div style={{ marginBottom: 16 }}>
          <TeamCurrentLoadCard />
        </div>
      ) : null}

      {mgr ? (
        <div className="grid-2" style={{ marginBottom: 16 }}>
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <span className="card-title">أوامر العمل النشطة</span>
              <Link href="/po" className="btn btn-sm">
                عرض الكل
              </Link>
            </div>
            <table className="tbl" data-pending={!poReady}>
              <thead>
                <tr>
                  <th>PO</th>
                  <th>النوع</th>
                  <th>التقدم</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {poReady && poActive.length === 0 ? (
                  <tr className="tbl-empty">
                    <td
                      colSpan={4}
                      style={{ textAlign: "center", color: "var(--text3)" }}
                    >
                      لا توجد أوامر عمل نشطة
                    </td>
                  </tr>
                ) : null}
                {poReady
                  ? poActive.map((p) => (
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
                    ))
                  : null}
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
