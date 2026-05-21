"use client";

import { useCallback, useEffect, useState } from "react";
import {
  formatPoDisplay,
  type PoIntakeRecord,
  type PoPropertyIntake,
} from "@/lib/prototype/po-intake-data";
import {
  completePropertyBourse,
  deedExistsInPo,
  findPropertyInRecord,
  removePropertyFromPo,
  updatePropertyInPo,
} from "@/lib/prototype/po-intake-storage";
import { RegistrationFormCard } from "@/components/prototype/registration/RegistrationFormCard";
import {
  hasFieldErrors,
  mergeFieldErrors,
  type FieldErrors,
} from "@/components/prototype/registration/registration-utils";
import { PoEditShell } from "./PoEditShell";
import { PoPropertyBourseForm } from "./PoPropertyBourseForm";
import { PoPropertyEnfathForm } from "./PoPropertyEnfathForm";
import {
  firstBourseValidationMessage,
  validatePropertyBourseFields,
} from "./po-property-bourse-validation";
import {
  firstEnfathValidationMessage,
  isValidContactEntry,
  mergePropertyEnfathValidation,
} from "./po-property-enfath-validation";

export function PoPropertyEdit({
  poNumber,
  propertyId,
  onBackAction,
  onSavedAction,
  onDeletedAction,
}: {
  poNumber: string;
  propertyId: string;
  onBackAction: () => void;
  onSavedAction: () => void;
  onDeletedAction?: () => void;
}) {
  const [initialRecord, setInitialRecord] = useState<PoIntakeRecord | null>(null);
  const [property, setProperty] = useState<PoPropertyIntake | null>(null);
  const [loading, setLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void findPropertyInRecord(poNumber, propertyId).then((found) => {
      if (cancelled) return;
      if (found) {
        setInitialRecord(found.record);
        setProperty(found.property);
      } else {
        setInitialRecord(null);
        setProperty(null);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [poNumber, propertyId]);

  const patchProperty = useCallback(
    <K extends keyof PoPropertyIntake>(key: K, value: PoPropertyIntake[K]) => {
      setProperty((p) => {
        if (!p) return p;
        const next = { ...p, [key]: value };
        if (key === "classification") next.propertyType = "";
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

  if (loading) {
    return (
      <PoEditShell
        title="تعديل العقار"
        onBack={onBackAction}
        onSave={onBackAction}
        saveLabel="رجوع"
      >
        <p style={{ color: "var(--text3)" }}>جاري التحميل…</p>
      </PoEditShell>
    );
  }

  if (!initialRecord || !property) {
    return (
      <PoEditShell
        title="تعديل العقار"
        onBack={onBackAction}
        onSave={onBackAction}
        saveLabel="رجوع"
      >
        <div className="note note-warn">لم يُعثر على العقار.</div>
      </PoEditShell>
    );
  }

  async function handleSave() {
    if (!initialRecord || !property) return;

    const enfathErrors = mergePropertyEnfathValidation(
      property,
      initialRecord.assignmentType,
    );
    const bourseErrors = property.bourseDataCompleted
      ? validatePropertyBourseFields(property)
      : {};
    const errors = mergeFieldErrors(enfathErrors, bourseErrors);

    if (await deedExistsInPo(poNumber, property.deedNumber, propertyId)) {
      errors.deedNumber = "رقم الصك مسجّل مسبقاً في هذا أمر العمل";
    }

    if (hasFieldErrors(errors)) {
      setFieldErrors(errors);
      setFormError(
        firstEnfathValidationMessage(errors) ||
          firstBourseValidationMessage(errors),
      );
      return;
    }

    setSaving(true);
    setFormError(null);

    const committed: PoPropertyIntake = {
      ...property,
      identifierType: "deed",
      contacts: property.contacts.filter((c) => isValidContactEntry(c)),
    };

    const result = await updatePropertyInPo(poNumber, propertyId, committed);
    if (!result.ok) {
      setSaving(false);
      setFormError(result.error);
      if (result.errors) setFieldErrors(result.errors);
      return;
    }

    if (property.bourseDataCompleted) {
      const bourseResult = await completePropertyBourse(
        poNumber,
        propertyId,
        committed,
      );
      setSaving(false);
      if (!bourseResult.ok) {
        setFormError(bourseResult.error);
        if (bourseResult.errors) setFieldErrors(bourseResult.errors);
        return;
      }
    } else {
      setSaving(false);
    }

    onSavedAction();
  }

  async function handleDelete() {
    if (
      !window.confirm(
        "حذف هذا العقار من أمر العمل؟ لا يمكن التراجع عن الحذف.",
      )
    ) {
      return;
    }
    setSaving(true);
    const result = await removePropertyFromPo(poNumber, propertyId);
    setSaving(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    if (onDeletedAction) onDeletedAction();
    else onSavedAction();
  }

  return (
    <PoEditShell
      title={`تعديل عقار — ${property.deedNumber || poNumber}`}
      subtitle={`أخصائي دراسة الحالة · ${formatPoDisplay(poNumber)}`}
      saving={saving}
      onBack={onBackAction}
      onSave={() => void handleSave()}
      footerExtra={
        <button
          type="button"
          className="btn btn-danger-outline"
          disabled={saving}
          onClick={() => void handleDelete()}
        >
          حذف العقار
        </button>
      }
    >
      {formError ? (
        <div className="note note-warn" style={{ marginBottom: 12 }}>
          {formError}
        </div>
      ) : null}

      <RegistrationFormCard title="بيانات إنفاذ (الصك)">
        <PoPropertyEnfathForm
          property={property}
          assignmentType={initialRecord.assignmentType}
          fieldErrors={fieldErrors}
          onPatch={patchProperty}
          poNumber={poNumber}
        />
      </RegistrationFormCard>

      {property.bourseDataCompleted ? (
        <RegistrationFormCard
          title="بيانات البورصة"
          subtitle="يمكن تعديلها هنا أو من استعلام البورصة"
        >
          <PoPropertyBourseForm
            property={property}
            fieldErrors={fieldErrors}
            onPatch={patchProperty}
          />
        </RegistrationFormCard>
      ) : (
        <div className="note note-info" style={{ marginTop: 12 }}>
          بيانات البورصة غير مكتملة — أكملها من «استعلام البورصة» في القائمة
          الجانبية.
        </div>
      )}
    </PoEditShell>
  );
}
