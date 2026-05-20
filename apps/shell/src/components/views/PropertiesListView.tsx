"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { StatValue } from "@/components/ui/StatValue";
import { usePrototype } from "@/contexts/PrototypeContext";
import { StatusBadge, WorkflowStageBadge } from "@platform/design-system";
import { prototypeKeys } from "@/lib/query/prototype-keys";
import {
  usePoRecordsQuery,
  usePropertyListItemsQuery,
} from "@/lib/query/prototype-queries";
import { ROLES } from "@/lib/prototype/constants";
import { getPropertyFailure } from "@/lib/prototype/failures-storage";
import { formatPoDisplay } from "@/lib/prototype/po-intake-data";
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

/** Show properties from every PO in the list. */
const ALL_PO_FILTER = "";

export function PropertiesListView() {
  const queryClient = useQueryClient();
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
  const [poFilter, setPoFilter] = useState<string>(ALL_PO_FILTER);
  const [toast, setToast] = useState<string | null>(null);
  const [areaFilter, setAreaFilter] =
    useState<(typeof AREA_FILTER_OPTIONS)[number]>("جميع المناطق");
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTER_OPTIONS)[number]["value"]>("all");

  const { data: items } = usePropertyListItemsQuery();
  const { data: poRecords } = usePoRecordsQuery();
  const list = items ?? [];
  const poOptions = useMemo(
    () => (poRecords ?? []).map((r) => r.poNumber),
    [poRecords],
  );
  const dataReady = items !== undefined;

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: prototypeKeys.all });

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    return list.filter((item) => {
      const p = item.row;
      if (poFilter && item.poNumber !== poFilter) {
        return false;
      }
      if (areaFilter !== "جميع المناطق" && !p.area.includes(areaFilter)) {
        return false;
      }
      if (statusFilter !== "all" && p.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [list, poFilter, areaFilter, statusFilter]);

  const stats = useMemo(() => {
    if (!dataReady) return undefined;
    return {
      total: list.length,
      done: list.filter((x) => x.row.status === "done").length,
      progress: list.filter((x) => x.row.status === "progress").length,
      fail: list.filter((x) => x.row.status === "fail").length,
    };
  }, [list, dataReady]);

  if (mode === "failure" && failureTarget) {
    return (
      <FailureReportForm
        poNumber={failureTarget.poNumber}
        propertyId={failureTarget.propertyId}
        deedNumber={failureTarget.deedNumber}
        specialist={ROLES[role]?.name ?? "أخصائي"}
        onDone={() => {
          invalidate();
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
    const po = poFilter || poOptions[0];
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
          invalidate();
          setToast(`تمت إضافة عقار إلى «${formatPoDisplay(po)}».`);
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
          invalidate();
          setToast("تم تحديث بيانات العقار.");
          setMode("list");
          setEditTarget(null);
        }}
        onDeletedAction={() => {
          invalidate();
          setToast("تم حذف العقار من أمر العمل.");
          setMode("list");
          setEditTarget(null);
        }}
      />
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
          <div className="stat-label">إجمالي العقارات</div>
          <StatValue value={stats?.total} />
        </div>
        <div className="stat-card green">
          <div className="stat-label">مكتملة</div>
          <StatValue value={stats?.done} />
        </div>
        <div className="stat-card warn">
          <div className="stat-label">قيد التنفيذ</div>
          <StatValue value={stats?.progress} />
        </div>
        <div className="stat-card red">
          <div className="stat-label">متعذرة</div>
          <StatValue value={stats?.fail} />
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
                  aria-label="تصفية حسب أمر العمل"
                  value={poFilter}
                  onChange={(e) => setPoFilter(e.target.value)}
                >
                  <option value={ALL_PO_FILTER}>All</option>
                  {poOptions.map((po) => (
                    <option key={po} value={po}>
                      {formatPoDisplay(po)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  disabled={!poFilter}
                  title={
                    poFilter
                      ? undefined
                      : "اختر أمر عمل محدداً (ليس All) لإضافة عقار"
                  }
                  onClick={() => {
                    if (!poFilter) return;
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
        <table className="tbl" data-pending={!dataReady}>
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
            {dataReady && filtered.length === 0 ? (
              <tr className="tbl-empty">
                <td
                  colSpan={showEdit ? 11 : 10}
                  style={{ textAlign: "center", color: "var(--text3)" }}
                >
                  {list.length === 0
                    ? "لا توجد عقارات — سجّل عقارات عبر استلام أمر عمل جديد."
                    : "لا توجد عقارات تطابق التصفية."}
                </td>
              </tr>
            ) : dataReady ? (
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
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}