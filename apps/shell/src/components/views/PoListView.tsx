"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { StatValue } from "@/components/ui/StatValue";
import { EyeIconButton } from "@/components/ui/EyeIconButton";
import { PoNumber } from "@/components/ui/PoNumber";
import { usePrototype } from "@/contexts/PrototypeContext";
import { StatusBadge } from "@platform/design-system";
import {
  assignmentTypeBadgeClass,
  formatDateAr,
  isPastDue,
} from "@/lib/prototype/po-intake-data";
import { deletePoRecord } from "@/lib/prototype/po-intake-storage";
import {
  poHeaderEditPath,
  poIntakePath,
  poPropertiesPath,
} from "@/lib/po-routes";
import { prototypeKeys } from "@/lib/query/prototype-keys";
import { usePoListRowsQuery } from "@/lib/query/prototype-queries";
import {
  canDeletePo,
  canEditPoHeader,
  canReceivePo,
  isPoViewOnly,
} from "@/lib/prototype/po-roles";

export function PoListView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { role } = usePrototype();
  const viewOnly = isPoViewOnly(role);
  const showIntake = canReceivePo(role);
  const showEdit = canEditPoHeader(role);
  const showDelete = canDeletePo(role);
  const [toast, setToast] = useState<string | null>(null);

  const { data: rows } = usePoListRowsQuery();
  const list = useMemo(() => rows ?? [], [rows]);
  const statsReady = rows !== undefined;

  const stats = useMemo(() => {
    if (!statsReady) return undefined;
    const active = list.filter((p) => p.status === "progress");
    const doneMonth = list.filter((p) => p.status === "done").length;
    const propertyCount = list.reduce((n, p) => n + p.count, 0);
    const avgPerPo =
      list.length > 0 ? (propertyCount / list.length).toFixed(1) : "0";
    return {
      active: active.length,
      doneMonth,
      propertyCount,
      avgPerPo,
    };
  }, [list, statsReady]);

  async function handleDeletePo(poNumber: string) {
    if (
      !window.confirm(
        `حذف أمر العمل «${poNumber}» وجميع عقاراته؟ لا يمكن التراجع.`,
      )
    ) {
      return;
    }
    const result = await deletePoRecord(poNumber);
    if (!result.ok) {
      setToast(result.error);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: prototypeKeys.all });
    setToast(`تم حذف أمر العمل «${poNumber}» وعقاراته.`);
  }

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(t);
  }, [toast]);

  return (
    <>
      {toast ? (
        <div className="note note-success reg-users-toast" role="status">
          {toast}
        </div>
      ) : null}

      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="stat-label">PO نشطة</div>
          <StatValue value={stats?.active} />
        </div>
        <div className="stat-card green">
          <div className="stat-label">مكتملة هذا الشهر</div>
          <StatValue value={stats?.doneMonth} />
        </div>
        <div className="stat-card warn">
          <div className="stat-label">عقارات نشطة</div>
          <StatValue value={stats?.propertyCount} />
        </div>
        <div className="stat-card">
          <div className="stat-label">متوسط العقارات/PO</div>
          <StatValue value={stats?.avgPerPo} />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">أوامر العمل الواردة من إنفاذ</span>
          {showIntake ? (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => router.push(poIntakePath())}
            >
              + استلام PO جديد
            </button>
          ) : null}
        </div>
        <table className="tbl tbl-po-list" data-pending={!statsReady}>
          <thead>
            <tr>
              <th>رقم PO</th>
              <th>نوع الإسناد</th>
              <th>العقارات</th>
              <th>المكتملة</th>
              <th>التقدم</th>
              <th>الحالة</th>
              <th>تاريخ الاستلام</th>
              <th>تاريخ الاستحقاق</th>
              <th>الأخصائي</th>
              <th aria-label="عرض العقارات" />
              <th />
            </tr>
          </thead>
          <tbody>
            {statsReady && list.length === 0 ? (
              <tr className="tbl-empty">
                <td
                  colSpan={11}
                  style={{ textAlign: "center", color: "var(--text3)" }}
                >
                  {viewOnly
                    ? "لا توجد أوامر عمل."
                    : "لا توجد أوامر عمل — استلم أمر عمل جديداً من إنفاذ."}
                </td>
              </tr>
            ) : statsReady ? (
              list.map((p) => (
                <tr key={p.id}>
                  <td className="id-cell">
                    <PoNumber value={p.id} />
                  </td>
                  <td>
                    <span
                      className={`badge ${assignmentTypeBadgeClass(p.type)}`}
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
                          width: `${p.count > 0 ? Math.round((p.done / p.count) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td style={{ color: "var(--text3)", fontSize: 11 }}>
                    {p.date}
                  </td>
                  <td style={{ fontSize: 11 }}>
                    {p.dueDate ? (
                      <span
                        className={
                          isPastDue(p.dueDate) && p.status === "progress"
                            ? "badge b-cancel"
                            : ""
                        }
                      >
                        {formatDateAr(p.dueDate)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={{ fontSize: 11 }}>{p.specialist}</td>
                  <td>
                    <EyeIconButton
                      href={poPropertiesPath(p.id)}
                      label={`عرض عقارات ${p.id}`}
                    />
                  </td>
                  <td>
                    <div
                      style={{ display: "flex", gap: 4, flexWrap: "wrap" }}
                    >
                      {showEdit ? (
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() =>
                            router.push(poHeaderEditPath(p.id))
                          }
                        >
                          تعديل
                        </button>
                      ) : null}
                      {showDelete ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger-outline"
                          onClick={() => void handleDeletePo(p.id)}
                        >
                          حذف
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
