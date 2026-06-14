"use client";

import { useEffect, useMemo, useState } from "react";
import { RegistrationFormCard } from "@platform/app-shared/registration/RegistrationFormCard";
import type { WorkflowTask } from "@case-study/mfe";
import { findSurveyChildForParent } from "../lib/engineering-survey-task";
import {
  ENGINEERING_SURVEY_SUBMISSION_CHANGED_EVENT,
  engineeringSurveyStatusLabel,
  loadEngineeringSurveySubmission,
  reopenEngineeringSurveySubmission,
} from "../lib/engineering-survey-submission-storage";

function formatCoordsDisplay(lat: string, lng: string): string {
  const latTrim = lat.trim();
  const lngTrim = lng.trim();
  if (!latTrim && !lngTrim) return "";
  if (latTrim && lngTrim) return `${latTrim}، ${lngTrim}`;
  return latTrim || lngTrim;
}

export function EngineeringSurveyAdvisoryPanel({
  parentTask,
  propertyId,
  tasks,
  onReturned,
}: {
  parentTask: WorkflowTask;
  propertyId: string;
  tasks: WorkflowTask[];
  onReturned?: () => void;
}) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnNote, setReturnNote] = useState("");
  const [returnError, setReturnError] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setRefreshKey((k) => k + 1);
    window.addEventListener(ENGINEERING_SURVEY_SUBMISSION_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener(
        ENGINEERING_SURVEY_SUBMISSION_CHANGED_EVENT,
        refresh,
      );
    };
  }, []);

  const surveyTask = useMemo(
    () => findSurveyChildForParent(parentTask.id, propertyId, tasks),
    [parentTask.id, propertyId, tasks, refreshKey],
  );

  const submission = useMemo(() => {
    if (!surveyTask) return null;
    return loadEngineeringSurveySubmission(surveyTask.id);
  }, [surveyTask, refreshKey]);

  if (!surveyTask) {
    return (
      <RegistrationFormCard title="بيانات المكتب الهندسي (استرشادي)">
        <p className="po-properties-hint">
          لم تُسند مهمة الرفع المساحي بعد لهذا العقار.
        </p>
      </RegistrationFormCard>
    );
  }

  if (!submission || submission.status === "draft") {
    return (
      <RegistrationFormCard title="بيانات المكتب الهندسي (استرشادي)">
        <p className="po-properties-hint">
          المكتب الهندسي لم يُرسل الرفع المساحي بعد.
        </p>
      </RegistrationFormCard>
    );
  }

  function handleReturnForCorrection() {
    if (!surveyTask) return;
    const trimmed = returnNote.trim();
    if (!trimmed) {
      setReturnError("يجب إدخال سبب الإرجاع للتصحيح");
      return;
    }
    reopenEngineeringSurveySubmission(surveyTask.id, trimmed);
    setReturnOpen(false);
    setReturnNote("");
    setReturnError(null);
    setRefreshKey((k) => k + 1);
    onReturned?.();
  }

  const coords = formatCoordsDisplay(submission.latitude, submission.longitude);
  const answeredCount = submission.checklist.filter(
    (row) => row.answer === "yes" || row.answer === "no",
  ).length;

  return (
    <RegistrationFormCard title="بيانات المكتب الهندسي (استرشادي — للقراءة فقط)">
      <p className="evaluator-context-hint">
        هذه البيانات من المكتب الهندسي — يمكنك إعادة الرفع للتصحيح مع ملاحظة
        إلزامية.
      </p>

      {submission.status === "reopened" && submission.returnNote?.trim() ? (
        <div className="note note-warn" style={{ marginBottom: 12 }}>
          <p>
            <strong>مُعاد للتصحيح</strong> — {submission.returnNote.trim()}
          </p>
        </div>
      ) : null}

      {submission.status === "submitted" ? (
        <div className="appraiser-submitted-actions" style={{ marginBottom: 12 }}>
          {!returnOpen ? (
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => {
                setReturnOpen(true);
                setReturnError(null);
              }}
            >
              إعادة للتصحيح
            </button>
          ) : (
            <div className="eng-office-return-form">
              <label className="form-label" htmlFor="eng-return-note">
                سبب الإرجاع للتصحيح <span className="req">*</span>
              </label>
              <textarea
                id="eng-return-note"
                className="form-control"
                rows={3}
                value={returnNote}
                placeholder="اذكر ما يجب على المكتب الهندسي تصحيحه…"
                onChange={(e) => {
                  setReturnNote(e.target.value);
                  if (returnError) setReturnError(null);
                }}
              />
              {returnError ? (
                <p className="form-error" style={{ marginTop: 6 }}>
                  {returnError}
                </p>
              ) : null}
              <div
                className="appraiser-submitted-actions"
                style={{ marginTop: 8 }}
              >
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleReturnForCorrection}
                >
                  تأكيد الإرجاع
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    setReturnOpen(false);
                    setReturnNote("");
                    setReturnError(null);
                  }}
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <div className="cs-info-row">
        <span className="cs-info-label">الحالة</span>
        <span className="cs-info-value">
          {engineeringSurveyStatusLabel(submission.status)}
        </span>
      </div>
      {coords ? (
        <div className="cs-info-row">
          <span className="cs-info-label">الإحداثيات</span>
          <span className="cs-info-value" dir="ltr">
            {coords}
          </span>
        </div>
      ) : null}
      {submission.surveyReportFileName.trim() ? (
        <div className="cs-info-row">
          <span className="cs-info-label">تقرير الرفع المساحي</span>
          <span className="cs-info-value">
            {submission.surveyReportFileName.trim()}
          </span>
        </div>
      ) : null}
      {submission.siteLetterFileName.trim() ? (
        <div className="cs-info-row">
          <span className="cs-info-label">خطاب الموقع</span>
          <span className="cs-info-value">
            {submission.siteLetterFileName.trim()}
          </span>
        </div>
      ) : null}
      {answeredCount > 0 ? (
        <div className="cs-info-row">
          <span className="cs-info-label">البنود المكتملة</span>
          <span className="cs-info-value">{answeredCount} / 13</span>
        </div>
      ) : null}
    </RegistrationFormCard>
  );
}
