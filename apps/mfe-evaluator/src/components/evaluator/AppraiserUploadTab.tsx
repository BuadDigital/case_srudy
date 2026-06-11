"use client";

import { useMemo } from "react";
import { CaseStudyForm, findPropertyForTask } from "@case-study/mfe";
import type { PartyTaskPageDef } from "@platform/app-shared/prototype/party-task-pages";
import type { WorkflowTask } from "@case-study/mfe";
import { partyIdForRoleId } from "@settings/mfe";
import { EvaluatorWindow } from "./EvaluatorWindow";
import type { EvaluatorWindowHostRefObject } from "../../lib/evaluator/evaluator-window-host";
import {
  usePoRecordQuery,
  useWorkflowTasksQuery,
} from "../../query/evaluator-queries";

function resolveParentCaseStudyTask(
  task: WorkflowTask,
  all: WorkflowTask[],
): WorkflowTask | null {
  if (task.kind === "case-study-property") return task;
  if (task.parentTaskId) {
    const parent = all.find((t) => t.id === task.parentTaskId);
    if (parent) return parent;
  }
  return (
    all.find(
      (t) =>
        t.kind === "case-study-property" &&
        t.poNumber === task.poNumber &&
        t.propertyId === task.propertyId,
    ) ?? null
  );
}

export function AppraiserUploadTab({
  def,
  childTask,
  hostRef,
}: {
  def: PartyTaskPageDef;
  childTask: WorkflowTask;
  hostRef: EvaluatorWindowHostRefObject;
}) {
  const partyId = partyIdForRoleId(def.roleId);
  const { data: tasks } = useWorkflowTasksQuery();
  const { data: record, isPending: recordLoading } = usePoRecordQuery(
    childTask.poNumber,
  );

  const parentTask = useMemo(
    () => resolveParentCaseStudyTask(childTask, tasks ?? []),
    [childTask, tasks],
  );

  const property = useMemo(
    () =>
      record && parentTask ? findPropertyForTask(record, parentTask) : null,
    [record, parentTask],
  );

  if (!partyId) {
    return (
      <div className="note note-warn">
        لا يوجد طرف مطابق لهذا الدور في مصفوفة علاقة المستخدم بالمعلومة.
      </div>
    );
  }

  if (recordLoading && !record) {
    return <p className="po-properties-loading">جاري التحميل…</p>;
  }

  if (!parentTask) {
    return (
      <div className="note note-warn">
        لم تُعثر على معاملة دراسة الحالة الأم لهذا العقار. أكمل التوزيع أولاً.
      </div>
    );
  }

  return (
    <div className="appraiser-upload-tab">
      <EvaluatorWindow
        task={childTask}
        tasks={tasks ?? []}
        hostRef={hostRef}
      />

      <div className="appraiser-upload-tab__questions">
        <CaseStudyForm
          taskId={childTask.id}
          task={parentTask}
          property={property}
          poRecord={record ?? undefined}
          requestDateSeed={record?.receivedFromEnfathAt}
          variant="party"
          partyId={partyId}
          partyChildTaskId={childTask.id}
          parentFormTaskId={parentTask.id}
          partyAdvisory
        />
      </div>
    </div>
  );
}
