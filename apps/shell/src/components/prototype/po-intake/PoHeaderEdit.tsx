"use client";

import { useMemo, useState } from "react";
import {
  ASSIGNMENT_TYPE_OPTIONS,
  computeBusinessDueDate,
  formatDateAr,
  requiresAssignmentDecree,
  type AssignmentType,
  type PoIntakeRecord,
} from "@/lib/prototype/po-intake-data";
import { updatePoRecord } from "@/lib/prototype/po-intake-storage";
import { RegField, RegSelect } from "@/components/prototype/registration/FormFields";
import { RegistrationFormCard } from "@/components/prototype/registration/RegistrationFormCard";
import {
  collectRequiredErrors,
  hasFieldErrors,
  mergeFieldErrors,
  type FieldErrors,
} from "@/components/prototype/registration/registration-utils";
import { PoEditShell } from "./PoEditShell";

export function PoHeaderEdit({
  record,
  onBackAction,
  onSavedAction,
}: {
  record: PoIntakeRecord;
  onBackAction: () => void;
  onSavedAction: () => void;
}) {
  const [assignmentType, setAssignmentType] = useState(record.assignmentType);
  const [receivedFromEnfathAt, setReceivedFromEnfathAt] = useState(
    record.receivedFromEnfathAt,
  );
  const [receivedFromEnfathTime, setReceivedFromEnfathTime] = useState(
    record.receivedFromEnfathTime || "10:00",
  );
  const [internalAssignmentAt, setInternalAssignmentAt] = useState(
    record.internalAssignmentAt,
  );
  const [assignmentSpecialist, setAssignmentSpecialist] = useState(
    record.assignmentSpecialist,
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dueDateAt = useMemo(
    () => computeBusinessDueDate(receivedFromEnfathAt, receivedFromEnfathTime),
    [receivedFromEnfathAt, receivedFromEnfathTime],
  );

  const isDirty =
    assignmentType !== record.assignmentType ||
    receivedFromEnfathAt !== record.receivedFromEnfathAt ||
    receivedFromEnfathTime !== (record.receivedFromEnfathTime || "10:00") ||
    internalAssignmentAt !== record.internalAssignmentAt ||
    assignmentSpecialist.trim() !== record.assignmentSpecialist;

  async function handleSave() {
    const errors = mergeFieldErrors(
      collectRequiredErrors(
        {
          assignmentType,
          receivedFromEnfathAt,
          internalAssignmentAt,
          assignmentSpecialist,
        },
        [
          "assignmentType",
          "receivedFromEnfathAt",
          "internalAssignmentAt",
          "assignmentSpecialist",
        ],
      ),
    );
    if (hasFieldErrors(errors)) {
      setFieldErrors(errors);
      setFormError("يرجى تعبئة الحقول المطلوبة");
      return;
    }

    setSaving(true);
    setFormError(null);
    setFieldErrors({});

    const next: PoIntakeRecord = {
      ...record,
      assignmentType: assignmentType as AssignmentType,
      receivedFromEnfathAt,
      receivedFromEnfathTime,
      internalAssignmentAt,
      assignmentSpecialist: assignmentSpecialist.trim(),
      dueDateAt: computeBusinessDueDate(
        receivedFromEnfathAt,
        receivedFromEnfathTime,
      ),
    };

    if (requiresAssignmentDecree(next.assignmentType)) {
      const missingDecree = next.properties.some(
        (p) => !p.assignmentDocFileName.trim(),
      );
      if (missingDecree) {
        setFormError(
          "مسار التنفيذ يتطلب قرار إسناد لكل عقار — راجع العقارات مع الأخصائي",
        );
        setSaving(false);
        return;
      }
    }

    const result = await updatePoRecord(next);
    setSaving(false);

    if (!result.ok) {
      setFormError(result.error);
      if (result.errors) setFieldErrors(result.errors);
      return;
    }

    onSavedAction();
  }

  return (
    <PoEditShell
      title={`تعديل أمر العمل — ${record.poNumber}`}
      subtitle="المشرف — بيانات PO فقط (العقارات يعدّلها الأخصائي)"
      isDirty={isDirty}
      saving={saving}
      onBack={onBackAction}
      onSave={() => void handleSave()}
    >
      {formError ? (
        <div className="note note-warn" style={{ marginBottom: 12 }}>
          {formError}
        </div>
      ) : null}

      <RegistrationFormCard title="بيانات أمر العمل">
        <div className="reg-fg2">
          <RegField
            id="po_number_ro"
            label="رقم PO (التعميد)"
            value={record.poNumber}
            dir="ltr"
            onChange={() => {}}
          />
          <RegSelect
            id="assignment_type_edit"
            label="نوع الإسناد"
            required
            options={[...ASSIGNMENT_TYPE_OPTIONS]}
            value={assignmentType}
            error={fieldErrors.assignmentType}
            onChange={(v) => setAssignmentType(v as AssignmentType)}
          />
          <RegField
            id="po_received_edit"
            label="تاريخ الاستلام من إنفاذ"
            required
            type="date"
            value={receivedFromEnfathAt}
            error={fieldErrors.receivedFromEnfathAt}
            onChange={setReceivedFromEnfathAt}
          />
          <RegField
            id="po_received_time_edit"
            label="وقت الاستلام"
            type="time"
            dir="ltr"
            value={receivedFromEnfathTime}
            onChange={setReceivedFromEnfathTime}
          />
          <RegField
            id="po_internal_edit"
            label="تاريخ التكليف الداخلي"
            required
            type="date"
            value={internalAssignmentAt}
            error={fieldErrors.internalAssignmentAt}
            onChange={setInternalAssignmentAt}
          />
          <RegField
            id="po_specialist_edit"
            label="أخصائي الإسناد (إنفاذ)"
            required
            value={assignmentSpecialist}
            error={fieldErrors.assignmentSpecialist}
            onChange={setAssignmentSpecialist}
          />
          {dueDateAt ? (
            <div className="reg-sp2 po-due-date-field">
              <span className="reg-fl">تاريخ الاستحقاق (4 أيام عمل)</span>
              <div className="po-count-box" aria-live="polite">
                <span className="po-count-box-value">
                  {formatDateAr(dueDateAt)}
                </span>
                <span className="po-count-box-tag">محسوب تلقائياً</span>
              </div>
            </div>
          ) : null}
          <div className="reg-sp2 po-count-field">
            <span className="reg-fl">عدد العقارات</span>
            <div className="po-count-box">
              <span className="po-count-box-value">{record.properties.length}</span>
              <span className="po-count-box-unit">عقارات</span>
            </div>
          </div>
        </div>
        <p className="reg-field-hint" style={{ marginTop: 8 }}>
          رقم PO غير قابل للتعديل بعد الحفظ الأول.
        </p>
      </RegistrationFormCard>
    </PoEditShell>
  );
}
