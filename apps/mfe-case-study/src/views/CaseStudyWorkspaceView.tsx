"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { CaseStudyForm } from "../components/case-study/CaseStudyForm";
import { PropertyDetailHero } from "../components/po-intake/PropertyDetailHero";
import { PropertyTransactionTimeline } from "../components/po-intake/PropertyTransactionTimeline";
import { usePrototype } from "@platform/app-shared/contexts/PrototypeContext";
import { isSuperAdmin } from "@platform/app-shared/prototype/prototype-role-access";
import { activeCaseStudyPath } from "../lib/my-task-routes";
import { findPropertyForTask } from "../lib/prototype/my-task-row";
import { tasksForRole, type WorkflowTask } from "../lib/prototype/tasks-storage";
import {
  usePoRecordQuery,
  useWorkflowTasksQuery,
} from "../query/case-study-queries";

export type CaseStudyWorkspacePartiesExtrasProps = {
  task: WorkflowTask;
  property: ReturnType<typeof findPropertyForTask>;
  tasks: WorkflowTask[];
};

export function CaseStudyWorkspaceView({
  taskId,
  renderPartiesExtras,
}: {
  taskId: string;
  renderPartiesExtras?: (
    props: CaseStudyWorkspacePartiesExtrasProps,
  ) => ReactNode;
}) {
  const { role } = usePrototype();
  const {
    data: tasks,
    isFetched: tasksFetched,
    isPending: tasksPending,
  } = useWorkflowTasksQuery();

  const task = useMemo((): WorkflowTask | null => {
    return tasks?.find((t) => t.id === taskId) ?? null;
  }, [tasks, taskId]);

  const canAccess = useMemo(() => {
    if (!task) return false;
    if (isSuperAdmin(role)) return true;
    return tasksForRole(role, tasks ?? []).some((t) => t.id === taskId);
  }, [task, role, tasks, taskId]);

  const { data: record, isPending: recordLoading } = usePoRecordQuery(
    task?.poNumber ?? null,
  );

  const property = useMemo(
    () => (task && record ? findPropertyForTask(record, task) : null),
    [task, record],
  );

  const propertyIndex = useMemo(() => {
    if (!record || !property) return -1;
    return record.properties.findIndex((p) => p.id === property.id);
  }, [record, property]);

  const loading =
    (!tasksFetched && tasksPending) || (recordLoading && !record);

  if (!loading && (!task || !canAccess)) {
    return (
      <div className="po-property-detail-page pd-page">
        <div className="note note-warn" style={{ margin: 24 }}>
          لم تُعثر على معاملة دراسة الحالة أو لا تملك صلاحية عرضها.
          <div className="po-properties-empty-actions">
            <Link href={activeCaseStudyPath()} className="btn btn-sm">
              رجوع لدراسة حالة العقارات
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !task) {
    return (
      <div className="po-property-detail-page pd-page">
        <p className="po-properties-loading" style={{ padding: 24 }}>
          جاري تحميل دراسة الحالة…
        </p>
      </div>
    );
  }

  if (!record || !property || propertyIndex < 0) {
    return (
      <div className="po-property-detail-page pd-page">
        <div className="note note-warn" style={{ margin: 24 }}>
          لم تُعثر على بيانات العقار.
          <div className="po-properties-empty-actions">
            <Link href={activeCaseStudyPath()} className="btn btn-sm">
              رجوع لدراسة حالة العقارات
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="po-property-detail-page pd-page">
      <article className="po-property-detail-shell">
        <PropertyDetailHero
          record={record}
          property={property}
          propertyIndex={propertyIndex + 1}
        />

        <div className="po-property-detail-tabs-wrap">
          <div className="pd-body-row">
            <div className="pd-tab-content">
              <CaseStudyForm
                taskId={taskId}
                task={task}
                property={property}
                poRecord={record}
                requestDateSeed={record.receivedFromEnfathAt}
              />
              {renderPartiesExtras ? (
                <div className="case-study-workspace-extras">
                  {renderPartiesExtras({
                    task,
                    property,
                    tasks: tasks ?? [],
                  })}
                </div>
              ) : null}
            </div>
            <PropertyTransactionTimeline record={record} property={property} />
          </div>
        </div>
      </article>
    </div>
  );
}
