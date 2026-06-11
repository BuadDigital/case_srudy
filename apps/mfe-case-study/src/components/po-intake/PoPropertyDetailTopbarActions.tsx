"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { usePrototype } from "@platform/app-shared/contexts/PrototypeContext";
import { canEditProperty } from "../../lib/prototype/po-roles";
import {
  poPropertyEditPath,
} from "../../lib/po-routes";
import { caseStudyWorkspacePath } from "../../lib/my-task-routes";
import { caseStudyTaskForProperty } from "../../lib/prototype/tasks-storage";
import { usePoRecordQuery, useWorkflowTasksQuery } from "../../query/case-study-queries";

export function PoPropertyDetailTopbarActions({
  poNumber,
  propertyId,
}: {
  poNumber: string;
  propertyId: string;
}) {
  const router = useRouter();
  const { role } = usePrototype();
  const showEdit = canEditProperty(role);
  const { data: record } = usePoRecordQuery(poNumber);
  const { data: tasks = [] } = useWorkflowTasksQuery();

  const property = useMemo(
    () => record?.properties.find((item) => item.id === propertyId) ?? null,
    [record, propertyId],
  );

  const task = useMemo(() => {
    if (!record || !property) return null;
    return caseStudyTaskForProperty(record.poNumber.trim(), property.id, tasks);
  }, [record, property, tasks]);

  if (!record || !property) return null;

  const needsBourse = !property.bourseDataCompleted;

  return (
    <div className="topbar-actions" aria-label="إجراءات العقار">
      {showEdit ? (
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => router.push(poPropertyEditPath(poNumber, property.id))}
        >
          تعديل العقار
        </button>
      ) : null}
      {needsBourse ? (
        <Link href="/bourse-inquiry" className="btn btn-sm">
          استعلام البورصة
        </Link>
      ) : null}
      {task ? (
        <Link
          href={caseStudyWorkspacePath(task.id)}
          className="btn btn-sm btn-primary"
        >
          فتح دراسة الحالة
        </Link>
      ) : null}
    </div>
  );
}
