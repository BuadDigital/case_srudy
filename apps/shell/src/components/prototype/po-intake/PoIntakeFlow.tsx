"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ASSIGNMENT_TYPE_OPTIONS,
  PO_INTAKE_HINTS,
  PO_INTAKE_STEPS,
  type AssignmentType,
  type PoIntakeRecord,
} from "@/lib/prototype/po-intake-data";
import {
  buildPoRecord,
  clearPoDraft,
  loadPoDraft,
  poRecordExists,
  savePoDraft,
  savePoRecord,
} from "@/lib/prototype/po-intake-storage";
import { RegField, RegSelect } from "@/components/prototype/registration/FormFields";
import { RegistrationFormCard } from "@/components/prototype/registration/RegistrationFormCard";
import {
  collectRequiredErrors,
  hasFieldErrors,
  mergeFieldErrors,
  type FieldErrors,
} from "@/components/prototype/registration/registration-utils";
import { PoIntakeSuccess } from "./PoIntakeSuccess";
import { PoIntakeWizardShell } from "./PoIntakeWizardShell";

const LAST_STEP = PO_INTAKE_STEPS.length;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function PoIntakeFlow({
  onCompleteAction,
  onBackAction,
}: {
  onCompleteAction: (record: PoIntakeRecord) => void;
  onBackAction: () => void;
}) {
  const [step, setStep] = useState(() => loadPoDraft()?.step ?? 1);
  const [saving, setSaving] = useState(false);
  const [savedRecord, setSavedRecord] = useState<PoIntakeRecord | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [poNumber, setPoNumber] = useState(() => loadPoDraft()?.poNumber ?? "");
  const [promulgationDate, setPromulgationDate] = useState(
    () => loadPoDraft()?.promulgationDate ?? "",
  );
  const [assignmentType, setAssignmentType] = useState<AssignmentType | "">(
    () => loadPoDraft()?.assignmentType || "",
  );
  const [assignmentSpecialist, setAssignmentSpecialist] = useState(
    () => loadPoDraft()?.assignmentSpecialist ?? "",
  );
  const [assignmentSpecialistEmail, setAssignmentSpecialistEmail] = useState(
    () => loadPoDraft()?.assignmentSpecialistEmail ?? "",
  );
  const [expectedPropertyCount, setExpectedPropertyCount] = useState(() => {
    const count = loadPoDraft()?.expectedPropertyCount;
    return count && count > 0 ? String(count) : "1";
  });

  const isSuccess = step > LAST_STEP;
  const hint = PO_INTAKE_HINTS[0] ?? "";

  const isDirty = useMemo(
    () =>
      !!poNumber.trim() ||
      !!promulgationDate ||
      !!assignmentType ||
      !!assignmentSpecialist.trim() ||
      !!assignmentSpecialistEmail.trim() ||
      expectedPropertyCount !== "1",
    [
      poNumber,
      promulgationDate,
      assignmentType,
      assignmentSpecialist,
      assignmentSpecialistEmail,
      expectedPropertyCount,
    ],
  );

  useEffect(() => {
    if (isSuccess) return;
    savePoDraft({
      step,
      poNumber,
      promulgationDate,
      assignmentType,
      assignmentSpecialist,
      assignmentSpecialistEmail,
      expectedPropertyCount: Math.max(
        1,
        parseInt(expectedPropertyCount, 10) || 1,
      ),
    });
  }, [
    step,
    poNumber,
    promulgationDate,
    assignmentType,
    assignmentSpecialist,
    assignmentSpecialistEmail,
    expectedPropertyCount,
    isSuccess,
  ]);

  function clearErrors() {
    setFieldErrors({});
    setFormError(null);
  }

  async function validateHeader(): Promise<boolean> {
    clearErrors();
    const errors = mergeFieldErrors(
      collectRequiredErrors(
        {
          poNumber,
          promulgationDate,
          assignmentType,
          assignmentSpecialist,
          assignmentSpecialistEmail,
        },
        [
          "poNumber",
          "promulgationDate",
          "assignmentType",
          "assignmentSpecialist",
          "assignmentSpecialistEmail",
        ],
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
      setFormError("يرجى تعبئة بيانات أمر العمل");
      return false;
    }
    if (await poRecordExists(poNumber)) {
      setFieldErrors({ poNumber: "رقم PO مسجّل مسبقاً في النظام" });
      return false;
    }
    return true;
  }

  async function handleSave() {
    if (!(await validateHeader())) return;

    setSaving(true);
    clearErrors();

    const record = buildPoRecord({
      poNumber: poNumber.trim(),
      assignmentType: assignmentType as AssignmentType,
      promulgationDate,
      assignmentSpecialist: assignmentSpecialist.trim(),
      assignmentSpecialistEmail: assignmentSpecialistEmail.trim(),
      expectedPropertyCount: Math.max(1, parseInt(expectedPropertyCount, 10) || 1),
      properties: [],
    });

    const result = await savePoRecord(record);
    setSaving(false);

    if (!result.ok) {
      setFormError(result.error);
      if (result.errors) setFieldErrors(result.errors);
      return;
    }

    clearPoDraft();
    setSavedRecord(result.data);
    setStep(LAST_STEP + 1);
    onCompleteAction(result.data);
  }

  function resetForAnother() {
    setStep(1);
    setPoNumber("");
    setPromulgationDate("");
    setAssignmentType("");
    setAssignmentSpecialist("");
    setAssignmentSpecialistEmail("");
    setExpectedPropertyCount("1");
    setSavedRecord(null);
    clearPoDraft();
    clearErrors();
  }

  return (
    <PoIntakeWizardShell
      steps={PO_INTAKE_STEPS}
      step={Math.min(step, LAST_STEP)}
      hint={hint}
      saving={saving}
      success={isSuccess}
      showPrev={false}
      nextLabel="حفظ أمر العمل"
      isDirty={isDirty}
      onBack={onBackAction}
      onPrev={() => {}}
      onNext={() => void handleSave()}
    >
      {formError ? (
        <div className="note note-warn" style={{ marginBottom: 12 }}>
          {formError}
        </div>
      ) : null}

      {isSuccess && savedRecord ? (
        <PoIntakeSuccess
          record={savedRecord}
          onBackToList={onBackAction}
          onAddAnother={resetForAnother}
        />
      ) : null}

      {!isSuccess ? (
        <RegistrationFormCard
          title="بيانات أمر العمل (PO)"
          subtitle="يُنسخ رقم التعميد وتاريخ التعميد من منصة إنفاذ — تُسجَّل العقارات لاحقاً داخل أمر العمل"
        >
          <div className="note note-info" style={{ marginBottom: 14 }}>
            بعد الحفظ يُحسب تاريخ الاستلام الفعلي وتاريخ الاستحقاق (4 أيام عمل)
            تلقائياً من تاريخ التعميد. أضف العقارات من قائمة العقارات داخل أمر
            العمل، ثم أكمل بيانات البورصة من «استعلام البورصة».
          </div>
          <div className="reg-fg2">
            <RegField
              id="po_number"
              label="رقم التعميد (PO)"
              required
              dir="ltr"
              value={poNumber}
              error={fieldErrors.poNumber}
              placeholder="مثال: PO-2025-001"
              onChange={setPoNumber}
            />
            <RegField
              id="promulgation_date"
              label="تاريخ التعميد"
              required
              type="date"
              value={promulgationDate}
              error={fieldErrors.promulgationDate}
              onChange={setPromulgationDate}
            />
            <RegField
              id="po_specialist"
              label="اسم أخصائي الإسناد"
              required
              value={assignmentSpecialist}
              error={fieldErrors.assignmentSpecialist}
              onChange={setAssignmentSpecialist}
            />
            <RegField
              id="po_specialist_email"
              label="إيميل أخصائي الإسناد"
              required
              type="email"
              dir="ltr"
              value={assignmentSpecialistEmail}
              error={fieldErrors.assignmentSpecialistEmail}
              onChange={setAssignmentSpecialistEmail}
            />
            <RegSelect
              id="assignment_type"
              label="نوع الإسناد"
              required
              options={[...ASSIGNMENT_TYPE_OPTIONS]}
              value={assignmentType}
              error={fieldErrors.assignmentType}
              onChange={(v) => setAssignmentType(v as AssignmentType)}
            />
            <RegField
              id="expected_property_count"
              label="عدد العقارات"
              required
              type="number"
              dir="ltr"
              value={expectedPropertyCount}
              error={fieldErrors.expectedPropertyCount}
              placeholder="1"
              onChange={(v) => {
                const digits = v.replace(/\D/g, "").slice(0, 3);
                setExpectedPropertyCount(digits || "");
              }}
            />
          </div>
        </RegistrationFormCard>
      ) : null}
    </PoIntakeWizardShell>
  );
}
