"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePrototype } from "@/contexts/PrototypeContext";
import { StatusBadge, WorkflowStageBadge } from "@platform/design-system";
import {
  loadPoRecords,
  loadPropertyListItems,
  type PropertyListItem,
} from "@/lib/prototype/po-intake-storage";
import { WORK_ORDERS_CHANGED_EVENT } from "@/lib/work-orders-api-config";
import { ROLES } from "@/lib/prototype/constants";
import { getPropertyFailure } from "@/lib/prototype/failures-storage";
import { canEditProperty } from "@/lib/prototype/po-roles";
import { PoPropertyEdit } from "@/components/prototype/po-intake/PoPropertyEdit";
import { PoPropertyCreate } from "@/components/prototype/po-intake/PoPropertyCreate";
import { FailureReportForm } from "@/components/views/FailuresView";

type PropertiesMode = "list" | "edit" | "add" | "failure";

const AREA_FILTER_OPTIONS = [
  "جميع المناطق",
  "مكة المكرمة",
  "جدة",
  "الرياض",
  "الطائف",
  "المدينة المنورة",
  "الدمام",
] as const;

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "جميع الحالات" },
  { value: "new", label: "جديد" },
  { value: "progress", label: "قيد التنفيذ" },
  { value: "done", label: "مكتمل" },
  { value: "fail", label: "متعذر" },
] as const;

