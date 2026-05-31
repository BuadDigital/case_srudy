"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  emptyProperty,
  formatPoDisplay,
  isBourseInquiryIdentifier,
  type PoIntakeRecord,
  type PoPropertyIntake,
} from "@/lib/prototype/po-intake-data";
import {
  addPropertyToPo,
  deedExistsInPo,
  getPoRecord,
} from "@/lib/prototype/po-intake-storage";
import { RegistrationFormCard } from "@/components/prototype/registration/RegistrationFormCard";
import {
  hasFieldErrors,
  type FieldErrors,
} from "@/components/prototype/registration/registration-utils";
import { PoIntakeWizardShell } from "./PoIntakeWizardShell";
import { PoPropertyEnfathForm } from "./PoPropertyEnfathForm";
import { PoPropertyStackCard } from "./PoPropertyStackCard";
import {
  findInvalidEnfathPropertyIndex,
  firstEnfathValidationMessage,
  mergePropertyEnfathValidation,
} from "./po-property-enfath-validation";
import { contactsForApi } from "./po-property-validation";

const PROPERTY_STEPS = ["تسجيل العقارات"] as const;
const PROPERTY_HINT =
  "أدخل بيانات كل عقار من المعلومات الواردة في منصة إنفاذ والمستندات المرفقة.";

