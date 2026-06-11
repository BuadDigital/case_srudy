"use client";

import type { MutableRefObject, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PoNumber } from "@case-study/mfe/components/ui/PoNumber";
import { RemainingTimeCell } from "@case-study/mfe/components/ui/RemainingTimeCell";
import { RowMoreMenu } from "@case-study/mfe/components/ui/RowMoreMenu";
import type { RowMoreMenuItem } from "@case-study/mfe/components/ui/RowMoreMenu";
import { PartyAssigneeCell } from "../components/ui/PartyAssigneeCell";
import { buildActiveQueueRowMoreItems } from "../lib/prototype/active-queue-row-menu";
import { buildCaseStudyPartyAssignees } from "../lib/prototype/case-study-tracks";
import { getAuthSession } from "@platform/auth-client";
import { usePrototype } from "@platform/app-shared/contexts/PrototypeContext";
import type { RoleId } from "@platform/types";
import { poPropertyDetailPath } from "../lib/po-routes";
import {
  buildDistributionTableRow,
  buildPrimaryDataTableRow,
  compareQueueTasksOldestFirst,
  findPropertyForTask,
} from "../lib/prototype/my-task-row";
import type { PoIntakeRecord } from "../lib/prototype/po-intake-data";
import { isTaskOnSuspendedProperty } from "../lib/prototype/suspended-transactions-storage";
import {
  tasksForPartyAssignee,
  tasksForRole,
  type WorkflowTask,
} from "../lib/prototype/tasks-storage";
import {
  usePoRecordsQuery,
  useWorkflowTasksQuery,
} from "@case-study/mfe/query/case-study-queries";
import { useQueryClient } from "@tanstack/react-query";
import { prototypeKeys } from "@platform/app-shared/query/prototype-keys";

export type ActiveTransactionQueueTableLayout =
  | "primary-data"
  | "distribution"
  | "case-study";

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
  /** Override row ⋮ menu (e.g. appraiser recall). */
  buildRowMoreItems?: (ctx: ActiveQueueRowMoreContext) => RowMoreMenuItem[];
  /** When false, row click does not open the work panel. */
  canOpenTask?: (task: WorkflowTask) => boolean;
  /** Replaces remaining-time cell when set (e.g. submission status). */
  getTaskStatusBadge?: (
    task: WorkflowTask,
  ) => { label: string; className: string } | null;
  statusColumnLabel?: string;
  /** Re-bump queue when these window events fire. */
  refreshOnWindowEvents?: string[];
  /** Stats / filters above the queue table (e.g. engineering office dashboard). */
  renderQueueHeader?: (listed: WorkflowTask[]) => ReactNode;
};

