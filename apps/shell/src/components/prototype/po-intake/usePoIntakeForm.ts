"use client";

import { useEffect, useMemo, useState } from "react";
import {
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
import {
  collectRequiredErrors,
  hasFieldErrors,
  mergeFieldErrors,
  type FieldErrors,
} from "@/components/prototype/registration/registration-utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function usePoIntakeForm(onComplete: (record: PoIntakeRecord) => void) {
  const [saving, setSaving] = useState(false);
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
    savePoDraft({
      step: 1,
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
    poNumber,
    promulgationDate,
    assignmentType,
    assignmentSpecialist,
    assignmentSpecialistEmail,
    expectedPropertyCount,
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

  async function save() {
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
    onComplete(result.data);
  }

  return {
    saving,
    formError,
    fieldErrors,
    isDirty,
    poNumber,
    setPoNumber,
    promulgationDate,
    setPromulgationDate,
    assignmentType,
    setAssignmentType,
    assignmentSpecialist,
    setAssignmentSpecialist,
    assignmentSpecialistEmail,
    setAssignmentSpecialistEmail,
    expectedPropertyCount,
    setExpectedPropertyCount,
    save,
  };
}
