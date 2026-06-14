"use client";

import { useCallback, useEffect, useMemo, useState, type RefObject } from "react";
import { RegistrationFormCard } from "@platform/app-shared/registration/RegistrationFormCard";
import type { PartyTaskPageDef } from "@platform/app-shared/prototype/party-task-pages";
import { usePoRecordQuery, useWorkflowTasksQuery } from "../../query/case-study-queries";
import { finalizeValuationCoordinationSubmission } from "../../lib/prototype/finalize-valuation-coordination-submission";
import {
  assigneeLabel,
  getFieldInspectors,
  getValuators,
} from "../../lib/prototype/distribution-parties";
import {
  isValuationCoordinationFormLocked,
  valuationCoordinationPriorityLabel,
  type ValuationCoordinationPriority,
  type ValuationCoordinationSubmission,
} from "../../lib/prototype/valuation-coordination-work-data";
import {
  getOrCreateValuationCoordinationDraft,
  updateValuationCoordinationDraft,
} from "../../lib/prototype/valuation-coordination-work-storage";
import {
  firstValuationCoordinationError,
  validateValuationCoordinationSubmission,
  type ValuationCoordinationFieldErrors,
} from "../../lib/prototype/valuation-coordination-work-validation";
import {
  migrateDistribution,
  type WorkflowTask,
} from "../../lib/prototype/tasks-storage";

export type ValuationCoordinationWorkHostRef = {
  submit?: () => Promise<boolean>;
  onSubmitted?: () => void;
  onSavingChange?: (saving: boolean) => void;
};

function distributionForTask(
  task: WorkflowTask,
  parent: WorkflowTask | undefined,
) {
  return migrateDistribution(task.distribution ?? parent?.distribution);
}

