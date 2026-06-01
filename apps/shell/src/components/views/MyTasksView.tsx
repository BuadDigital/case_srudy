"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PoNumber } from "@/components/ui/PoNumber";
import { RemainingTimeCell } from "@/components/ui/RemainingTimeCell";
import { CaseStudyTaskWork } from "@/components/views/MyTaskWorkView";
import { usePrototype } from "@/contexts/PrototypeContext";
import { myTasksPath } from "@/lib/my-task-routes";
import { filterTasksForPrimaryData } from "@/lib/prototype/active-transactions";
import {
  buildPrimaryDataTableRow,
  findPropertyForTask,
} from "@/lib/prototype/my-task-row";
import type { PoIntakeRecord } from "@/lib/prototype/po-intake-data";
import { loadPoRecords } from "@/lib/prototype/po-intake-storage";
import {
  loadWorkflowTasks,
  syncTasksFromPoRecords,
  tasksForRole,
  type WorkflowTask,
} from "@/lib/prototype/tasks-storage";
import { useWorkflowTasksQuery } from "@/lib/query/prototype-queries";

export function MyTasksView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("task");
  const { role } = usePrototype();
  const { data: tasks, refetch, isLoading } = useWorkflowTasksQuery();
  const [poRecords, setPoRecords] = useState<PoIntakeRecord[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [panelOpen, setPanelOpen] = useState(() => Boolean(selectedId));
  const [, bump] = useState(0);
  const refreshWork = useCallback(() => {
    bump((n) => n + 1);
    void refetch();
  }, [refetch]);

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    void loadPoRecords().then((records) => {
      syncTasksFromPoRecords(records);
      setPoRecords(records);
      void refetch();
    });
  }, [refetch]);

  useEffect(() => {
    if (selectedId) setPanelOpen(true);
    else setPanelOpen(false);
  }, [selectedId]);

  const poByNumber = useMemo(() => {
    const map = new Map<string, PoIntakeRecord>();
    for (const r of poRecords) map.set(r.poNumber.trim(), r);
    return map;
  }, [poRecords]);

  const mine = useMemo(
    () => tasksForRole(role, tasks ?? []),
    [role, tasks],
  );

  const byKind = useMemo(
    () => filterTasksForPrimaryData(mine, poByNumber),
    [mine, poByNumber],
  );

  const listed = useMemo(
    () =>
      byKind.filter((t) => t.status === "open" || t.status === "blocked"),
    [byKind],
  );

  const selectedTask = useMemo((): WorkflowTask | null => {
    if (!selectedId) return null;
    return listed.find((t) => t.id === selectedId) ?? null;
  }, [selectedId, listed]);

  const closePanel = useCallback(() => {
    router.replace(myTasksPath(), { scroll: false });
  }, [router]);

  const openTask = useCallback(
    (taskId: string) => {
      setPanelOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.set("task", taskId);
      router.replace(`${myTasksPath()}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const togglePanel = useCallback(() => {
    setPanelOpen((open) => !open);
  }, []);

  useEffect(() => {
    if (!selectedId || isLoading) return;
    if (selectedTask) return;
    const stillExists = loadWorkflowTasks().some((t) => t.id === selectedId);
    if (!stillExists || listed.every((t) => t.id !== selectedId)) {
      closePanel();
    }
  }, [selectedId, selectedTask, isLoading, listed, closePanel]);

  const hasRail = !isLoading && listed.length > 0;
  const layoutClass = [
    "po-primary-data-layout",
    hasRail ? "po-primary-data-layout--has-rail" : "",
    panelOpen && hasRail ? "po-primary-data-layout--panel-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="po-properties-page po-primary-data-page">
      <div className={layoutClass}>
        <article className="po-properties-shell po-properties-shell--compact po-bourse-queue-box">
          <header className="po-properties-hero po-properties-hero--compact po-bourse-queue-hero">
            <div className="po-properties-hero-main">
              <h1 className="po-properties-title">
                <span>البيانات الأولية</span>
              </h1>
              <div className="po-properties-meta">
                {!isLoading && listed.length > 0 ? (
                  <span className="po-properties-meta-count">
                    {listed.length}{" "}
                    {listed.length === 1 ? "معاملة" : "معاملات"}
                  </span>
                ) : null}
              </div>
            </div>
          </header>

          {isLoading ? (
            <p className="po-properties-loading">جاري تحميل المعاملات…</p>
          ) : listed.length === 0 ? (
            <div className="po-properties-empty">
              <p>لا توجد معاملات في «البيانات الأولية».</p>
              <p className="po-properties-hint" style={{ marginTop: 8 }}>
                تُنشأ خانات البيانات الأولية عند تسجيل أمر عمل بعدد العقارات
                المتوقع.
              </p>
            </div>
          ) : (
            <>
              <div className="po-properties-tbl-wrap">
                <table className="tbl po-properties-tbl po-properties-tbl--compact po-properties-tbl--primary-data">
                  <colgroup>
                    <col className="po-col-property-slot" />
                    <col className="po-col-po" />
                    <col className="po-col-assign-type" />
                    <col className="po-col-assign-spec" />
                    <col className="po-col-remaining" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="po-pd-th-center">رقم العقار</th>
                      <th className="po-pd-th-center">أمر العمل</th>
                      <th className="po-pd-th-center">نوع الإسناد</th>
                      <th className="po-pd-assign-spec">أخصائي الإسناد</th>
                      <th className="po-pd-th-center">المدة المتبقية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listed.map((task) => {
                      const record = poByNumber.get(task.poNumber.trim());
                      const property = findPropertyForTask(record, task);
                      const row = buildPrimaryDataTableRow(
                        task,
                        property,
                        record,
                        now,
                      );
                      const active = selectedId === task.id;
                      return (
                        <tr
                          key={task.id}
                          className={`po-properties-row${active ? " po-bourse-row-active" : ""}`}
                          onClick={() => openTask(task.id)}
                        >
                          <td className="po-pd-td-center">
                            <span className="id-cell po-num-ltr">
                              {row.propertySlot}
                            </span>
                          </td>
                          <td
                            className="po-properties-cell-muted po-pd-td-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <PoNumber value={task.poNumber} link />
                          </td>
                          <td className="po-properties-cell-muted po-pd-td-center">
                            {row.assignmentType}
                          </td>
                          <td
                            className="po-properties-cell-muted po-pd-assign-spec"
                            title={row.assignmentSpecialist}
                          >
                            {row.assignmentSpecialist}
                          </td>
                          <td className="po-pd-td-remaining">
                            <RemainingTimeCell state={row.remainingTime} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="po-properties-hint">
                اضغط الصف لفتح نموذج البيانات الأولية.
              </p>
            </>
          )}
        </article>

        {hasRail ? (
          <button
            type="button"
            className="po-primary-data-rail"
            onClick={togglePanel}
            aria-expanded={panelOpen}
            aria-controls="primary-data-panel"
            title={panelOpen ? "إخفاء النموذج" : "إظهار النموذج"}
          />
        ) : null}

        {hasRail ? (
          <div
            id="primary-data-panel"
            className={`po-primary-data-panel-slot${panelOpen ? " is-open" : ""}`}
          >
            {panelOpen && selectedTask ? (
              <CaseStudyTaskWork
                key={selectedTask.id}
                task={selectedTask}
                onRefresh={refreshWork}
                layout="panel"
                onClose={closePanel}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
