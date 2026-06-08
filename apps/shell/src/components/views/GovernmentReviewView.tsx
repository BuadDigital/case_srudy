"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { InternalDelegationLetterPanel } from "@/components/government-review/InternalDelegationLetterPanel";
import { PoNumber } from "@/components/ui/PoNumber";
import { RegistrationFormCard } from "@/components/prototype/registration/RegistrationFormCard";
import { getAuthSession } from "@platform/auth-client";
import { usePrototype } from "@/contexts/PrototypeContext";
import {
  buildGovernmentReviewPoRows,
  courtGroupsForPo,
  type GovernmentReviewPoRow,
} from "@/lib/prototype/government-review-po";
import {
  delegationLetterForCourt,
  syncInternalDelegationLetters,
} from "@/lib/prototype/internal-delegation-letters";
import { partyTaskPageDef } from "@/lib/prototype/party-task-pages";
import { PartyActiveTaskWork } from "@/components/views/PartyActiveTaskWork";
import {
  taskDisplayPropertyLabel,
  type WorkflowTask,
} from "@/lib/prototype/tasks-storage";
import { formatPoDisplay } from "@/lib/prototype/po-intake-data";
import {
  reviewerCoverageLabel,
  reviewerScopeForRole,
} from "@/lib/prototype/reviewer-coverage";
import { tasksForPartyAssignee } from "@/lib/prototype/tasks-storage";
import {
  usePoRecordsQuery,
  useWorkflowTasksQuery,
} from "@/lib/query/prototype-queries";

function governmentReviewPoPath(poNumber: string): string {
  return `/government-review?po=${encodeURIComponent(poNumber)}`;
}

function governmentReviewTaskPath(poNumber: string, taskId: string): string {
  const q = new URLSearchParams({
    po: poNumber.trim(),
    task: taskId,
  });
  return `/government-review?${q.toString()}`;
}

