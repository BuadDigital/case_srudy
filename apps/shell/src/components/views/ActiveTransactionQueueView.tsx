"use client";

import type { MutableRefObject, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PoNumber } from "@/components/ui/PoNumber";
import { RemainingTimeCell } from "@/components/ui/RemainingTimeCell";
import { getAuthSession } from "@platform/auth-client";
import { usePrototype } from "@/contexts/PrototypeContext";
import type { RoleId } from "@platform/types";
import {
  buildDistributionTableRow,
  buildPrimaryDataTableRow,
  compareQueueTasksOldestFirst,
  findPropertyForTask,
} from "@/lib/prototype/my-task-row";
import type { PoIntakeRecord } from "@/lib/prototype/po-intake-data";
import {
  tasksForPartyAssignee,
  tasksForRole,
  type WorkflowTask,
} from "@/lib/prototype/tasks-storage";
import {
  usePoRecordsQuery,
  useWorkflowTasksQuery,
} from "@/lib/query/prototype-queries";
import { useQueryClient } from "@tanstack/react-query";
import { prototypeKeys } from "@/lib/query/prototype-keys";

export type ActiveTransactionQueueTableLayout = "primary-data" | "distribution";

export type ActiveTransactionQueueConfig = {
  pageTitle: string;
  /** Hide in-page hero title when the top bar already shows the same label. */
  hidePageTitle?: boolean;
  emptyLine: string;
  emptyHint: string;
  panelId: string;
  /** Column set for the queue table (default: primary-data). */
  tableLayout?: ActiveTransactionQueueTableLayout;
  /** Hint under the queue table; defaults to distribution wording. */
  tableHint?: string;
  /** Filter by prototype assignee id from توزيع المعاملات. */
  partyAssignee?: boolean;
  /** Role whose queue is shown (party pages); CDO uses this to see all assignees. */
  assigneeRole?: RoleId;
  getBasePath: () => string;
  getTaskPath: (taskId: string) => string;
  /** Navigate to a dedicated page instead of opening the side panel. */
  fullPageTaskPath?: (taskId: string) => string;
  filterListed: (
    mine: WorkflowTask[],
    poByNumber: Map<string, PoIntakeRecord>,
  ) => WorkflowTask[];
};

export type ActiveQueueApi = {
  listed: WorkflowTask[];
  poByNumber: Map<string, PoIntakeRecord>;
  openTask: (taskId: string) => void;
  closePanel: () => void;
  setAdvancing: (value: boolean) => void;
  syncQueue: () => Promise<void>;
};

type PanelRenderProps = {
  task: WorkflowTask;
  onRefresh: () => void;
  onClose: () => void;
};

