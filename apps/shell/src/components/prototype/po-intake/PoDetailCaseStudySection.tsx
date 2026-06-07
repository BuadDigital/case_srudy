"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CASE_STUDY_FORM_STEPS,
  caseStudyFormSummary,
} from "@/lib/prototype/case-study-form-data";
import {
  loadCaseStudyFormDraft,
  type CaseStudyFormDraft,
  type CaseStudyFormStatus,
  type CaseStudyMeterType,
} from "@/lib/prototype/case-study-form-storage";
import { formatDateAr } from "@/lib/prototype/po-intake-data";
import {
  caseStudyTaskForProperty,
  taskPhaseLabel,
  taskStatusLabel,
} from "@/lib/prototype/tasks-storage";
import { caseStudyWorkspacePath } from "@/lib/my-task-routes";
import { useWorkflowTasksQuery } from "@/lib/query/prototype-queries";

function DetailField({
  label,
  value,
  ltr,
}: {
  label: string;
  value: string;
  ltr?: boolean;
}) {
  if (!value || value === "—") return null;
  return (
    <div className="po-property-detail-field">
      <span className="po-property-detail-field-lbl">{label}</span>
      <span className="po-property-detail-field-val">
        {ltr ? (
          <bdi dir="ltr" className="po-property-detail-ltr-val">
            {value}
          </bdi>
        ) : (
          value
        )}
      </span>
    </div>
  );
}

function formStatusLabel(status: CaseStudyFormStatus): string {
  if (status === "submitted") return "مرفوع";
  if (status === "draft") return "مسودة";
  return "جديد";
}

function meterTypeLabel(value: CaseStudyMeterType): string {
  if (value === "electronic") return "إلكتروني";
  if (value === "analog") return "تناظري";
  if (value === "none") return "لا يوجد";
  return "";
}

function currentStepLabel(draft: CaseStudyFormDraft): string {
  const step = CASE_STUDY_FORM_STEPS[draft.currentStep];
  return step ? `الخطوة ${step.id} — ${step.label}` : "—";
}

export function PoDetailCaseStudySection({
  poNumber,
  propertyId,
}: {
  poNumber: string;
  propertyId: string;
}) {
  const { data: tasks } = useWorkflowTasksQuery();

  const task = useMemo(
    () => caseStudyTaskForProperty(poNumber, propertyId, tasks ?? []),
    [poNumber, propertyId, tasks],
  );

  const [draft, setDraft] = useState<CaseStudyFormDraft | null>(null);

  useEffect(() => {
    if (!task) {
      setDraft(null);
      return;
    }
    let cancelled = false;
    void loadCaseStudyFormDraft(task.id).then((loaded) => {
      if (!cancelled) setDraft(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [task?.id]);

  const summary = useMemo(
    () => (draft ? caseStudyFormSummary(draft.answers) : null),
    [draft],
  );

  if (!task) {
    return (
      <p className="po-property-detail-empty-contacts">
        لم تُنشأ بعد مهمة دراسة حالة لهذا العقار — تظهر بعد ربط الخانة
        بأمر العمل.
      </p>
    );
  }

  const taskBadge =
    task.status === "completed" || task.phase === "done"
      ? "b-done"
      : task.status === "blocked"
        ? "b-cancel"
        : "b-prog";

  return (
    <>
      <DetailField label="حالة المهمة" value={taskStatusLabel(task.status)} />
      <DetailField label="المرحلة" value={taskPhaseLabel(task.phase)} />
      <DetailField label="الأخصائي" value={task.assigneeName} />
      {draft ? (
        <>
          <DetailField
            label="حالة النموذج"
            value={formStatusLabel(draft.status)}
          />
          <DetailField label="رقم الطلب" value={draft.requestNumber} ltr />
          <DetailField
            label="تاريخ الطلب"
            value={draft.requestDate ? formatDateAr(draft.requestDate) : ""}
          />
          <DetailField label="رقم الصك (النموذج)" value={draft.sigDeed} ltr />
          {summary ? (
            <DetailField
              label="تقدم الأسئلة"
              value={`${summary.answered} من ${summary.total} (${summary.pct}%)`}
            />
          ) : null}
          <DetailField label="الخطوة الحالية" value={currentStepLabel(draft)} />
          {draft.sigApprover.trim() ? (
            <DetailField label="المعتمد" value={draft.sigApprover} />
          ) : null}
          {meterTypeLabel(draft.meterType) ? (
            <DetailField
              label="نوع العداد"
              value={meterTypeLabel(draft.meterType)}
            />
          ) : null}
          {draft.meterNumber.trim() ? (
            <DetailField label="رقم العداد" value={draft.meterNumber} ltr />
          ) : null}
          {draft.savedAtUtc ? (
            <DetailField
              label="آخر حفظ"
              value={formatDateAr(draft.savedAtUtc.slice(0, 10))}
            />
          ) : null}
        </>
      ) : (
        <p className="po-property-detail-empty-contacts">
          لم يُبدأ نموذج دراسة الحالة بعد — افتح مسار دراسة حالة العقارات
          لإكماله.
        </p>
      )}
      <p style={{ marginTop: 12 }}>
        <span className={`badge ${taskBadge}`} style={{ marginInlineEnd: 8 }}>
          {task.phase === "case-study"
            ? "دراسة الحالة"
            : taskPhaseLabel(task.phase)}
        </span>
        <Link href={caseStudyWorkspacePath(task.id)} className="btn btn-sm">
          فتح دراسة الحالة
        </Link>
      </p>
    </>
  );
}
