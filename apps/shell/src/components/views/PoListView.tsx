"use client";
import { useCallback, useEffect, useState } from "react";
import { usePrototype } from "@/contexts/PrototypeContext";
import { StatusBadge } from "@platform/design-system";
import type { PoRow } from "@/lib/prototype/constants";
import type { PoIntakeRecord } from "@/lib/prototype/po-intake-data";
import {
  assignmentTypeBadgeClass,
  formatDateAr,
  isPastDue,
} from "@/lib/prototype/po-intake-data";
import {
  deletePoRecord,
  getPoRecord,
  loadPoListRows,
} from "@/lib/prototype/po-intake-storage";
import { WORK_ORDERS_CHANGED_EVENT } from "@/lib/work-orders-api-config";
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
  const { role } = usePrototype();
  const viewOnly = isPoViewOnly(role);
  const showIntake = canReceivePo(role);
  const showEdit = canEditPoHeader(role);
  const showDelete = canDeletePo(role);
  const [mode, setMode] = useState<PoMode>("list");
  const [activePoNumber, setActivePoNumber] = useState<string | null>(null);
  const [rows, setRows] = useState<PoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailRecord, setDetailRecord] = useState<PoIntakeRecord | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await loadPoListRows();
    setRows(list);
    setLoading(false);
  }, []);

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
    await refresh();
    setToast(`تم حذف أمر العمل «${poNumber}» وعقاراته.`);
  }

  useEffect(() => {
    void refresh();
    const onChanged = () => void refresh();
    window.addEventListener(WORK_ORDERS_CHANGED_EVENT, onChanged);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener(WORK_ORDERS_CHANGED_EVENT, onChanged);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  useEffect(() => {
    if ((mode !== "view" && mode !== "edit") || !activePoNumber) {
      setDetailRecord(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    void getPoRecord(activePoNumber).then((record) => {
      if (cancelled) return;
      setDetailRecord(record);
      setDetailLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [mode, activePoNumber]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(t);
  }, [toast]);

  if (mode === "intake") {
    return (
      <PoIntakeFlow
        onCompleteAction={(record) => {
          void refresh();
          setToast(
            `تم استلام أمر العمل «${record.poNumber}» — ${record.properties.length} عقار.`,
          );
        }}
        onBackAction={() => setMode("list")}
      />
    );
  }

  if ((mode === "view" || mode === "edit") && activePoNumber) {
    if (detailLoading) {
      return (
        <div className="note note-info" style={{ margin: 16 }}>
          جاري تحميل أمر العمل…
        </div>
      );
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
            void refresh();
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

  const active = rows.filter((p) => p.status === "progress");
  const doneMonth = rows.filter((p) => p.status === "done").length;
  const propertyCount = rows.reduce((n, p) => n + p.count, 0);
  const avgPerPo =
    rows.length > 0 ? (propertyCount / rows.length).toFixed(1) : "0";

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
          <div className="stat-value">{active.length}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">مكتملة هذا الشهر</div>
          <div className="stat-value">{doneMonth}</div>
        </div>
        <div className="stat-card warn">
          <div className="stat-label">عقارات نشطة</div>
          <div className="stat-value">{propertyCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">متوسط العقارات/PO</div>
          <div className="stat-value">{avgPerPo}</div>
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
              <th>تاريخ الاستحقاق</th>
              <th>الأخصائي</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="tbl-empty">
                <td
                  colSpan={10}
                  style={{ textAlign: "center", color: "var(--text3)" }}
                >
                  جاري التحميل…
                </td>
              </tr>
            ) : rows.length === 0 ? (
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
            ) : (
              rows.map((p) => (
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
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