export function PoPropertyCreate({
  poNumber,
  onBackAction,
  onSavedAction,
}: {
  poNumber: string;
  onBackAction: () => void;
  onSavedAction: () => void;
}) {
  const [record, setRecord] = useState<PoIntakeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<PoPropertyIntake[]>([]);
  const [currentProperty, setCurrentProperty] = useState<PoPropertyIntake>(
    emptyProperty,
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const activePropertyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void getPoRecord(poNumber).then((loaded) => {
      if (cancelled) return;
      setRecord(loaded);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [poNumber]);

  const expectedTotal = record?.expectedPropertyCount ?? 1;
  const alreadyRegistered = record?.properties.length ?? 0;
  const remainingSlots = Math.max(0, expectedTotal - alreadyRegistered);

  const hasCurrentDraft = useMemo(
    () =>
      isBourseInquiryIdentifier(currentProperty.identifierType)
        ? !!currentProperty.district.trim() ||
          !!currentProperty.classification.trim()
        : !!currentProperty.deedNumber.trim() ||
          !!currentProperty.taskNumber.trim() ||
          !!currentProperty.ownerName.trim(),
    [
      currentProperty.identifierType,
      currentProperty.district,
      currentProperty.classification,
      currentProperty.deedNumber,
      currentProperty.taskNumber,
      currentProperty.ownerName,
    ],
  );

  const enteredCount =
    properties.length + (hasCurrentDraft ? 1 : 0);

  const propertyOrdinal = alreadyRegistered + properties.length + 1;

  const canAddAnother =
    remainingSlots > 1 && properties.length + 1 < remainingSlots;

  const isDirty = useMemo(
    () => properties.length > 0 || hasCurrentDraft,
    [properties.length, hasCurrentDraft],
  );

  const patchProperty = useCallback(
    <K extends keyof PoPropertyIntake>(key: K, value: PoPropertyIntake[K]) => {
      setCurrentProperty((p) => ({ ...p, [key]: value }));
      setFieldErrors((e) => {
        if (!e[String(key)]) return e;
        const next = { ...e };
        delete next[String(key)];
        return next;
      });
    },
    [],
  );

  function commitCurrentProperty(): PoPropertyIntake {
    return {
      ...currentProperty,
      contacts: contactsForApi(currentProperty.contacts),
    };
  }

  function validateCurrent(): boolean {
    if (!record) return false;
    const errors = mergePropertyEnfathValidation(
      currentProperty,
      record.assignmentType,
    );
    if (hasFieldErrors(errors)) {
      setFieldErrors(errors);
      setFormError(firstEnfathValidationMessage(errors));
      return false;
    }
    return true;
  }

  function scrollToActive() {
    requestAnimationFrame(() => {
      activePropertyRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function startAnotherProperty() {
    if (!validateCurrent()) return;
    setProperties((prev) => [...prev, commitCurrentProperty()]);
    setCurrentProperty(emptyProperty());
    setFieldErrors({});
    setFormError(null);
    scrollToActive();
  }

  function editStackedProperty(index: number) {
    const target = properties[index];
    const hasDraft =
      !!currentProperty.deedNumber.trim() ||
      !!currentProperty.taskNumber.trim();
    setProperties((prev) => {
      let next = prev.filter((_, i) => i !== index);
      if (hasDraft) next = [...next, commitCurrentProperty()];
      return next;
    });
    setCurrentProperty(target);
    setFieldErrors({});
    setFormError(null);
    scrollToActive();
  }

  async function persistProperty(prop: PoPropertyIntake): Promise<boolean> {
    if (
      !isBourseInquiryIdentifier(prop.identifierType) &&
      (await deedExistsInPo(poNumber, prop.deedNumber, prop.id))
    ) {
      setFormError("رقم الصك مسجّل مسبقاً في هذا أمر العمل");
      setFieldErrors({ deedNumber: "رقم الصك مسجّل مسبقاً في هذا أمر العمل" });
      return false;
    }
    const result = await addPropertyToPo(poNumber, prop);
    if (!result.ok) {
      setFormError(
        result.errors
          ? firstEnfathValidationMessage(result.errors)
          : result.error,
      );
      if (result.errors) setFieldErrors(result.errors);
      return false;
    }
    return true;
  }

  async function handleSaveAll() {
    if (!record) return;

    const stackedIssue = findInvalidEnfathPropertyIndex(
      properties,
      record.assignmentType,
    );
    if (stackedIssue) {
      setFormError(
        `عقار ${stackedIssue.index + 1}: ${firstEnfathValidationMessage(stackedIssue.errors)} — اضغط «تعديل»`,
      );
      return;
    }
    if (!validateCurrent()) return;

    const all = [...properties, commitCurrentProperty()];
    setSaving(true);
    setFormError(null);
    setFieldErrors({});

    for (const prop of all) {
      const ok = await persistProperty(prop);
      if (!ok) {
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    onSavedAction();
  }

  if (loading) {
    return (
      <PoIntakeWizardShell
        steps={PROPERTY_STEPS}
        step={1}
        hint=""
        showPrev={false}
        nextLabel="رجوع"
        flowTitle="إضافة عقار"
        onBack={onBackAction}
        onPrev={() => {}}
        onNext={onBackAction}
      >
        <p style={{ color: "var(--text3)" }}>جاري التحميل…</p>
      </PoIntakeWizardShell>
    );
  }

  if (!record) {
    return (
      <PoIntakeWizardShell
        steps={PROPERTY_STEPS}
        step={1}
        hint=""
        showPrev={false}
        nextLabel="رجوع"
        flowTitle="إضافة عقار"
        onBack={onBackAction}
        onPrev={() => {}}
        onNext={onBackAction}
      >
        <div className="note note-warn">لم يُعثر على أمر العمل.</div>
      </PoIntakeWizardShell>
    );
  }

  if (remainingSlots === 0) {
    return (
      <PoIntakeWizardShell
        steps={PROPERTY_STEPS}
        step={1}
        hint=""
        showPrev={false}
        nextLabel="العودة لقائمة العقارات"
        flowTitle={`تسجيل العقارات — ${formatPoDisplay(poNumber)}`}
        flowDept="قسم دراسة الحالة"
        onBack={onBackAction}
        onPrev={() => {}}
        onNext={onBackAction}
      >
        <div className="note note-info">
          تم تسجيل {alreadyRegistered} من {expectedTotal} عقارات حسب التعميد.
          لا يتبقى عقارات لإضافتها من هذه الشاشة.
        </div>
      </PoIntakeWizardShell>
    );
  }

  return (
    <PoIntakeWizardShell
      steps={PROPERTY_STEPS}
      step={1}
      hint={PROPERTY_HINT}
      saving={saving}
      showPrev={false}
      nextLabel="حفظ العقارات"
      isDirty={isDirty}
      flowTitle={`تسجيل العقارات — ${formatPoDisplay(poNumber)}`}
      flowDept="قسم دراسة الحالة"
      onBack={onBackAction}
      onPrev={() => {}}
      onNext={() => void handleSaveAll()}
    >
      {formError ? (
        <div className="note note-warn" style={{ marginBottom: 12 }}>
          {formError}
        </div>
      ) : null}

      <div className="note note-info" style={{ marginBottom: 14 }}>
        بيانات مرحلة إنفاذ — تُكمّل بيانات البورصة لاحقاً من «استعلام البورصة».
        مسجّل مسبقاً: {alreadyRegistered} من {expectedTotal}.
      </div>

      <div className="po-property-stack">
        <div className="reg-sp2 po-count-field po-property-count-summary">
          <label className="reg-fl" htmlFor="po_property_count_display">
            عدد العقارات في هذه الجلسة
          </label>
          <div
            id="po_property_count_display"
            className="po-count-box"
            aria-live="polite"
            aria-label={`${enteredCount} من ${remainingSlots} في هذه الجلسة`}
          >
            <span
              className={`po-count-box-value${enteredCount === 0 ? " is-zero" : ""}`}
            >
              {enteredCount}
            </span>
            <span className="po-count-box-unit">من {remainingSlots}</span>
            <span className="po-count-box-tag">يتغيّر أثناء التسجيل</span>
          </div>
        </div>

        {properties.map((prop, index) => (
          <PoPropertyStackCard
            key={prop.id}
            index={alreadyRegistered + index + 1}
            property={prop}
            assignmentType={record.assignmentType}
            onEdit={() => editStackedProperty(index)}
            onRemove={() =>
              setProperties((prev) => prev.filter((_, i) => i !== index))
            }
          />
        ))}

        <div ref={activePropertyRef} className="po-property-stack-active">
          <RegistrationFormCard
            title={`عقار ${propertyOrdinal} — بيانات إنفاذ`}
            subtitle="البيانات الواردة من منصة إنفاذ"
          >
            <PoPropertyEnfathForm
              property={currentProperty}
              propertyOrdinal={propertyOrdinal}
              assignmentType={record.assignmentType}
              fieldErrors={fieldErrors}
              onPatch={patchProperty}
              poNumber={poNumber}
              showStageNote={false}
            />
          </RegistrationFormCard>
        </div>

        {canAddAnother ? (
          <div className="po-intake-add-property">
            <button
              type="button"
              className="btn btn-sm"
              onClick={startAnotherProperty}
            >
              + إضافة عقار آخر
            </button>
          </div>
        ) : null}
      </div>
    </PoIntakeWizardShell>
  );
}