export type ActiveQueueRowMoreContext = {
  task: WorkflowTask;
  propertyId?: string;
  openTask: () => void;
  router: { push: (href: string) => void };
  refreshQueue: () => void;
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
    const events = config.refreshOnWindowEvents;
    if (!events?.length) return;
    const handler = () => refreshWork();
    for (const ev of events) window.addEventListener(ev, handler);
    return () => {
      for (const ev of events) window.removeEventListener(ev, handler);
    };
  }, [config.refreshOnWindowEvents, refreshWork]);

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
        .filter(
          (t) =>
            (t.status === "open" || t.status === "blocked") &&
            !isTaskOnSuspendedProperty(t),
        )
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
      const task = listed.find((t) => t.id === taskId);
      if (task && config.canOpenTask && !config.canOpenTask(task)) return;

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
    [useFullPage, selectedId, closePanel, openTask, listed, config],
  );

  const resolveRowMoreItems = useCallback(
    (task: WorkflowTask, propertyId: string | undefined) => {
      const ctx: ActiveQueueRowMoreContext = {
        task,
        propertyId,
        openTask: () => handleRowClick(task.id),
        router,
        refreshQueue: refreshWork,
      };
      if (config.buildRowMoreItems) {
        return config.buildRowMoreItems(ctx);
      }
      return buildActiveQueueRowMoreItems(ctx);
    },
    [config, handleRowClick, router, refreshWork],
  );

  const renderStatusOrRemaining = useCallback(
    (
      task: WorkflowTask,
      remainingTime: Parameters<typeof RemainingTimeCell>[0]["state"],
    ) => {
      const badge = config.getTaskStatusBadge?.(task);
      if (badge) {
        return (
          <span className={`badge ${badge.className}`}>{badge.label}</span>
        );
      }
      return <RemainingTimeCell state={remainingTime} />;
    },
    [config],
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

  const isDistributionTable =
    config.tableLayout === "distribution" ||
    config.tableLayout === "case-study";
  const showPartyColumns = config.tableLayout === "case-study";

  const handleDistributionRowClick = useCallback(
    (task: WorkflowTask, propertyId: string | undefined) => {
      if (showPartyColumns && propertyId) {
        router.push(
          poPropertyDetailPath(task.poNumber, propertyId, "basic"),
        );
        return;
      }
      handleRowClick(task.id);
    },
    [showPartyColumns, router, handleRowClick],
  );

  const hasRail = !useFullPage && !isLoading && listed.length > 0 && renderPanel;
  const layoutClass = [
    "po-primary-data-layout",
    hasRail ? "po-primary-data-layout--has-rail" : "",
    panelOpen && hasRail ? "po-primary-data-layout--panel-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="po-properties-page pd-page">
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

          {config.renderQueueHeader && !isLoading && listed.length > 0
            ? config.renderQueueHeader(listed)
            : null}

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
                className={`po-properties-tbl-wrap${isDistributionTable ? " po-properties-tbl-wrap--scroll" : ""}`}
              >
                {isDistributionTable ? (
                  <table
                    className={`tbl po-properties-tbl po-properties-tbl--compact po-properties-tbl--distribution${showPartyColumns ? " po-properties-tbl--case-study" : ""}`}
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
                      {showPartyColumns ? (
                        <>
                          <col className="po-dist-col-party" />
                          <col className="po-dist-col-party" />
                          <col className="po-dist-col-party" />
                          <col className="po-dist-col-party" />
                        </>
                      ) : null}
                      <col className="po-col-more" />
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
                        {showPartyColumns ? (
                          <>
                            <th className="po-pd-th-center">المعاين</th>
                            <th className="po-pd-th-center">المراجع الحكومي</th>
                            <th className="po-pd-th-center">المقيم</th>
                            <th className="po-pd-th-center">المكتب الهندسي</th>
                          </>
                        ) : null}
                        <th className="po-properties-th-more" aria-label="المزيد" />
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
                        const parties = showPartyColumns
                          ? buildCaseStudyPartyAssignees(task, tasks ?? [])
                          : [];
                        const active = selectedId === task.id;
                        const moreItems = resolveRowMoreItems(task, property?.id);
                        return (
                          <tr
                            key={task.id}
                            className={`po-properties-row${active ? " po-bourse-row-active" : ""}`}
                            onClick={() =>
                              handleDistributionRowClick(task, property?.id)
                            }
                          >
                            <td className="po-pd-td-center">
                              {property?.id ? (
                                <Link
                                  href={poPropertyDetailPath(
                                    task.poNumber,
                                    property.id,
                                    "basic",
                                  )}
                                  dir="ltr"
                                  className="id-cell po-num-ltr po-num-link"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {row.deedLabel}
                                </Link>
                              ) : (
                                <span className="id-cell po-num-ltr">
                                  {row.deedLabel}
                                </span>
                              )}
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
                            {showPartyColumns
                              ? parties.map((party) => (
                                  <td
                                    key={party.trackId}
                                    className="po-properties-cell-muted po-pd-td-center"
                                  >
                                    <PartyAssigneeCell party={party} />
                                  </td>
                                ))
                              : null}
                            <td className="po-properties-cell-more">
                              <RowMoreMenu items={moreItems} />
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
                      <col className="po-col-more" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="po-pd-th-center">رقم الصك</th>
                        <th className="po-pd-th-center">أمر العمل</th>
                        <th className="po-pd-th-center">نوع الإسناد</th>
                        <th className="po-pd-assign-spec">أخصائي الإسناد</th>
                        <th className="po-pd-th-center">
                          {config.statusColumnLabel ?? "المدة المتبقية"}
                        </th>
                        <th className="po-properties-th-more" aria-label="المزيد" />
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
                        const moreItems = resolveRowMoreItems(task, property?.id);
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
                              {renderStatusOrRemaining(task, row.remainingTime)}
                            </td>
                            <td className="po-properties-cell-more">
                              <RowMoreMenu items={moreItems} />
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
