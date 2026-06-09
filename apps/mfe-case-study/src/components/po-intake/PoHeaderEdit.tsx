"use client";

import { useMemo, useState } from "react";
import {
  ASSIGNMENT_TYPE_OPTIONS,
  formatDateAr,
  type AssignmentType,
  type PoIntakeRecord,
} from "../../lib/prototype/po-intake-data";
import { updatePoRecord } from "../../lib/prototype/po-intake-storage";
import { RegField, RegSelect } from "@platform/app-shared/registration/FormFields";
import { RegistrationFormCard } from "@platform/app-shared/registration/RegistrationFormCard";
import {
  collectRequiredErrors,
  hasFieldErrors,
  mergeFieldErrors,
  type FieldErrors,
} from "@platform/app-shared/registration/registration-utils";
import { PoEditShell } from "./PoEditShell";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const [promulgationDate, setPromulgationDate] = useState(
    record.promulgationDate || record.receivedFromEnfathAt,
  );
  const [assignmentSpecialist, setAssignmentSpecialist] = useState(
    record.assignmentSpecialist,
  );
  const [assignmentSpecialistEmail, setAssignmentSpecialistEmail] = useState(
    record.assignmentSpecialistEmail,
  );
  const [expectedPropertyCount, setExpectedPropertyCount] = useState(
    String(record.expectedPropertyCount ?? 1),
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const receivedDisplay = useMemo(
    () => formatDateAr(record.receivedFromEnfathAt),
    [record.receivedFromEnfathAt],
  );
  const dueDisplay = useMemo(
    () => formatDateAr(record.dueDateAt),
    [record.dueDateAt],
  );

  const isDirty =
    assignmentType !== record.assignmentType ||
    promulgationDate !== (record.promulgationDate || record.receivedFromEnfathAt) ||
    assignmentSpecialist.trim() !== record.assignmentSpecialist ||
    assignmentSpecialistEmail.trim() !== record.assignmentSpecialistEmail ||
    Math.max(1, parseInt(expectedPropertyCount, 10) || 1) !==
      (record.expectedPropertyCount ?? 1);

  async function handleSave() {
    const errors = mergeFieldErrors(
      collectRequiredErrors(
        {
          assignmentType,
          promulgationDate,
        },
        ["assignmentType", "promulgationDate"],
      ),
    );
    if (
      assignmentSpecialistEmail.trim() &&
      !EMAIL_RE.test(assignmentSpecialistEmail.trim())
    ) {
      errors.assignmentSpecialistEmail = "صيغة الإيميل غير صالحة";
    }
    const count = parseInt(expectedPropertyCount, 10);
    if (!Number.isFinite(count) || count < 1) {
      errors.expectedPropertyCount = "عدد العقارات يجب أن يكون 1 على الأقل";
    }
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
      promulgationDate,
      assignmentSpecialist: assignmentSpecialist.trim(),
      assignmentSpecialistEmail: assignmentSpecialistEmail.trim(),
      expectedPropertyCount: Math.max(1, count || 1),
    };

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
          <RegField
            id="promulgation_edit"
            label="تاريخ التعميد"
            required
            type="date"
            value={promulgationDate}
            error={fieldErrors.promulgationDate}
            onChange={setPromulgationDate}
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
            id="po_specialist_edit"
            label="اسم أخصائي الإسناد"
            value={assignmentSpecialist}
            error={fieldErrors.assignmentSpecialist}
            onChange={setAssignmentSpecialist}
          />
          <RegField
            id="po_specialist_email_edit"
            label="إيميل أخصائي الإسناد"
            type="email"
            dir="ltr"
            value={assignmentSpecialistEmail}
            error={fieldErrors.assignmentSpecialistEmail}
            onChange={setAssignmentSpecialistEmail}
          />
          <RegField
            id="expected_property_count_edit"
            label="عدد العقارات"
            required
            type="number"
            dir="ltr"
            value={expectedPropertyCount}
            error={fieldErrors.expectedPropertyCount}
            onChange={(v) => {
              const digits = v.replace(/\D/g, "").slice(0, 3);
              setExpectedPropertyCount(digits || "");
            }}
          />
          <div className="reg-sp2 po-due-date-field">
            <span className="reg-fl">تاريخ الاستلام الفعلي</span>
            <div className="po-count-box">
              <span className="po-count-box-value">{receivedDisplay}</span>
              <span className="po-count-box-tag">بعد الحفظ</span>
            </div>
          </div>
          <div className="reg-sp2 po-due-date-field">
            <span className="reg-fl">تاريخ الاستحقاق</span>
            <div className="po-count-box">
              <span className="po-count-box-value">{dueDisplay}</span>
              <span className="po-count-box-tag">محسوب</span>
            </div>
          </div>
          <div className="reg-sp2 po-count-field">
            <span className="reg-fl">عدد العقارات</span>
            <div className="po-count-box">
              <span className="po-count-box-value">
                {record.properties.length}
              </span>
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