function GovernmentReviewPoPanel({
  row,
  onClose,
  onRefresh,
  onOpenTask,
}: {
  row: GovernmentReviewPoRow;
  onClose: () => void;
  onRefresh: () => void;
  onOpenTask: (taskId: string) => void;
}) {
  const { data: poRecords = [] } = usePoRecordsQuery();
  const record = useMemo(
    () => poRecords.find((r) => r.poNumber.trim() === row.poNumber.trim()),
    [poRecords, row.poNumber],
  );
  const [, bump] = useState(0);
  const refreshLetters = useCallback(() => bump((n) => n + 1), []);

  useEffect(() => {
    if (!record) return;
    syncInternalDelegationLetters(record);
    refreshLetters();
  }, [record, refreshLetters]);

  const courtGroups = useMemo(
    () => courtGroupsForPo(record, row.courts),
    [record, row.courts],
  );

  return (
    <div className="card po-bourse-form-panel po-primary-data-form-panel">
      <div className="card-body">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div>
            <h2 className="card-title" style={{ marginBottom: 4 }}>
              {formatPoDisplay(row.poNumber)}
            </h2>
            <p className="reg-field-hint">
              {row.assignmentType} · {row.propertyCount} عقار · {row.openCount}{" "}
              مهمة مفتوحة
            </p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={onClose}
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>
        <RegistrationFormCard title="ملخص أمر العمل">
          <div className="note note-info">{row.primaryDataLabel}</div>
          {row.courts.length > 0 ? (
            <p className="reg-field-hint" style={{ marginTop: 8 }}>
              المحاكم: {row.courts.join(" · ")}
            </p>
          ) : (
            <p className="reg-field-hint" style={{ marginTop: 8 }}>
              لا توجد محاكم مسجّلة بعد في بيانات العقارات.
            </p>
          )}
        </RegistrationFormCard>

        <RegistrationFormCard title="مهام المراجعة (حسب العقار)">
          {row.tasks.length === 0 ? (
            <p className="reg-field-hint">لا توجد مهام مراجعة مرتبطة بهذا الأمر.</p>
          ) : (
            <ul className="sys-tools-perms-list" style={{ margin: 0 }}>
              {row.tasks.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    style={{ width: "100%", textAlign: "start" }}
                    onClick={() => onOpenTask(task.id)}
                  >
                    {taskDisplayPropertyLabel(task)} — {task.title}
                    {task.status === "open" ? (
                      <span className="badge b-prog" style={{ marginInlineStart: 8 }}>
                        مفتوحة
                      </span>
                    ) : (
                      <span className="badge b-done" style={{ marginInlineStart: 8 }}>
                        منجزة
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </RegistrationFormCard>

        {record
          ? courtGroups.map((group) => {
              const letter = delegationLetterForCourt(
                row.poNumber,
                group.court,
                record,
              );
              if (!letter) return null;
              return (
                <InternalDelegationLetterPanel
                  key={group.court}
                  letter={letter}
                  record={record}
                  onRefresh={() => {
                    refreshLetters();
                    onRefresh();
                  }}
                />
              );
            })
          : null}
      </div>
    </div>
  );
}

export function GovernmentReviewView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPo = searchParams.get("po");
  const selectedTaskId = searchParams.get("task");
  const { role, viewerEmail: personaEmail } = usePrototype();
  const def = partyTaskPageDef("government-review");
  const reviewerScope = reviewerScopeForRole(role);

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
  const [panelOpen, setPanelOpen] = useState(() => Boolean(selectedPo));

  useEffect(() => {
    setPanelOpen(Boolean(selectedPo || selectedTaskId));
  }, [selectedPo, selectedTaskId]);

  const poByNumber = useMemo(() => {
    const map = new Map<string, (typeof poRecords)[number]>();
    for (const record of poRecords) map.set(record.poNumber.trim(), record);
    return map;
  }, [poRecords]);

  const mine = useMemo(
    () =>
      tasksForPartyAssignee(
        role,
        tasks ?? [],
        "government-reviewer",
        personaEmail ?? getAuthSession()?.user.email,
      ),
    [personaEmail, role, tasks],
  );

  const rows = useMemo(
    () => buildGovernmentReviewPoRows(mine, poByNumber, reviewerScope),
    [mine, poByNumber, reviewerScope],
  );

  const selectedRow = useMemo(
    () =>
      selectedPo
        ? rows.find((row) => row.poNumber.trim() === selectedPo.trim()) ?? null
        : null,
    [rows, selectedPo],
  );

  const selectedTask = useMemo((): WorkflowTask | null => {
    if (!selectedTaskId) return null;
    const fromRow = selectedRow?.tasks.find((t) => t.id === selectedTaskId);
    if (fromRow) return fromRow;
    return mine.find((t) => t.id === selectedTaskId) ?? null;
  }, [selectedTaskId, selectedRow, mine]);

  const closePanel = useCallback(() => {
    router.replace("/government-review", { scroll: false });
  }, [router]);

  const openPo = useCallback(
    (poNumber: string) => {
      setPanelOpen(true);
      router.replace(governmentReviewPoPath(poNumber), { scroll: false });
    },
    [router],
  );

  const openTask = useCallback(
    (poNumber: string, taskId: string) => {
      setPanelOpen(true);
      router.replace(governmentReviewTaskPath(poNumber, taskId), { scroll: false });
    },
    [router],
  );

  const handleRowClick = useCallback(
    (poNumber: string) => {
      if (selectedPo?.trim() === poNumber.trim()) {
        closePanel();
        return;
      }
      openPo(poNumber);
    },
    [selectedPo, closePanel, openPo],
  );

  useEffect(() => {
    if (!selectedPo || !queueReady) return;
    if (rows.some((row) => row.poNumber.trim() === selectedPo.trim())) return;
    closePanel();
  }, [selectedPo, queueReady, rows, closePanel]);

  const refreshWork = useCallback(() => {
    void refetchTasks();
  }, [refetchTasks]);

  const hasRail = !queueReady ? false : rows.length > 0 || Boolean(selectedTask);
  const layoutClass = [
    "po-primary-data-layout",
    hasRail ? "po-primary-data-layout--has-rail" : "",
    panelOpen && hasRail && (selectedRow || selectedTask)
      ? "po-primary-data-layout--panel-open"
      : "",
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
                <span>{def?.pageTitle ?? "المراجعة الحكومية"}</span>
              </h1>
              <div className="po-properties-meta">
                <span className="po-properties-meta-count">
                  نطاق التغطية: {reviewerCoverageLabel(reviewerScope)}
                </span>
                {!queueReady ? null : (
                  <span className="po-properties-meta-count">
                    {rows.length} {rows.length === 1 ? "أمر عمل" : "أوامر عمل"}
                  </span>
                )}
              </div>
            </div>
          </header>

          {!queueReady ? (
            <p className="po-properties-loading">جاري تحميل أوامر العمل…</p>
          ) : rows.length === 0 ? (
            <div className="po-properties-empty">
              <p>{def?.emptyLine ?? "لا توجد مهام مراجعة حكومية."}</p>
              <p className="po-properties-hint" style={{ marginTop: 8 }}>
                {def?.emptyHint ??
                  "تظهر هنا بعد تأكيد التوزيع عند تفعيل المراجع الحكومي."}
              </p>
            </div>
          ) : (
            <>
              <div className="po-properties-tbl-wrap po-properties-tbl-wrap--scroll">
                <table className="tbl po-properties-tbl po-properties-tbl--compact">
                  <thead>
                    <tr>
                      <th className="po-pd-th-center">أمر العمل</th>
                      <th className="po-pd-th-center">نوع الإسناد</th>
                      <th className="po-pd-th-center">المحاكم</th>
                      <th className="po-pd-th-center">العقارات</th>
                      <th className="po-pd-th-center">مهام مفتوحة</th>
                      <th className="po-pd-th-center">البيانات الأولية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const active = selectedPo?.trim() === row.poNumber.trim();
                      return (
                        <tr
                          key={row.poNumber}
                          className={`po-properties-row${active ? " po-bourse-row-active" : ""}`}
                          onClick={() => handleRowClick(row.poNumber)}
                        >
                          <td className="po-pd-td-center">
                            <PoNumber value={row.poNumber} />
                          </td>
                          <td className="po-properties-cell-muted po-pd-td-center">
                            {row.assignmentType}
                          </td>
                          <td className="po-properties-cell-muted po-pd-td-center">
                            {row.courts.length > 0
                              ? row.courts.join(" · ")
                              : "—"}
                          </td>
                          <td className="po-properties-cell-muted po-pd-td-center">
                            {row.propertyCount}
                          </td>
                          <td className="po-pd-td-center">
                            {row.openCount > 0 ? (
                              <span className="badge b-prog">{row.openCount}</span>
                            ) : (
                              <span className="badge b-done">0</span>
                            )}
                          </td>
                          <td className="po-pd-td-center">
                            {row.primaryDataReady ? (
                              <span className="badge b-done">مكتمل</span>
                            ) : (
                              <span className="badge b-prog">ناقص</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="po-properties-hint po-bourse-queue-hint">
                اضغط صف أمر العمل لفتح مهام المراجعة وخطابات التفويض — اضغط
                مرة أخرى للإغلاق.
              </p>
            </>
          )}
        </article>

        {hasRail ? (
          <div
            id="government-review-panel"
            className={`po-primary-data-panel-slot${panelOpen && (selectedRow || selectedTask) ? " is-open" : ""}`}
          >
            {panelOpen && selectedTask && def ? (
              <PartyActiveTaskWork
                key={selectedTask.id}
                def={def}
                task={selectedTask}
                onRefresh={refreshWork}
                layout="panel"
                onClose={() => {
                  if (selectedPo) {
                    router.replace(governmentReviewPoPath(selectedPo), {
                      scroll: false,
                    });
                    return;
                  }
                  closePanel();
                }}
              />
            ) : panelOpen && selectedRow ? (
              <GovernmentReviewPoPanel
                row={selectedRow}
                onClose={closePanel}
                onRefresh={refreshWork}
                onOpenTask={(taskId) => openTask(selectedRow.poNumber, taskId)}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