export function PropertiesListView() {
  const { role } = usePrototype();
  const showEdit = canEditProperty(role);
  const [mode, setMode] = useState<PropertiesMode>("list");
  const [editTarget, setEditTarget] = useState<{
    poNumber: string;
    propertyId: string;
  } | null>(null);
  const [failureTarget, setFailureTarget] = useState<{
    poNumber: string;
    propertyId: string;
    deedNumber: string;
  } | null>(null);
  const [addPoNumber, setAddPoNumber] = useState<string>("");
  const [items, setItems] = useState<PropertyListItem[]>([]);
  const [poOptions, setPoOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [areaFilter, setAreaFilter] =
    useState<(typeof AREA_FILTER_OPTIONS)[number]>("جميع المناطق");
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTER_OPTIONS)[number]["value"]>("all");

  const refresh = useCallback(async () => {
    setLoading(true);
    const [list, records] = await Promise.all([
      loadPropertyListItems(),
      loadPoRecords(),
    ]);
    setItems(list);
    setPoOptions(records.map((r) => r.poNumber));
    setLoading(false);
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

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (addPoNumber || poOptions.length === 0) return;
    setAddPoNumber(poOptions[0]);
  }, [addPoNumber, poOptions]);

  const filtered = useMemo(() => {
    return items.filter(({ row: p }) => {
      if (areaFilter !== "جميع المناطق" && !p.area.includes(areaFilter)) {
        return false;
      }
      if (statusFilter !== "all" && p.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [items, areaFilter, statusFilter]);

  if (mode === "failure" && failureTarget) {
    return (
      <FailureReportForm
        poNumber={failureTarget.poNumber}
        propertyId={failureTarget.propertyId}
        deedNumber={failureTarget.deedNumber}
        specialist={ROLES[role]?.name ?? "أخصائي"}
        onDone={() => {
          void refresh();
          setToast("تم تسجيل التعذر (مسودة داخلية).");
          setMode("list");
          setFailureTarget(null);
        }}
        onCancel={() => {
          setMode("list");
          setFailureTarget(null);
        }}
      />
    );
  }

  if (mode === "add") {
    const po = addPoNumber || poOptions[0];
    if (!po) {
      return (
        <div className="note note-warn" style={{ margin: 16 }}>
          لا توجد أوامر عمل لإضافة عقار.
        </div>
      );
    }
    return (
      <PoPropertyCreate
        poNumber={po}
        onBackAction={() => setMode("list")}
        onSavedAction={() => {
          void refresh();
          setToast(`تمت إضافة عقار إلى PO «${po}».`);
          setMode("list");
        }}
      />
    );
  }

  if (mode === "edit" && editTarget) {
    return (
      <PoPropertyEdit
        poNumber={editTarget.poNumber}
        propertyId={editTarget.propertyId}
        onBackAction={() => {
          setMode("list");
          setEditTarget(null);
        }}
        onSavedAction={() => {
          void refresh();
          setToast("تم تحديث بيانات العقار.");
          setMode("list");
          setEditTarget(null);
        }}
        onDeletedAction={() => {
          void refresh();
          setToast("تم حذف العقار من أمر العمل.");
          setMode("list");
          setEditTarget(null);
        }}
      />
    );
  }

  const total = items.length;
  const done = items.filter((x) => x.row.status === "done").length;
  const progress = items.filter((x) => x.row.status === "progress").length;
  const fail = items.filter((x) => x.row.status === "fail").length;

  return (
    <>
      {toast ? (
        <div className="note note-success reg-users-toast" role="status">
          {toast}
        </div>
      ) : null}
      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="stat-label">إجمالي العقارات</div>
          <div className="stat-value">{total}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">مكتملة</div>
          <div className="stat-value">{done}</div>
        </div>
        <div className="stat-card warn">
          <div className="stat-label">قيد التنفيذ</div>
          <div className="stat-value">{progress}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">متعذرة</div>
          <div className="stat-value">{fail}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">جميع العقارات</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {showEdit && poOptions.length > 0 ? (
              <>
                <select
                  className="form-control"
                  style={{ width: "auto", fontSize: 11 }}
                  aria-label="أمر العمل لإضافة عقار"
                  value={addPoNumber}
                  onChange={(e) => setAddPoNumber(e.target.value)}
                >
                  {poOptions.map((po) => (
                    <option key={po} value={po}>
                      PO {po}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    const po = addPoNumber || poOptions[0];
                    if (po) setAddPoNumber(po);
                    setMode("add");
                  }}
                >
                  + إضافة عقار
                </button>
              </>
            ) : null}
            <select
              className="form-control"
              style={{ width: "auto", fontSize: 11 }}
              aria-label="تصفية حسب المنطقة"
              value={areaFilter}
              onChange={(e) =>
                setAreaFilter(e.target.value as (typeof AREA_FILTER_OPTIONS)[number])
              }
            >
              {AREA_FILTER_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <select
              className="form-control"
              style={{ width: "auto", fontSize: 11 }}
              aria-label="تصفية حسب الحالة"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as (typeof STATUS_FILTER_OPTIONS)[number]["value"],
                )
              }
            >
              {STATUS_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>رقم العقار / الصك</th>
              <th>PO</th>
              <th>المنطقة</th>
              <th>النوع</th>
              <th>مفتاح</th>
              <th>رفع مساحي</th>
              <th>تقييم</th>
              <th>دراسة الحالة</th>
              <th>الأخصائي</th>
              <th>الحالة</th>
              {showEdit ? <th /> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="tbl-empty">
                <td
                  colSpan={showEdit ? 11 : 10}
                  style={{ textAlign: "center", color: "var(--text3)" }}
                >
                  جاري التحميل…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr className="tbl-empty">
                <td
                  colSpan={showEdit ? 11 : 10}
                  style={{ textAlign: "center", color: "var(--text3)" }}
                >
                  {total === 0
                    ? "لا توجد عقارات — سجّل عقارات عبر استلام أمر عمل جديد."
                    : "لا توجد عقارات تطابق التصفية."}
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const p = item.row;
                return (
                  <tr key={`${item.poNumber}-${item.propertyId}`}>
                    <td className="id-cell">{p.id}</td>
                    <td style={{ color: "var(--primary-light)", fontSize: 11 }}>
                      {p.po}
                    </td>
                    <td>{p.area}</td>
                    <td>{p.type}</td>
                    <td>
                      {p.key ? <span className="badge b-key">نعم</span> : "—"}
                    </td>
                    <td>
                      <WorkflowStageBadge stage={p.survey} />
                    </td>
                    <td>
                      <WorkflowStageBadge stage={p.val} />
                    </td>
                    <td>
                      <WorkflowStageBadge stage={p.study} />
                    </td>
                    <td style={{ fontSize: 11 }}>{p.specialist}</td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    {showEdit ? (
                      <td>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => {
                              setEditTarget({
                                poNumber: item.poNumber,
                                propertyId: item.propertyId,
                              });
                              setMode("edit");
                            }}
                          >
                            تعديل
                          </button>
                          {!getPropertyFailure(item.poNumber, item.propertyId) ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-danger-outline"
                              onClick={() => {
                                setFailureTarget({
                                  poNumber: item.poNumber,
                                  propertyId: item.propertyId,
                                  deedNumber: p.id,
                                });
                                setMode("failure");
                              }}
                            >
                              تعذر
                            </button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}