"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { PoRow } from "@platform/app-shared/prototype/constants";
import { StatValue } from "@case-study/mfe/components/ui/StatValue";
import { PoNumber } from "@case-study/mfe/components/ui/PoNumber";
import { RowMoreMenu } from "@case-study/mfe/components/ui/RowMoreMenu";
import { buildPoListRowMoreItems } from "../lib/prototype/po-list-row-menu";
import { usePrototype } from "@platform/app-shared/contexts/PrototypeContext";
import { formatDateAr, isPastDue } from "../lib/prototype/po-intake-data";
import { deletePoRecord } from "../lib/prototype/po-intake-storage";
import { poHeaderEditPath, poPropertiesPath } from "../lib/po-routes";
import { PoIntakeModal } from "@case-study/mfe/components/po-intake/PoIntakeModal";
import { prototypeKeys } from "@platform/app-shared/query/prototype-keys";
import { usePoListRowsQuery } from "@case-study/mfe/query/case-study-queries";
import {
  canDeletePo,
  canEditPoHeader,
  canReceivePo,
  isPoViewOnly,
} from "../lib/prototype/po-roles";

type SortKey = "po" | "received" | "due";
type SortDir = "asc" | "desc";
type StatusFilter = "" | "progress" | "done" | "under_study";

function isDueSoon(iso: string): boolean {
  if (!iso) return false;
  const due = new Date(iso.slice(0, 10));
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

function isDueUrgent(dueIso: string, status: PoRow["status"]): boolean {
  if (!dueIso || status === "done") return false;
  return isPastDue(dueIso) || isDueSoon(dueIso);
}

function progressClass(pct: number): string {
  if (pct >= 80) return "";
  if (pct >= 40) return "mid";
  return "low";
}

function poListStatusMeta(status: PoRow["status"]): {
  cls: string;
  label: string;
  dot: string;
} {
  if (status === "done") {
    return { cls: "badge-teal", label: "مكتمل", dot: "var(--teal)" };
  }
  if (status === "under_study") {
    return { cls: "badge-red", label: "معلق", dot: "var(--red)" };
  }
  return { cls: "badge-amber", label: "تنفيذ", dot: "var(--amber)" };
}

function PoListStatusBadge({ status }: { status: PoRow["status"] }) {
  const { cls, label, dot } = poListStatusMeta(status);
  return (
    <span className={`badge ${cls}`}>
      <span
        className="po-list-status-dot"
        style={{ background: dot }}
        aria-hidden
      />
      {label}
    </span>
  );
}

function SearchIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg
      className="po-list-sort-icon"
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M8 9l4-4 4 4M8 15l4 4 4-4" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M4 4h16v12H4zM4 12l4 4h8l4-4" />
    </svg>
  );
}

