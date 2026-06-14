"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import { RegistrationFormCard } from "@platform/app-shared/registration/RegistrationFormCard";
import type { PartyTaskPageDef } from "@platform/app-shared/prototype/party-task-pages";
import { usePoRecordQuery } from "../../query/case-study-queries";
import {
  governmentReviewKeysStatusLabel,
  governmentReviewVisitStatusLabel,
  isGovernmentReviewFormLocked,
  type GovernmentReviewKeysStatus,
  type GovernmentReviewSubmission,
  type GovernmentReviewVisitStatus,
} from "../../lib/prototype/government-review-work-data";
import { finalizeGovernmentReviewSubmission } from "../../lib/prototype/finalize-government-review-submission";
import {
  getOrCreateGovernmentReviewDraft,
  updateGovernmentReviewDraft,
} from "../../lib/prototype/government-review-work-storage";
import {
  firstGovernmentReviewError,
  validateGovernmentReviewSubmission,
  type GovernmentReviewFieldErrors,
} from "../../lib/prototype/government-review-work-validation";
import type { WorkflowTask } from "../../lib/prototype/tasks-storage";

export type GovernmentReviewWorkHostRef = {
  submit?: () => Promise<boolean>;
  onSubmitted?: () => void;
  onSavingChange?: (saving: boolean) => void;
};

const VISIT_OPTIONS: {
  value: GovernmentReviewVisitStatus;
  label: string;
}[] = [
  { value: "completed", label: governmentReviewVisitStatusLabel("completed") },
  { value: "scheduled", label: governmentReviewVisitStatusLabel("scheduled") },
  { value: "blocked", label: governmentReviewVisitStatusLabel("blocked") },
];

const KEYS_OPTIONS: {
  value: GovernmentReviewKeysStatus;
  label: string;
}[] = [
  { value: "received", label: governmentReviewKeysStatusLabel("received") },
  { value: "pending", label: governmentReviewKeysStatusLabel("pending") },
  { value: "not_required", label: governmentReviewKeysStatusLabel("not_required") },
];

