"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WorkflowTask } from "@case-study/mfe";
import { inspectionGateForAppraisal } from "../../lib/evaluator/evaluator-inspection-gate";
import {
  cacheEvaluatorReport,
  getCachedEvaluatorReport,
  openEvaluatorReportPreview,
} from "../../lib/evaluator/evaluator-report-attachments";
import {
  createEvaluatorDraft,
  evaluatorStatusLabel,
  formatEvaluatorPriceDisplay,
} from "../../lib/evaluator/evaluator-window-data";
import {
  hydrateEvaluatorSubmission,
  isEvaluatorFormLocked,
  updateEvaluatorDraft,
  type EvaluatorReportMetadata,
} from "../../lib/evaluator/evaluator-submission-storage";
import type { EvaluatorSubmission } from "../../lib/evaluator/evaluator-window-data";
import {
  firstEvaluatorError,
  validateEvaluatorSubmission,
  type EvaluatorValidationErrors,
} from "../../lib/evaluator/evaluator-validation";
import { finalizeAppraiserSubmission } from "../../lib/evaluator/finalize-appraiser-submission";
import type { EvaluatorWindowHostRefObject } from "../../lib/evaluator/evaluator-window-host";

export function EvaluatorWindow({
  task,
  tasks,
  hostRef,
}: {
  task: WorkflowTask;
  tasks: WorkflowTask[];
  hostRef: EvaluatorWindowHostRefObject;
}) {
  const gate = useMemo(
    () => inspectionGateForAppraisal(task, tasks),
    [task, tasks],
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<EvaluatorSubmission>(() =>
    createEvaluatorDraft({
      taskId: task.id,
      propertyId: task.propertyId ?? "",
      poNumber: task.poNumber,
    }),
  );
  const [draftLoading, setDraftLoading] = useState(true);
  const [reportName, setReportName] = useState<string | null>(() => {
    const cached = getCachedEvaluatorReport(task.id);
    return cached?.fileName ?? null;
  });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<EvaluatorValidationErrors>(
    {},
  );
  const [uploading, setUploading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const locked = isEvaluatorFormLocked(draft.status);
  const formDisabled = locked || !gate.ready;
  const hasReport = Boolean(
    reportName || getCachedEvaluatorReport(task.id)?.dataUrl,
  );

  const persistDraft = useCallback(
    (
      patch: Partial<{
        evaluatorPrice: string;
        evaluatorNotes: string;
        reportFileName: string | null;
      }>,
      reportMetadata?: EvaluatorReportMetadata,
    ) => {
      if (locked) return;
      void updateEvaluatorDraft(task.id, patch, reportMetadata).then((updated) => {
        if (updated) setDraft(updated);
      });
    },
    [locked, task.id],
  );

  const scheduleAutosave = useCallback(
    (patch: Parameters<typeof persistDraft>[0]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => persistDraft(patch), 400);
    },
    [persistDraft],
  );

  useEffect(() => {
    let cancelled = false;
    void hydrateEvaluatorSubmission({
      taskId: task.id,
      propertyId: task.propertyId ?? "",
      poNumber: task.poNumber,
    }).then((loaded) => {
      if (!cancelled) {
        setDraft(loaded);
        if (loaded.reportFileName) {
          setReportName(loaded.reportFileName);
        }
        setDraftLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [task.id, task.propertyId, task.poNumber]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const submit = useCallback(async (): Promise<boolean> => {
    if (locked) return false;
    if (!gate.ready) {
      setFormError(gate.reason);
      return false;
    }

    const errors = validateEvaluatorSubmission({
      taskId: task.id,
      evaluatorPrice: draft.evaluatorPrice,
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError(firstEvaluatorError(errors));
      return false;
    }

    hostRef.current?.onSavingChange?.(true);
    setFormError(null);
    const result = await finalizeAppraiserSubmission(task.id);
    hostRef.current?.onSavingChange?.(false);
    if (result.ok) {
      setDraft(result.submission);
      setSubmitSuccess(true);
      hostRef.current?.onSubmitted?.();
      return true;
    }
    setFormError(result.message);
    return false;
  }, [locked, gate, task.id, draft.evaluatorPrice, hostRef]);

  useEffect(() => {
    if (!hostRef.current) return;
    hostRef.current.submit = submit;
  }, [hostRef, submit]);

  async function onReportSelected(file: File | null) {
    if (!file || formDisabled) return;
    setUploading(true);
    setUploadError(null);
    const result = await cacheEvaluatorReport(task.id, file);
    setUploading(false);
    if (!result.ok) {
      setUploadError(result.error);
      return;
    }
    setReportName(file.name);
    persistDraft(
      { reportFileName: file.name },
      {
        fileName: file.name,
        mimeType: file.type || "application/pdf",
        sizeBytes: file.size,
      },
    );
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.evaluator_report_file;
      return next;
    });
  }

  if (draftLoading) {
    return (
      <div className="evaluator-window">
        <p className="po-properties-loading">جاري تحميل مسودة التقييم…</p>
      </div>
    );
  }

  return (
    <div className="evaluator-window">
      {!gate.ready ? (
        <div className="evaluator-alert evaluator-alert--warn">{gate.reason}</div>
      ) : null}

      {submitSuccess ? (
        <div className="note note-success" style={{ marginBottom: 12 }}>
          تم الإرسال لأخصائي دراسة الحالة — يمكنك إغلاق الشاشة أو العودة للقائمة.
        </div>
      ) : null}

      {draft.status !== "draft" && !submitSuccess ? (
        <div className="evaluator-alert evaluator-alert--info">
          الحالة: {evaluatorStatusLabel(draft.status)}
          {draft.status === "reopened"
            ? " — يمكنك تعديل جميع الحقول وإعادة الإرسال."
            : null}
        </div>
      ) : null}

      <section className="page-shell evaluator-upload-panel">
        <header className="po-subpage-hd">
          <div className="po-subpage-titles">
            <h3 className="po-subpage-title">رفع التقييم</h3>
            <p className="po-subpage-sub">
              تقرير المقياس وسعر العقار — يُعرض للأخصائي للاسترشاد فقط
            </p>
          </div>
        </header>

        <div className="page-gutter evaluator-upload-panel__body">
          <div
            className={`evaluator-field${fieldErrors.evaluator_report_file ? " evaluator-field--error" : ""}`}
          >
            <span className="evaluator-field__label">
              تقرير التقييم (PDF من برنامج المقياس)
            </span>
            <div
              className={`evaluator-file-zone${hasReport ? " evaluator-file-zone--done" : ""}${formDisabled ? " evaluator-file-zone--disabled" : ""}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                disabled={formDisabled || uploading}
                className="evaluator-file-zone__input"
                onChange={(e) => void onReportSelected(e.target.files?.[0] ?? null)}
              />
              <div className="evaluator-file-zone__icon" aria-hidden>
                {hasReport ? "✓" : "PDF"}
              </div>
              <div className="evaluator-file-zone__text">
                {hasReport ? (
                  <strong className="evaluator-file-zone__name">
                    {reportName ?? "تم رفع الملف"}
                  </strong>
                ) : (
                  <>
                    <strong>اختر ملف PDF</strong>
                    <span>صادر من برنامج المقياس · حتى 20 MB</span>
                  </>
                )}
              </div>
              <div className="evaluator-file-zone__actions">
                {!formDisabled ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading
                      ? "جاري الرفع…"
                      : hasReport
                        ? "تغيير الملف"
                        : "رفع الملف"}
                  </button>
                ) : null}
                {getCachedEvaluatorReport(task.id)?.dataUrl ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => openEvaluatorReportPreview(task.id)}
                  >
                    معاينة
                  </button>
                ) : null}
              </div>
            </div>
            {uploadError ? (
              <span className="evaluator-field__error">{uploadError}</span>
            ) : null}
            {fieldErrors.evaluator_report_file ? (
              <span className="evaluator-field__error">
                {fieldErrors.evaluator_report_file}
              </span>
            ) : null}
          </div>

          <div className="evaluator-fields-row">
            <div
              className={`evaluator-field${fieldErrors.evaluator_price ? " evaluator-field--error" : ""}`}
            >
              <label className="evaluator-field__label" htmlFor="evaluator_price">
                سعر التقييم
              </label>
              <div className="evaluator-price-input">
                <input
                  id="evaluator_price"
                  className="form-control"
                  inputMode="decimal"
                  disabled={formDisabled}
                  value={draft.evaluatorPrice}
                  placeholder="1,250,000"
                  onChange={(e) => {
                    const evaluatorPrice = e.target.value;
                    setDraft((prev) => ({ ...prev, evaluatorPrice }));
                    scheduleAutosave({ evaluatorPrice });
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.evaluator_price;
                      return next;
                    });
                  }}
                />
                <span className="evaluator-price-input__unit">ر.س</span>
              </div>
              {draft.evaluatorPrice.trim() ? (
                <span className="evaluator-field__hint">
                  {formatEvaluatorPriceDisplay(draft.evaluatorPrice)}
                </span>
              ) : null}
              {fieldErrors.evaluator_price ? (
                <span className="evaluator-field__error">
                  {fieldErrors.evaluator_price}
                </span>
              ) : null}
            </div>
          </div>

          <div className="evaluator-field">
            <label className="evaluator-field__label" htmlFor="evaluator_notes">
              ملاحظات (اختياري)
            </label>
            <textarea
              id="evaluator_notes"
              className="form-control evaluator-notes-input"
              rows={3}
              disabled={formDisabled}
              placeholder="أي ملاحظات على العقار…"
              value={draft.evaluatorNotes}
              onChange={(e) => {
                const evaluatorNotes = e.target.value;
                setDraft((prev) => ({ ...prev, evaluatorNotes }));
                scheduleAutosave({ evaluatorNotes });
              }}
            />
          </div>
        </div>
      </section>

      {formError ? (
        <div className="evaluator-alert evaluator-alert--warn">{formError}</div>
      ) : null}
    </div>
  );
}