export function ValuationCoordinationWorkBody({
  def,
  task,
  hostRef,
}: {
  def: PartyTaskPageDef;
  task: WorkflowTask;
  hostRef: RefObject<ValuationCoordinationWorkHostRef | null>;
}) {
  void def;
  const propertyId = task.propertyId ?? "";
  const { data: record } = usePoRecordQuery(task.poNumber);
  const { data: allTasks } = useWorkflowTasksQuery();

  const parentTask = useMemo(
    () =>
      task.parentTaskId
        ? allTasks?.find((t) => t.id === task.parentTaskId)
        : undefined,
    [allTasks, task.parentTaskId],
  );

  const distribution = useMemo(
    () => distributionForTask(task, parentTask),
    [task, parentTask],
  );

  const inspectorName = useMemo(
    () => assigneeLabel(getFieldInspectors(), distribution.inspectorId),
    [distribution.inspectorId],
  );
  const appraiserName = useMemo(
    () => assigneeLabel(getValuators(), distribution.valuatorId),
    [distribution.valuatorId],
  );

  const property = record?.properties.find((p) => p.id === propertyId);

  const [draft, setDraft] = useState<ValuationCoordinationSubmission | null>(
    null,
  );
  const [fieldErrors, setFieldErrors] =
    useState<ValuationCoordinationFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!propertyId) return;
    setDraft(
      getOrCreateValuationCoordinationDraft({
        taskId: task.id,
        propertyId,
        poNumber: task.poNumber,
        inspectorName,
        appraiserName,
      }),
    );
  }, [
    task.id,
    task.poNumber,
    propertyId,
    inspectorName,
    appraiserName,
  ]);

  const locked = draft ? isValuationCoordinationFormLocked(draft.status) : false;
  const formDisabled = locked;

  const persist = useCallback(
    (patch: Parameters<typeof updateValuationCoordinationDraft>[1]) => {
      if (!task.id) return;
      const next = updateValuationCoordinationDraft(task.id, patch);
      if (next) setDraft(next);
    },
    [task.id],
  );

  const submit = useCallback(async (): Promise<boolean> => {
    if (!draft || locked) return false;

    const withAssignees: ValuationCoordinationSubmission = {
      ...draft,
      inspectorName,
      appraiserName,
    };

    const errors = validateValuationCoordinationSubmission(withAssignees);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError(firstValuationCoordinationError(errors));
      return false;
    }

    hostRef.current?.onSavingChange?.(true);
    setFormError(null);
    const submitted = await finalizeValuationCoordinationSubmission(task.id);
    hostRef.current?.onSavingChange?.(false);

    if (submitted) {
      setDraft(submitted);
      hostRef.current?.onSubmitted?.();
      return true;
    }
    setFormError("تعذر تأكيد الاستلام — حاول مرة أخرى");
    return false;
  }, [draft, locked, hostRef, task.id, inspectorName, appraiserName]);

  useEffect(() => {
    if (!hostRef.current) return;
    hostRef.current.submit = submit;
  }, [hostRef, submit]);

  if (!draft) {
    return <p className="po-properties-loading">جاري تحميل نموذج الاستلام…</p>;
  }

  return (
    <>
      {locked ? (
        <div className="note note-success" style={{ marginBottom: 12 }}>
          تم تأكيد الاستلام — النموذج للقراءة فقط.
        </div>
      ) : null}

      {formError ? (
        <div className="note note-warn" style={{ marginBottom: 12 }}>
          {formError}
        </div>
      ) : null}

      <RegistrationFormCard title="استلام المعاملة">
        <div className="note note-info" style={{ marginBottom: 12 }}>
          {property
            ? `${property.city}${property.district ? ` · ${property.district}` : ""}`
            : "—"}
          {property?.court ? ` · ${property.court}` : ""}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="vc-receipt-date">
              تاريخ الاستلام
            </label>
            <input
              id="vc-receipt-date"
              className="form-control"
              type="date"
              dir="ltr"
              value={draft.receiptDate}
              disabled={formDisabled}
              onChange={(e) => {
                persist({ receiptDate: e.target.value });
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.receiptDate;
                  return next;
                });
              }}
            />
            {fieldErrors.receiptDate ? (
              <p className="reg-field-error">{fieldErrors.receiptDate}</p>
            ) : null}
          </div>
          <div className="form-group">
            <span className="form-label">أولوية التنفيذ</span>
            <select
              className="form-control"
              value={draft.priority}
              disabled={formDisabled}
              onChange={(e) =>
                persist({
                  priority: e.target.value as ValuationCoordinationPriority,
                })
              }
            >
              <option value="normal">
                {valuationCoordinationPriorityLabel("normal")}
              </option>
              <option value="urgent">
                {valuationCoordinationPriorityLabel("urgent")}
              </option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="gov-delegation-property-opt">
            <input
              type="checkbox"
              checked={draft.receiptConfirmed}
              disabled={formDisabled}
              onChange={(e) => {
                persist({ receiptConfirmed: e.target.checked });
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.receiptConfirmed;
                  return next;
                });
              }}
            />
            <span>أؤكد استلام المعاملة في قسم التقييم العقاري</span>
          </label>
          {fieldErrors.receiptConfirmed ? (
            <p className="reg-field-error">{fieldErrors.receiptConfirmed}</p>
          ) : null}
        </div>
      </RegistrationFormCard>

      <RegistrationFormCard title="إسناد الفريق">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="vc-inspector">
              المعاين الميداني
            </label>
            <input
              id="vc-inspector"
              className="form-control"
              value={inspectorName || "—"}
              readOnly
              style={{ background: "var(--surface3)" }}
            />
            {fieldErrors.inspectorName ? (
              <p className="reg-field-error">{fieldErrors.inspectorName}</p>
            ) : (
              <p className="reg-field-hint">من توزيع المعاملات — للقراءة فقط</p>
            )}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="vc-appraiser">
              المقيم العقاري
            </label>
            <input
              id="vc-appraiser"
              className="form-control"
              value={appraiserName || "—"}
              readOnly
              style={{ background: "var(--surface3)" }}
            />
            {fieldErrors.appraiserName ? (
              <p className="reg-field-error">{fieldErrors.appraiserName}</p>
            ) : (
              <p className="reg-field-hint">من توزيع المعاملات — للقراءة فقط</p>
            )}
          </div>
        </div>
      </RegistrationFormCard>

      <RegistrationFormCard title="تنسيق التنفيذ">
        <div className="form-group">
          <label className="form-label" htmlFor="vc-note">
            ملاحظات الاستلام والتنسيق
          </label>
          <textarea
            id="vc-note"
            className="form-control"
            rows={3}
            disabled={formDisabled}
            placeholder="تأكيد استلام المعاملة، موعد المعاينة المتوقع، وأي تنسيق مع دراسة الحالة…"
            value={draft.coordinationNotes}
            onChange={(e) => {
              persist({ coordinationNotes: e.target.value });
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.coordinationNotes;
                return next;
              });
            }}
          />
          {fieldErrors.coordinationNotes ? (
            <p className="reg-field-error">{fieldErrors.coordinationNotes}</p>
          ) : null}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="vc-inspector-instructions">
              تعليمات للمعاين
            </label>
            <textarea
              id="vc-inspector-instructions"
              className="form-control"
              rows={2}
              disabled={formDisabled}
              placeholder="موعد الزيارة، نقطة التقاء، أو متطلبات الوصول…"
              value={draft.inspectorInstructions}
              onChange={(e) =>
                persist({ inspectorInstructions: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="vc-appraiser-instructions">
              تعليمات للمقيم
            </label>
            <textarea
              id="vc-appraiser-instructions"
              className="form-control"
              rows={2}
              disabled={formDisabled}
              placeholder="أسلوب التقييم، مستندات مطلوبة، أو موعد التسليم…"
              value={draft.appraiserInstructions}
              onChange={(e) =>
                persist({ appraiserInstructions: e.target.value })
              }
            />
          </div>
        </div>
      </RegistrationFormCard>
    </>
  );
}