export function PoListView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { role } = usePrototype();
  const viewOnly = isPoViewOnly(role);
  const showIntake = canReceivePo(role);
  const showEdit = canEditPoHeader(role);
  const showDelete = canDeletePo(role);
  const [toast, setToast] = useState<{
    message: string;
    kind: "success" | "error";
  } | null>(null);
  const [deletingPo, setDeletingPo] = useState<string | null>(null);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("po");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!showIntake) return;
    if (searchParams.get("intake") !== "1") return;
    setIntakeOpen(true);
    router.replace("/po", { scroll: false });
  }, [showIntake, searchParams, router]);

  const { data: rows } = usePoListRowsQuery();
  const list = useMemo(() => rows ?? [], [rows]);
  const statsReady = rows !== undefined;

  const stats = useMemo(() => {
    if (!statsReady) return undefined;
    const propertyCount = list.reduce((n, p) => n + p.count, 0);
    const avgPerPo =
      list.length > 0 ? (propertyCount / list.length).toFixed(1) : "0";
    const doneMonth = list.filter((p) => p.status === "done").length;
    return {
      total: list.length,
      propertyCount,
      avgPerPo,
      doneMonth,
    };
  }, [list, statsReady]);

  const assignmentTypes = useMemo(
    () =>
      [...new Set(list.map((p) => p.type).filter((t) => t && t !== "—"))].sort(
        (a, b) => a.localeCompare(b, "ar"),
      ),
    [list],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = list.filter((row) => {
      const matchQ =
        !q ||
        row.id.toLowerCase().includes(q) ||
        row.type.toLowerCase().includes(q);
      const matchStatus = !statusFilter || row.status === statusFilter;
      const matchType = !typeFilter || row.type === typeFilter;
      return matchQ && matchStatus && matchType;
    });

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "po") {
        cmp = a.id.localeCompare(b.id);
      } else if (sortKey === "received") {
        cmp = (a.date || "").localeCompare(b.date || "");
      } else {
        cmp = (a.dueDate || "").localeCompare(b.dueDate || "");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [list, search, statusFilter, typeFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, filtered.length);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "po" ? "desc" : "asc");
  }

  async function handleDeletePo(poNumber: string) {
    if (
      !window.confirm(
        `حذف أمر العمل «${poNumber}» وجميع عقاراته؟ لا يمكن التراجع.`,
      )
    ) {
      return;
    }
    setDeletingPo(poNumber);
    const result = await deletePoRecord(poNumber);
    setDeletingPo(null);
    if (!result.ok) {
      setToast({ message: result.error, kind: "error" });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: prototypeKeys.all });
    setToast({
      message: `تم حذف أمر العمل «${poNumber}» وعقاراته.`,
      kind: "success",
    });
  }

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(t);
  }, [toast]);

  return (
    <>
      {showIntake ? (
        <PoIntakeModal
          open={intakeOpen}
          onClose={() => setIntakeOpen(false)}
          onComplete={(record) => {
            setIntakeOpen(false);
            void queryClient.invalidateQueries({ queryKey: prototypeKeys.all });
            router.push(poPropertiesPath(record.poNumber));
          }}
        />
      ) : null}

      {toast ? (
        <div
          className={`note reg-users-toast ${toast.kind === "success" ? "note-success" : "note-warn"}`}
          role="status"
        >
          {toast.message}
        </div>
      ) : null}

      <div className="po-list-page pd-page">
        <div className="po-list-body page-body">
          <div className="po-list-hd page-hd">
            <h1 className="page-title">أوامر العمل الواردة من إنفاذ</h1>
          </div>

          <div className="po-list-stats stats-row">
            <div className="stat-card">
              <div className="stat-label">إجمالي أوامر العمل</div>
              <StatValue value={stats?.total} className="stat-num" />
              <div className="stat-sub">PO نشط</div>
            </div>
            <div className="stat-card amber">
              <div className="stat-label">عقارات نشطة</div>
              <StatValue value={stats?.propertyCount} className="stat-num" />
              <div className="stat-sub">قيد المعالجة</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-label">متوسط العقارات / PO</div>
              <StatValue value={stats?.avgPerPo} className="stat-num" />
              <div className="stat-sub">عقار لكل أمر</div>
            </div>
            <div className="stat-card gray">
              <div className="stat-label">مكتملة هذا الشهر</div>
              <StatValue value={stats?.doneMonth} className="stat-num" />
              <div className="stat-sub">
                {statsReady ? `من ${stats?.total ?? 0} إجمالي` : "\u00a0"}
              </div>
            </div>
          </div>

          <div className="po-list-section section-card">
            <div className="section-hd">
              <div className="section-title">
                <ListIcon />
                قائمة أوامر العمل
              </div>
              <div className="section-actions">
                <button
                  type="button"
                  className="btn btn-sm"
                  title="تغيير العرض"
                  disabled
                >
                  <GridIcon />
                </button>
              </div>
            </div>

            <div className="filters-bar">
              <div className="search-wrap">
                <SearchIcon />
                <input
                  className="search-input"
                  type="search"
                  placeholder="بحث برقم PO أو نوع الإسناد…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="بحث أوامر العمل"
                />
              </div>
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
                aria-label="تصفية الحالة"
              >
                <option value="">جميع الحالات</option>
                <option value="progress">قيد التنفيذ</option>
                <option value="done">مكتمل</option>
                <option value="under_study">معلق</option>
              </select>
              <select
                className="filter-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="تصفية نوع الإسناد"
              >
                <option value="">جميع أنواع الإسناد</option>
                {assignmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <span className="filter-count">
                {statsReady ? `${filtered.length} نتيجة` : "—"}
              </span>
            </div>

            <div className="po-list-tbl-scroll">
              <table
                className="po-table"
                data-pending={!statsReady}
              >
                <thead>
                  <tr>
                    <th>
                      <button
                        type="button"
                        className="po-list-th-btn"
                        onClick={() => toggleSort("po")}
                      >
                        رقم PO
                        <SortIcon />
                      </button>
                    </th>
                    <th>نوع الإسناد</th>
                    <th>العقارات</th>
                    <th>المكتملة</th>
                    <th>التقدم</th>
                    <th>الحالة</th>
                    <th>
                      <button
                        type="button"
                        className="po-list-th-btn"
                        onClick={() => toggleSort("received")}
                      >
                        تاريخ الاستلام
                        <SortIcon />
                      </button>
                    </th>
                    <th>
                      <button
                        type="button"
                        className="po-list-th-btn"
                        onClick={() => toggleSort("due")}
                      >
                        تاريخ الاستحقاق
                        <SortIcon />
                      </button>
                    </th>
                    <th>الأخصائي</th>
                    <th aria-label="إجراءات" />
                  </tr>
                </thead>
                <tbody>
                  {statsReady && filtered.length === 0 ? (
                    <tr className="empty-row">
                      <td colSpan={10}>
                        <InboxIcon />
                        {list.length === 0
                          ? viewOnly
                            ? "لا توجد أوامر عمل."
                            : showIntake
                              ? "لا توجد أوامر عمل — استلم أمر عمل جديداً من إنفاذ."
                              : "لا توجد أوامر عمل."
                          : "لا توجد نتائج مطابقة"}
                      </td>
                    </tr>
                  ) : statsReady ? (
                    pageRows.map((p) => {
                      const pct =
                        p.count > 0
                          ? Math.round((p.done / p.count) * 100)
                          : 0;
                      const urgent = isDueUrgent(p.dueDate, p.status);
                      return (
                        <tr
                          key={p.id}
                          onClick={() => router.push(poPropertiesPath(p.id))}
                        >
                          <td>
                            <PoNumber
                              value={p.id}
                              link
                              className="po-num"
                            />
                          </td>
                          <td>{p.type}</td>
                          <td>
                            <strong>{p.count}</strong>
                          </td>
                          <td>{p.done}</td>
                          <td>
                            <div className="po-list-prog-wrap">
                              <div className="po-list-prog-track">
                                <div
                                  className={`po-list-prog-fill ${progressClass(pct)}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="po-list-prog-pct">{pct}%</span>
                            </div>
                          </td>
                          <td>
                            <PoListStatusBadge status={p.status} />
                          </td>
                          <td className="po-list-cell-muted">
                            {p.date ? (
                              <bdi dir="ltr" className="po-property-detail-ltr-val">
                                {formatDateAr(p.date)}
                              </bdi>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td
                            className={
                              urgent
                                ? "po-list-cell-urgent"
                                : "po-list-cell-muted"
                            }
                          >
                            {p.dueDate ? (
                              <bdi dir="ltr" className="po-property-detail-ltr-val">
                                {formatDateAr(p.dueDate)}
                              </bdi>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="po-list-cell-muted">{p.specialist}</td>
                          <td className="po-list-cell-actions">
                            <div
                              className="row-actions"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {showEdit ? (
                                <button
                                  type="button"
                                  className="icon-btn"
                                  title="تعديل"
                                  onClick={() =>
                                    router.push(poHeaderEditPath(p.id))
                                  }
                                >
                                  <EditIcon />
                                </button>
                              ) : null}
                              <RowMoreMenu
                                items={buildPoListRowMoreItems({
                                  poNumber: p.id,
                                  showEdit,
                                  showDelete,
                                  deleting: deletingPo === p.id,
                                  router,
                                  onDelete: () => void handleDeletePo(p.id),
                                })}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <span className="pag-info">
                {statsReady
                  ? `عرض ${rangeStart}–${rangeEnd} من ${filtered.length} نتيجة`
                  : "—"}
              </span>
              <div className="pag-btns">
                <button
                  type="button"
                  className="pag-btn"
                  disabled={safePage <= 1}
                  onClick={() => setPage((n) => Math.max(1, n - 1))}
                  aria-label="الصفحة السابقة"
                >
                  ›
                </button>
                <span className="pag-btn active" aria-current="page">
                  {safePage}
                </span>
                <button
                  type="button"
                  className="pag-btn"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((n) => Math.min(totalPages, n + 1))}
                  aria-label="الصفحة التالية"
                >
                  ‹
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
