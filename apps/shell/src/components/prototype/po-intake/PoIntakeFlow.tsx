"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ASSIGNMENT_TYPE_OPTIONS,
  computeBusinessDueDate,
  emptyProperty,
  formatDateAr,
  PO_INTAKE_HINTS,
  PO_INTAKE_STEPS,
  requiresAssignmentDecree,
  type AssignmentType,
  type PoIntakeRecord,
  type PoPropertyIntake,
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
import { PoPropertyForm } from "./PoPropertyForm";
import { PoPropertyStackCard } from "./PoPropertyStackCard";

const LAST_STEP = PO_INTAKE_STEPS.length;

export function PoIntakeFlow({
  onCompleteAction,
  onBackAction,
}: {
  onCompleteAction: (record: PoIntakeRecord) => void;
  onBackAction: () => void;
}) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [savedRecord, setSavedRecord] = useState<PoIntakeRecord | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [poNumber, setPoNumber] = useState("");
  const [assignmentType, setAssignmentType] = useState<AssignmentType | "">("");
  const [receivedFromEnfathAt, setReceivedFromEnfathAt] = useState("");
  const [receivedFromEnfathTime, setReceivedFromEnfathTime] = useState("10:00");
  const [internalAssignmentAt, setInternalAssignmentAt] = useState("");
  const [assignmentSpecialist, setAssignmentSpecialist] = useState("");
  const [properties, setProperties] = useState<PoPropertyIntake[]>([]);
  const [currentProperty, setCurrentProperty] = useState<PoPropertyIntake>(
    emptyProperty,
  );
  const activePropertyRef = useRef<HTMLDivElement>(null);

  const propertyOrdinal = properties.length + 1;
  const totalPropertiesPreview =
    step >= 2 ? properties.length + 1 : properties.length;

  const dueDateAt = useMemo(
    () => computeBusinessDueDate(receivedFromEnfathAt, receivedFromEnfathTime),
    [receivedFromEnfathAt, receivedFromEnfathTime],
  );

  const showAssignmentDecree = requiresAssignmentDecree(
    assignmentType as AssignmentType,
  );

  const isSuccess = step > LAST_STEP;
  const hint =
    PO_INTAKE_HINTS[Math.min(step - 1, PO_INTAKE_HINTS.length - 1)] ?? "";

  const isDirty = useMemo(() => {
    return (
      !!poNumber.trim() ||
      !!assignmentType ||
      !!receivedFromEnfathAt ||
      !!internalAssignmentAt ||
      !!assignmentSpecialist.trim() ||
      properties.length > 0 ||
      !!currentProperty.deedNumber.trim()
    );
  }, [
    poNumber,
    assignmentType,
    receivedFromEnfathAt,
    internalAssignmentAt,
    assignmentSpecialist,
    properties,
    currentProperty.deedNumber,
  ]);

  useEffect(() => {
    const draft = loadPoDraft();
    if (!draft) return;
    setStep(draft.step);
    setPoNumber(draft.poNumber);
    setAssignmentType(draft.assignmentType || "");
    setReceivedFromEnfathAt(draft.receivedFromEnfathAt);
    setReceivedFromEnfathTime(draft.receivedFromEnfathTime || "10:00");
    setInternalAssignmentAt(draft.internalAssignmentAt);
    setAssignmentSpecialist(draft.assignmentSpecialist);
    setProperties(draft.properties);
    setCurrentProperty(draft.currentProperty);
  }, []);

  useEffect(() => {
    if (isSuccess) return;
    savePoDraft({
      step,
      poNumber,
      assignmentType,
      receivedFromEnfathAt,
      receivedFromEnfathTime,
      internalAssignmentAt,
      assignmentSpecialist,
      properties,
      currentProperty,
    });
  }, [
    step,
    poNumber,
    assignmentType,
    receivedFromEnfathAt,
    receivedFromEnfathTime,
    internalAssignmentAt,
    assignmentSpecialist,
    properties,
    currentProperty,
    isSuccess,
  ]);

  const patchProperty = useCallback(
    <K extends keyof PoPropertyIntake>(key: K, value: PoPropertyIntake[K]) => {
      setCurrentProperty((p) => {
        const next = { ...p, [key]: value };
        if (key === "classification") {
          next.propertyType = "";
        }
        return next;
      });
      setFieldErrors((e) => {
        if (!e[String(key)]) return e;
        const next = { ...e };
        delete next[String(key)];
        return next;
      });
    },
    [],
  );

  function clearErrors() {
    setFieldErrors({});
    setFormError(null);
  }

  async function validateStep1(): Promise<boolean> {
    clearErrors();
    const errors = mergeFieldErrors(
      collectRequiredErrors(
        {
          poNumber,
          assignmentType,
          receivedFromEnfathAt,
          internalAssignmentAt,
          assignmentSpecialist,
        },
        [
          "poNumber",
          "assignmentType",
          "receivedFromEnfathAt",
          "internalAssignmentAt",
          "assignmentSpecialist",
        ],
      ),
    );
    if (hasFieldErrors(errors)) {
      setFieldErrors(errors);
      setFormError("يرجى تعبئة بيانات أمر العمل");
      return false;
    }
    if (await poRecordExists(poNumber)) {
      setFieldErrors({ poNumber: "رقم PO مسجّل مسبقاً في النظام" });
      setFormError(null);
      return false;
    }
    return true;
  }

  function validateProperty(p: PoPropertyIntake): FieldErrors {
    const errors = mergeFieldErrors(
      collectRequiredErrors(
        {
          deedNumber: p.deedNumber,
          city: p.city,
          district: p.district,
          classification: p.classification,
          propertyType: p.propertyType,
        },
        ["deedNumber", "city", "district", "classification", "propertyType"],
      ),
    );

    if (showAssignmentDecree && !p.assignmentDocFileName.trim()) {
      errors.assignmentDocFileName = "مرفق قرار الإسناد مطلوب لمسار التنفيذ";
    }

    if (
      p.identifierType === "real_estate_reg" &&
      !p.realEstateRegFileName.trim()
    ) {
      errors.realEstateRegFileName =
        "ارفع السجل العقاري كمرفق (يُطلب من أطراف التنفيذ)";
    }

    return errors;
  }

  function validateContacts(p: PoPropertyIntake): FieldErrors {
    const errors: FieldErrors = {};
    let hasValid = false;
    p.contacts.forEach((c, i) => {
      if (!c.name.trim()) {
        errors[`contact_name_${i}`] = "الاسم مطلوب";
      }
      if (!c.phone.trim()) {
        errors[`contact_phone_${i}`] = "رقم الجوال مطلوب";
      }
      if (c.name.trim() && c.phone.trim()) hasValid = true;
    });
    if (!hasValid) {
      errors._contacts = "أضف ضابط اتصال واحداً على الأقل";
    }
    return errors;
  }

  function commitCurrentProperty(): PoPropertyIntake {
    return {
      ...currentProperty,
      contacts: currentProperty.contacts.filter(
        (c) => c.name.trim() || c.phone.trim(),
      ),
    };
  }

  function validateCurrentPropertyStep(): boolean {
    const propErrors = validateProperty(currentProperty);
    const contactErrors = validateContacts(currentProperty);
    const errors = mergeFieldErrors(propErrors, contactErrors);
    if (hasFieldErrors(errors)) {
      setFieldErrors(errors);
      setFormError(
        errors._contacts ??
          errors.assignmentDocFileName ??
          errors.realEstateRegFileName ??
          "أكمل بيانات هذا العقار",
      );
      return false;
    }
    return true;
  }

  function scrollToActiveProperty() {
    requestAnimationFrame(() => {
      activePropertyRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function startAnotherProperty() {
    if (!validateCurrentPropertyStep()) return;
    setProperties((prev) => [...prev, commitCurrentProperty()]);
    setCurrentProperty(emptyProperty());
    setFieldErrors({});
    setFormError(null);
    scrollToActiveProperty();
  }

  function editStackedProperty(index: number) {
    const target = properties[index];
    const hasCurrentDraft =
      !!currentProperty.deedNumber.trim() ||
      !!currentProperty.city.trim() ||
      !!currentProperty.district.trim();

    setProperties((prev) => {
      let next = prev.filter((_, i) => i !== index);
      if (hasCurrentDraft) {
        next = [...next, commitCurrentProperty()];
      }
      return next;
    });
    setCurrentProperty(target);
    clearErrors();
    scrollToActiveProperty();
  }

  function removeStackedProperty(index: number) {
    setProperties((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleNext() {
    if (step === 1) {
      if (!(await validateStep1())) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      await handleSave();
    }
  }

  async function handleSave() {
    if (!validateCurrentPropertyStep()) return;

    const allProperties = [...properties, commitCurrentProperty()];

    if (allProperties.length === 0) {
      setFormError("يجب تسجيل عقار واحد على الأقل");
      return;
    }

    setSaving(true);
    clearErrors();

    const record = buildPoRecord({
      poNumber: poNumber.trim(),
      assignmentType: assignmentType as AssignmentType,
      receivedFromEnfathAt,
      receivedFromEnfathTime,
      internalAssignmentAt,
      assignmentSpecialist: assignmentSpecialist.trim(),
      properties: allProperties,
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

  function handlePrev() {
    clearErrors();
    if (step === 2 && properties.length > 0) {
      const last = properties[properties.length - 1];
      setProperties((p) => p.slice(0, -1));
      setCurrentProperty(last);
    }
    setStep((s) => Math.max(1, s - 1));
  }

  function resetForAnother() {
    setStep(1);
    setPoNumber("");
    setAssignmentType("");
    setReceivedFromEnfathAt("");
    setReceivedFromEnfathTime("10:00");
    setInternalAssignmentAt("");
    setAssignmentSpecialist("");
    setProperties([]);
    setCurrentProperty(emptyProperty());
    setSavedRecord(null);
    clearPoDraft();
    clearErrors();
  }

  const nextLabel = step === 2 ? "حفظ أمر العمل" : "متابعة لتسجيل العقارات";

  return (
    <PoIntakeWizardShell
      steps={PO_INTAKE_STEPS}
      step={Math.min(step, LAST_STEP)}
      hint={hint}
      saving={saving}
      success={isSuccess}
      showPrev={step > 1 && !isSuccess}
      nextLabel={nextLabel}
      isDirty={isDirty}
      onBack={onBackAction}
      onPrev={handlePrev}
      onNext={() => void handleNext()}
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

      {!isSuccess && step === 1 ? (
        <RegistrationFormCard
          title="بيانات أمر العمل (PO)"
          subtitle="يُنسخ رقم التعميد من منصة إنفاذ — المرجع الأساسي للفوترة والمتابعة"
        >
          <div className="note note-info" style={{ marginBottom: 14 }}>
            رقم PO = رقم التعميد. تاريخ الاستلام من إنفاذ هو نقطة بداية حساب
            مدة الإنجاز (4 أيام عمل: الأحد–الخميس).
          </div>
          <div className="reg-fg2">
            <RegField
              id="po_number"
              label="رقم PO (التعميد)"
              required
              dir="ltr"
              value={poNumber}
              error={fieldErrors.poNumber}
              placeholder="مثال: PO-2025-001"
              onChange={setPoNumber}
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
              id="po_received"
              label="تاريخ الاستلام من إنفاذ"
              required
              type="date"
              value={receivedFromEnfathAt}
              error={fieldErrors.receivedFromEnfathAt}
              onChange={setReceivedFromEnfathAt}
            />
            <RegField
              id="po_received_time"
              label="وقت الاستلام (اختياري — §6)"
              type="time"
              dir="ltr"
              value={receivedFromEnfathTime}
              onChange={setReceivedFromEnfathTime}
            />
            <RegField
              id="po_internal"
              label="تاريخ التكليف الداخلي"
              required
              type="date"
              value={internalAssignmentAt}
              error={fieldErrors.internalAssignmentAt}
              onChange={setInternalAssignmentAt}
            />
            <RegField
              id="po_specialist"
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
                  <span className="po-count-box-value">{formatDateAr(dueDateAt)}</span>
                  <span className="po-count-box-tag">محسوب تلقائياً</span>
                </div>
              </div>
            ) : null}
            <div className="reg-sp2 po-count-field">
              <label className="reg-fl" htmlFor="po_count_display">
                عدد العقارات
              </label>
              <div
                id="po_count_display"
                className="po-count-box"
                aria-live="polite"
                aria-label={`عدد العقارات: ${totalPropertiesPreview}`}
              >
                <span
                  className={`po-count-box-value${totalPropertiesPreview === 0 ? " is-zero" : ""}`}
                >
                  {totalPropertiesPreview}
                </span>
                <span className="po-count-box-unit">
                  {totalPropertiesPreview === 1 ? "عقار" : "عقارات"}
                </span>
                <span className="po-count-box-tag">يُحدَّث في الخطوة التالية</span>
              </div>
            </div>
          </div>
        </RegistrationFormCard>
      ) : null}

      {!isSuccess && step === 2 ? (
        <div className="po-property-stack">
          {properties.map((prop, index) => (
            <PoPropertyStackCard
              key={prop.id}
              index={index + 1}
              property={prop}
              onEdit={() => editStackedProperty(index)}
              onRemove={() => removeStackedProperty(index)}
            />
          ))}

          <div ref={activePropertyRef} className="po-property-stack-active">
            <RegistrationFormCard
              title={`تسجيل العقار ${propertyOrdinal}`}
              subtitle="بيانات الصك وضابط الاتصال — يُستعلم عن بورصة العقارات خارج النظام ثم تُدخل النتائج هنا"
              headerRight={
                properties.length > 0 ? (
                  <span className="badge b-prog">
                    {properties.length} عقار في المكدس
                  </span>
                ) : null
              }
            >
              <PoPropertyForm
                property={currentProperty}
                assignmentType={assignmentType as AssignmentType}
                fieldErrors={fieldErrors}
                onPatch={patchProperty}
                excludePoNumber={poNumber.trim() || undefined}
              />
            </RegistrationFormCard>
          </div>

          <div className="po-intake-add-property">
            <button
              type="button"
              className="btn btn-sm"
              onClick={startAnotherProperty}
            >
              + إضافة عقار آخر
            </button>
          </div>
        </div>
      ) : null}
    </PoIntakeWizardShell>
  );
}
