"use client";

import { useMemo } from "react";
import { CaseStudyForm } from "@/components/prototype/case-study/CaseStudyForm";
import { partyIdForRoleId } from "@/lib/prototype/case-study-info-roles-data";
import { findPropertyForTask } from "@/lib/prototype/my-task-row";
import type { PartyTaskPageDef } from "@/lib/prototype/party-task-pages";
import type { WorkflowTask } from "@/lib/prototype/tasks-storage";
import {
  usePoRecordQuery,
  useWorkflowTasksQuery,
} from "@/lib/query/prototype-queries";

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

export function PartyCaseStudyFormTab({
  def,
  childTask,
}: {
  def: PartyTaskPageDef;
  childTask: WorkflowTask;
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
    <div className="party-cs-form-tab">
      <div className="note note-info party-cs-form-hint">
        تظهر جميع أسئلة نموذج الدراسة. يمكنك الإجابة فقط على الأسئلة المسندة لدورك
        في «علاقة المستخدم بالمعلومة»؛ الباقي للعرض فقط.
      </div>
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
      />
    </div>
  );
}