export function GovernmentReviewWorkBody({
  def,
  task,
  hostRef,
}: {
  def: PartyTaskPageDef;
  task: WorkflowTask;
  hostRef: RefObject<GovernmentReviewWorkHostRef | null>;
}) {
  void def;
  const propertyId = task.propertyId ?? "";
  const { data: record } = usePoRecordQuery(task.poNumber);
  const property = record?.properties.find((p) => p.id === propertyId);

  const [draft, setDraft] = useState<GovernmentReviewSubmission | null>(null);
  const [fieldErrors, setFieldErrors] = useState<GovernmentReviewFieldErrors>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!propertyId) return;
    let cancelled = false;
    void getOrCreateGovernmentReviewDraft({
      taskId: task.id,
      propertyId,
      poNumber: task.poNumber,
      courtName: property?.court,
    }).then((next) => {
      if (!cancelled) setDraft(next);
    });
    return () => {
      cancelled = true;
    };
  }, [task.id, task.poNumber, propertyId, property?.court]);

  const locked = draft ? isGovernmentReviewFormLocked(draft.status) : false;
  const formDisabled = locked;

  const persist = useCallback(
    (patch: Parameters<typeof updateGovernmentReviewDraft>[1]) => {
      if (!task.id) return;
      void updateGovernmentReviewDraft(task.id, patch).then((next) => {
        if (next) setDraft(next);
      });
    },
    [task.id],
  );

  const submit = useCallback(async (): Promise<boolean> => {
    if (!draft || locked) return false;

    const errors = validateGovernmentReviewSubmission(draft);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError(firstGovernmentReviewError(errors));
      return false;
    }

    hostRef.current?.onSavingChange?.(true);
    setFormError(null);
    const submitted = await finalizeGovernmentReviewSubmission(task.id);
    hostRef.current?.onSavingChange?.(false);

    if (submitted) {
      setDraft(submitted);
      hostRef.current?.onSubmitted?.();
      return true;
    }
    setFormError("تعذر إتمام المراجعة — حاول مرة أخرى");
    return false;
  }, [draft, locked, hostRef, task.id]);

  useEffect(() => {
    if (!hostRef.current) return;
    hostRef.current.submit = submit;
  }, [hostRef, submit]);

  if (!draft) {
    return <p className="po-properties-loading">جاري تحميل نموذج المراجعة…</p>;
  }

  const showVisitDate = draft.visitStatus === "completed";
  const showBlockReason =
    draft.visitStatus === "blocked" ||
    (draft.visitStatus === "completed" && draft.keysStatus === "pending");
  const showKeysDescription = draft.keysStatus === "received";

  return (
    <>
      {locked ? (
        <div className="note note-success" style={{ marginBottom: 12 }}>
          تم إرسال نتيجة المراجعة — النموذج للقراءة فقط.
        </div>
      ) : null}

      {formError ? (
        <div className="note note-warn" style={{ marginBottom: 12 }}>
          {formError}
        </div>
      ) : null}

      <RegistrationFormCard title="زيارة المحكمة">
        <div className="form-group">
          <span className="form-label">حالة الزيارة</span>
          <div className="radio-group">
            {VISIT_OPTIONS.map((opt) => (
              <label key={opt.value} className="radio-opt">
                <input
                  type="radio"
                  name="gov-visit"
                  checked={draft.visitStatus === opt.value}
                  disabled={formDisabled}
                  onChange={() => {
                    persist({ visitStatus: opt.value });
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.visitStatus;
                      delete next.visitDate;
                      delete next.accessBlockReason;
                      return next;
                    });
                  }}
                />{" "}
                {opt.label}
              </label>
            ))}
          </div>
          {fieldErrors.visitStatus ? (
            <p className="reg-field-error">{fieldErrors.visitStatus}</p>
          ) : null}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="gov-court">
              المحكمة
            </label>
            <input
              id="gov-court"
              className="form-control"
              value={draft.courtName}
              readOnly={formDisabled}
              placeholder="اسم المحكمة"
              onChange={(e) => persist({ courtName: e.target.value })}
            />
          </div>
          {showVisitDate ? (
            <div className="form-group">
              <label className="form-label" htmlFor="gov-visit-date">
                تاريخ الزيارة
              </label>
              <input
                id="gov-visit-date"
                className="form-control"
                type="date"
                dir="ltr"
                value={draft.visitDate}
                disabled={formDisabled}
                onChange={(e) => {
                  persist({ visitDate: e.target.value });
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.visitDate;
                    return next;
                  });
                }}
              />
              {fieldErrors.visitDate ? (
                <p className="reg-field-error">{fieldErrors.visitDate}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </RegistrationFormCard>

      <RegistrationFormCard title="جمع المفاتيح">
        <div className="form-group">
          <span className="form-label">حالة استلام المفاتيح</span>
          <div className="radio-group">
            {KEYS_OPTIONS.map((opt) => (
              <label key={opt.value} className="radio-opt">
                <input
                  type="radio"
                  name="gov-keys-status"
                  checked={draft.keysStatus === opt.value}
                  disabled={formDisabled}
                  onChange={() => {
                    persist({ keysStatus: opt.value });
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.keysStatus;
                      delete next.keysDescription;
                      delete next.accessBlockReason;
                      return next;
                    });
                  }}
                />{" "}
                {opt.label}
              </label>
            ))}
          </div>
          {fieldErrors.keysStatus ? (
            <p className="reg-field-error">{fieldErrors.keysStatus}</p>
          ) : null}
        </div>

        {showKeysDescription ? (
          <div className="form-group">
            <label className="form-label" htmlFor="gov-keys">
              المفاتيح المستلمة / موقع الحفظ
            </label>
            <textarea
              id="gov-keys"
              className="form-control"
              rows={3}
              disabled={formDisabled}
              placeholder="وصف المفاتيح، عددها، أو موقع تسليمها لقسم المفاتيح…"
              value={draft.keysDescription}
              onChange={(e) => {
                persist({ keysDescription: e.target.value });
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.keysDescription;
                  return next;
                });
              }}
            />
            {fieldErrors.keysDescription ? (
              <p className="reg-field-error">{fieldErrors.keysDescription}</p>
            ) : null}
          </div>
        ) : null}

        {showBlockReason ? (
          <div className="form-group">
            <label className="form-label" htmlFor="gov-block-reason">
              سبب التعذر / المتابعة
            </label>
            <textarea
              id="gov-block-reason"
              className="form-control"
              rows={2}
              disabled={formDisabled}
              placeholder="اذكر سبب تعذر الوصول أو عدم استلام المفاتيح والإجراء التالي…"
              value={draft.accessBlockReason}
              onChange={(e) => {
                persist({ accessBlockReason: e.target.value });
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.accessBlockReason;
                  return next;
                });
              }}
            />
            {fieldErrors.accessBlockReason ? (
              <p className="reg-field-error">{fieldErrors.accessBlockReason}</p>
            ) : null}
          </div>
        ) : null}
      </RegistrationFormCard>

      <RegistrationFormCard title="ملاحظات المراجعة">
        <div className="form-group">
          <label className="form-label" htmlFor="gov-review-notes">
            ملاحظات إضافية
          </label>
          <textarea
            id="gov-review-notes"
            className="form-control"
            rows={3}
            disabled={formDisabled}
            placeholder="أي ملاحظات حول زيارة المحكمة أو حالة العقار…"
            value={draft.reviewNotes}
            onChange={(e) => persist({ reviewNotes: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="gov-delegation-property-opt">
            <input
              type="checkbox"
              checked={draft.confirmed}
              disabled={formDisabled}
              onChange={(e) => {
                persist({ confirmed: e.target.checked });
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.confirmed;
                  return next;
                });
              }}
            />
            <span>أؤكد اكتمال المراجعة الحكومية لهذا العقار</span>
          </label>
          {fieldErrors.confirmed ? (
            <p className="reg-field-error">{fieldErrors.confirmed}</p>
          ) : null}
        </div>
      </RegistrationFormCard>
    </>
  );
}
