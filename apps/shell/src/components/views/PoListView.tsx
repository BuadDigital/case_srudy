"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { StatValue } from "@/components/ui/StatValue";
import { usePrototype } from "@/contexts/PrototypeContext";
import { StatusBadge } from "@platform/design-system";
import {
  assignmentTypeBadgeClass,
  formatDateAr,
  isPastDue,
} from "@/lib/prototype/po-intake-data";
import { deletePoRecord } from "@/lib/prototype/po-intake-storage";
import { prototypeKeys } from "@/lib/query/prototype-keys";
import {
  usePoListRowsQuery,
  usePoRecordQuery,
} from "@/lib/query/prototype-queries";
import {
  canDeletePo,
  canEditPoHeader,
  canReceivePo,
  isPoViewOnly,
} from "@/lib/prototype/po-roles";
import { PoIntakeFlow } from "@/components/prototype/po-intake/PoIntakeFlow";
import { PoHeaderEdit } from "@/components/prototype/po-intake/PoHeaderEdit";
import { PoDetailView } from "@/components/prototype/po-intake/PoDetailView";

type PoMode = "list" | "intake" | "edit" | "view";

export function PoListView() {
  const queryClient = useQueryClient();
  const { role } = usePrototype();
  const viewOnly = isPoViewOnly(role);
  const showIntake = canReceivePo(role);
  const showEdit = canEditPoHeader(role);
  const showDelete = canDeletePo(role);
  const [mode, setMode] = useState<PoMode>("list");
  const [activePoNumber, setActivePoNumber] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { data: rows } = usePoListRowsQuery();
  const detailPo =
    (mode === "view" || mode === "edit") && activePoNumber ? activePoNumber : null;
  const { data: detailRecord, isPending: detailPending } =
    usePoRecordQuery(detailPo);

  const list = rows ?? [];
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

  if (mode === "intake") {
    return (
      <PoIntakeFlow
        onCompleteAction={(record) => {
          void queryClient.invalidateQueries({ queryKey: prototypeKeys.all });
          setToast(
            `تم استلام أمر العمل «${record.poNumber}» — ${record.properties.length} عقار.`,
          );
        }}
        onBackAction={() => setMode("list")}
      />
    );
  }

  if (detailPo) {
    if (detailPending && !detailRecord) {
      return null;
    }
    if (detailRecord) {
      if (mode === "view") {
        return (
          <PoDetailView
            record={detailRecord}
            showEditHeader={showEdit}
            onEditHeaderAction={
              showEdit
                ? () => {
                    setMode("edit");
                  }
                : undefined
            }
            onBackAction={() => {
              setMode("list");
              setActivePoNumber(null);
            }}
          />
        );
      }
      return (
        <PoHeaderEdit
          record={detailRecord}
          onBackAction={() => {
            setMode("list");
            setActivePoNumber(null);
          }}
          onSavedAction={() => {
            void queryClient.invalidateQueries({ queryKey: prototypeKeys.all });
            setToast(`تم تحديث أمر العمل «${activePoNumber}».`);
            setMode("list");
            setActivePoNumber(null);
          }}
        />
      );
    }
    return (
      <div className="note note-warn" style={{ margin: 16 }}>
        لم يُعثر على أمر العمل.
      </div>
    );
  }

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
              onClick={() => setMode("intake")}
            >
              + استلام PO جديد
            </button>
          ) : null}
        </div>
        <table className="tbl" data-pending={!statsReady}>
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
              <th />
            </tr>
          </thead>
          <tbody>
            {statsReady && list.length === 0 ? (
              <tr className="tbl-empty">
                <td
                  colSpan={10}
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
                  <td className="id-cell">{p.id}</td>
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
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => {
                          setActivePoNumber(p.id);
                          setMode("view");
                        }}
                      >
                        عرض
                      </button>
                      {showEdit ? (
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => {
                            setActivePoNumber(p.id);
                            setMode("edit");
                          }}
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
