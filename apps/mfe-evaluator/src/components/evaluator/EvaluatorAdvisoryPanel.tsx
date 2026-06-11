"use client";

import { useEffect, useMemo, useState } from "react";
import { RegistrationFormCard } from "@platform/app-shared/registration/RegistrationFormCard";
import type { WorkflowTask } from "@case-study/mfe";
import { findAppraisalChildForParent } from "../../lib/evaluator/evaluator-inspection-gate";
import { openEvaluatorReportPreview } from "../../lib/evaluator/evaluator-report-attachments";
import {
  approveEvaluatorRecall,
  getEvaluatorRecall,
  recallStatusLabel,
  rejectEvaluatorRecall,
} from "../../lib/evaluator/evaluator-recall-storage";
import {
  EVALUATOR_SUBMISSION_CHANGED_EVENT,
  loadEvaluatorSubmission,
} from "../../lib/evaluator/evaluator-submission-storage";
import {
  checklistAnswerLabel,
  EVALUATOR_CONDITIONAL_QUESTIONS,
  EVALUATOR_SIMPLE_QUESTIONS,
  evaluatorStatusLabel,
  formatEvaluatorPriceDisplay,
} from "../../lib/evaluator/evaluator-window-data";

export function EvaluatorAdvisoryPanel({
  parentTask,
  propertyId,
  tasks,
  onReopened,
}: {
  parentTask: WorkflowTask;
  propertyId: string;
  tasks: WorkflowTask[];
  onReopened?: () => void;
}) {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const refresh = () => setRefreshKey((k) => k + 1);
    window.addEventListener(EVALUATOR_SUBMISSION_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener(EVALUATOR_SUBMISSION_CHANGED_EVENT, refresh);
    };
  }, []);

  const appraisalTask = useMemo(
    () => findAppraisalChildForParent(parentTask.id, propertyId, tasks),
    [parentTask.id, propertyId, tasks, refreshKey],
  );

  const submission = useMemo(() => {
    if (!appraisalTask) return null;
    return loadEvaluatorSubmission(appraisalTask.id);
  }, [appraisalTask, refreshKey]);

  const recall = useMemo(() => {
    if (!appraisalTask) return null;
    return getEvaluatorRecall(appraisalTask.id);
  }, [appraisalTask, refreshKey]);

  if (!appraisalTask) {
    return (
      <RegistrationFormCard title="بيانات المقيم العقاري (استرشادي)">
        <p className="po-properties-hint">
          لم تُسند مهمة التقييم العقاري بعد لهذا العقار.
        </p>
      </RegistrationFormCard>
    );
  }

  if (!submission || submission.status === "draft") {
    return (
      <RegistrationFormCard title="بيانات المقيم العقاري (استرشادي)">
        <p className="po-properties-hint">
          المقيم لم يُرسل التقييم بعد — القيمة التقديرية تُحدَّد من المقيم فقط.
        </p>
      </RegistrationFormCard>
    );
  }

  function handleApproveRecall() {
    if (!appraisalTask) return;
    approveEvaluatorRecall(appraisalTask.id);
    setRefreshKey((k) => k + 1);
    onReopened?.();
  }

  function handleRejectRecall() {
    if (!appraisalTask) return;
    const note = window.prompt("سبب الرفض (اختياري):", "");
    if (note === null) return;
    rejectEvaluatorRecall(appraisalTask.id, note);
    setRefreshKey((k) => k + 1);
  }

  const allQuestions = [
    ...EVALUATOR_SIMPLE_QUESTIONS,
    ...EVALUATOR_CONDITIONAL_QUESTIONS,
  ];

  return (
    <RegistrationFormCard title="بيانات المقيم العقاري (استرشادي — للقراءة فقط)">
      <p className="evaluator-context-hint">
        هذه البيانات من المقيم بصفة أصيل — لا يُعدَّل السعر من الأخصائي. طلب
        الاستدعاء للتعديل يحتاج موافقتك.
      </p>

      {recall?.status === "pending" ? (
        <div className="note note-warn" style={{ marginBottom: 12 }}>
          <p>
            <strong>طلب استدعاء من المقيم</strong>
            {recall.reason ? ` — ${recall.reason}` : ""}
          </p>
          <div className="appraiser-submitted-actions" style={{ marginTop: 8 }}>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={handleApproveRecall}
            >
              الموافقة على الاستدعاء
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={handleRejectRecall}
            >
              رفض
            </button>
          </div>
        </div>
      ) : null}

      {recall && recall.status !== "pending" ? (
        <div className="cs-info-row">
          <span className="cs-info-label">طلب الاستدعاء</span>
          <span className="cs-info-value">{recallStatusLabel(recall.status)}</span>
        </div>
      ) : null}

      <div className="cs-info-row">
        <span className="cs-info-label">الحالة</span>
        <span className="cs-info-value">
          {evaluatorStatusLabel(submission.status)}
        </span>
      </div>
      <div className="cs-info-row">
        <span className="cs-info-label">سعر التقييم</span>
        <span className="cs-info-value evaluator-price-display">
          {formatEvaluatorPriceDisplay(submission.evaluatorPrice)}
        </span>
      </div>
      {submission.reportFileName ? (
        <div className="cs-info-row">
          <span className="cs-info-label">تقرير المقياس</span>
          <span className="cs-info-value">
            {submission.reportFileName}{" "}
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => openEvaluatorReportPreview(appraisalTask.id)}
            >
              معاينة PDF
            </button>
          </span>
        </div>
      ) : null}
      {submission.evaluatorNotes.trim() ? (
        <div className="cs-info-row">
          <span className="cs-info-label">ملاحظات المقيم</span>
          <span className="cs-info-value">{submission.evaluatorNotes}</span>
        </div>
      ) : null}

      <h4 className="evaluator-section-title" style={{ marginTop: 16 }}>
        قائمة الفحص
      </h4>
      <ul className="evaluator-advisory-checklist">
        {allQuestions.map((q) => (
          <li key={q.id}>
            <span>{q.label}</span>
            <strong>{checklistAnswerLabel(submission.checklist[q.id])}</strong>
          </li>
        ))}
        {submission.checklist.q_shared_deed === true ? (
          <>
            <li>
              <span>نطاق الملكية (صك مشاع)</span>
              <strong>
                {submission.checklist.shared_deed_scope === "full"
                  ? "كامل المساحة"
                  : submission.checklist.shared_deed_scope === "part"
                    ? "جزء محدد"
                    : "—"}
              </strong>
            </li>
            {submission.checklist.shared_deed_scope === "part" ? (
              <li>
                <span>نسبة الملكية</span>
                <strong>{submission.checklist.shared_deed_percentage || "—"}</strong>
              </li>
            ) : null}
          </>
        ) : null}
        {submission.checklist.q_lease_exists === true ? (
          <li>
            <span>عقد الإيجار ساري</span>
            <strong>
              {checklistAnswerLabel(submission.checklist.q_lease_active)}
            </strong>
          </li>
        ) : null}
        {submission.checklist.q_technical_notes_exists === true ? (
          <li>
            <span>ملاحظات فنية</span>
            <strong>{submission.checklist.technical_notes_text || "—"}</strong>
          </li>
        ) : null}
      </ul>
    </RegistrationFormCard>
  );
}