export function ActiveTransactionQueueView({
  config,
  renderPanel,
  queueApiRef,
}: {
  config: ActiveTransactionQueueConfig;
  renderPanel?: (props: PanelRenderProps) => ReactNode;
  queueApiRef?: MutableRefObject<ActiveQueueApi | null>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const selectedId = searchParams.get("task");
  const { role, viewerEmail: personaEmail } = usePrototype();
  const {
    data: tasks,
    refetch: refetchTasks,
    isFetched: tasksFetched,
  } = useWorkflowTasksQuery();
  const {
    data: poRecords = [],
    isFetched: poRecordsFetched,
  } = usePoRecordsQuery();
  const queueReady = tasksFetched && poRecordsFetched;
  const isLoading = !queueReady;
  const [now, setNow] = useState(() => new Date());
  const [panelOpen, setPanelOpen] = useState(() => Boolean(selectedId));
  const advancingRef = useRef(false);
  const [, bump] = useState(0);

  const refreshWork = useCallback(() => {
    bump((n) => n + 1);
    void refetchTasks();
  }, [refetchTasks]);

  const syncQueue = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: prototypeKeys.poRecords() });
    await queryClient.invalidateQueries({
      queryKey: prototypeKeys.workflowTasks(),
    });
    bump((n) => n + 1);
    await refetchTasks();
  }, [queryClient, refetchTasks]);

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (selectedId) setPanelOpen(true);
    else setPanelOpen(false);
  }, [selectedId]);

  const poByNumber = useMemo(() => {
    const map = new Map<string, PoIntakeRecord>();
    for (const r of poRecords) map.set(r.poNumber.trim(), r);
    return map;
  }, [poRecords]);

  const mine = useMemo(() => {
    if (config.partyAssignee) {
      return tasksForPartyAssignee(
        role,
        tasks ?? [],
        config.assigneeRole,
        personaEmail ?? getAuthSession()?.user.email,
      );
    }
    return tasksForRole(role, tasks ?? []);
  }, [config.assigneeRole, config.partyAssignee, personaEmail, role, tasks]);

  const listed = useMemo(
    () =>
      config
        .filterListed(mine, poByNumber)
        .filter((t) => t.status === "open" || t.status === "blocked")
        .sort((a, b) => compareQueueTasksOldestFirst(a, b, poByNumber)),
    [config, mine, poByNumber],
  );

  const selectedTask = useMemo((): WorkflowTask | null => {
    if (!selectedId) return null;
    return listed.find((t) => t.id === selectedId) ?? null;
  }, [selectedId, listed]);

  const closePanel = useCallback(() => {
    router.replace(config.getBasePath(), { scroll: false });
  }, [router, config]);

  const useFullPage = Boolean(config.fullPageTaskPath);

  const openTask = useCallback(
    (taskId: string) => {
      if (config.fullPageTaskPath) {
        router.push(config.fullPageTaskPath(taskId));
        return;
      }
      setPanelOpen(true);
      router.replace(config.getTaskPath(taskId), { scroll: false });
    },
    [router, config],
  );

  const handleRowClick = useCallback(
    (taskId: string) => {
      if (useFullPage) {
        openTask(taskId);
        return;
      }
      if (selectedId === taskId) {
        closePanel();
        return;
      }
      openTask(taskId);
    },
    [useFullPage, selectedId, closePanel, openTask],
  );

  useEffect(() => {
    if (!queueApiRef) return;
    queueApiRef.current = {
      listed,
      poByNumber,
      openTask,
      closePanel,
      setAdvancing: (value) => {
        advancingRef.current = value;
      },
      syncQueue,
    };
  }, [queueApiRef, listed, poByNumber, openTask, closePanel, syncQueue]);

  useEffect(() => {
    if (advancingRef.current) return;
    if (!selectedId || isLoading) return;
    if (selectedTask) return;
    const stillExists = (tasks ?? []).some((t) => t.id === selectedId);
    if (!stillExists || listed.every((t) => t.id !== selectedId)) {
      closePanel();
    }
  }, [selectedId, selectedTask, isLoading, listed, closePanel, tasks]);

  const hasRail = !useFullPage && !isLoading && listed.length > 0 && renderPanel;
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
              {!config.hidePageTitle ? (
                <h1 className="po-properties-title">
                  <span>{config.pageTitle}</span>
                </h1>
              ) : null}
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
              <p>{config.emptyLine}</p>
              <p className="po-properties-hint" style={{ marginTop: 8 }}>
                {config.emptyHint}
              </p>
            </div>
          ) : (
            <>
              <div
                className={`po-properties-tbl-wrap${config.tableLayout === "distribution" ? " po-properties-tbl-wrap--scroll" : ""}`}
              >
                {config.tableLayout === "distribution" ? (
                  <table
                    className="tbl po-properties-tbl po-properties-tbl--compact po-properties-tbl--distribution"
                    data-pending={isLoading}
                  >
                    <colgroup>
                      <col className="po-dist-col-deed" />
                      <col className="po-dist-col-po" />
                      <col className="po-dist-col-city" />
                      <col className="po-dist-col-district" />
                      <col className="po-dist-col-type" />
                      <col className="po-dist-col-class" />
                      <col className="po-dist-col-area" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="po-pd-th-center">رقم الصك</th>
                        <th className="po-pd-th-center">أمر العمل</th>
                        <th className="po-pd-th-center">المدينة</th>
                        <th className="po-pd-th-center">الحي</th>
                        <th className="po-pd-th-center">نوع العقار</th>
                        <th className="po-pd-th-center">التصنيف</th>
                        <th className="po-pd-th-center">المساحة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listed.map((task) => {
                        const record = poByNumber.get(task.poNumber.trim());
                        const property = findPropertyForTask(record, task);
                        const row = buildDistributionTableRow(
                          task,
                          property,
                          record,
                        );
                        const active = selectedId === task.id;
                        return (
                          <tr
                            key={task.id}
                            className={`po-properties-row${active ? " po-bourse-row-active" : ""}`}
                            onClick={() => handleRowClick(task.id)}
                          >
                            <td className="po-pd-td-center">
                              <span className="id-cell po-num-ltr">
                                {row.deedLabel}
                              </span>
                            </td>
                            <td className="po-properties-cell-muted po-pd-td-center">
                              <PoNumber value={task.poNumber} link />
                            </td>
                            <td className="po-properties-cell-muted po-pd-td-center">
                              {row.city}
                            </td>
                            <td className="po-properties-cell-muted po-pd-td-center">
                              {row.district}
                            </td>
                            <td className="po-properties-cell-muted po-pd-td-center">
                              {row.propertyType}
                            </td>
                            <td className="po-properties-cell-muted po-pd-td-center">
                              {row.classification}
                            </td>
                            <td className="po-properties-cell-muted po-pd-td-center">
                              {row.area}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <table
                    className="tbl po-properties-tbl po-properties-tbl--compact po-properties-tbl--primary-data"
                    data-pending={isLoading}
                  >
                    <colgroup>
                      <col className="po-col-property-slot" />
                      <col className="po-col-po" />
                      <col className="po-col-assign-type" />
                      <col className="po-col-assign-spec" />
                      <col className="po-col-remaining" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="po-pd-th-center">رقم الصك</th>
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
                            onClick={() => handleRowClick(task.id)}
                          >
                            <td className="po-pd-td-center">
                              <span className="id-cell po-num-ltr">
                                {row.propertySlot}
                              </span>
                            </td>
                            <td className="po-properties-cell-muted po-pd-td-center">
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
                )}
              </div>
              <p className="po-properties-hint">
                {config.tableHint ??
                  (useFullPage
                    ? "اضغط الصف لفتح دراسة الحالة."
                    : "اضغط الصف لفتح التوزيع — اضغط نفس الصف مرة أخرى للإغلاق.")}
              </p>
            </>
          )}
        </article>

        {hasRail && renderPanel ? (
          <div
            id={config.panelId}
            className={`po-primary-data-panel-slot${panelOpen ? " is-open" : ""}`}
          >
            {panelOpen && selectedTask
              ? renderPanel({
                  task: selectedTask,
                  onRefresh: refreshWork,
                  onClose: closePanel,
                })
              : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
