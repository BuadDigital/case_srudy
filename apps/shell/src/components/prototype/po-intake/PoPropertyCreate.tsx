"use client";

import { useCallback, useEffect, useState } from "react";
import {
  emptyProperty,
  formatPoDisplay,
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
  mergeFieldErrors,
  type FieldErrors,
} from "@/components/prototype/registration/registration-utils";
import { PoEditShell } from "./PoEditShell";
import { PoPropertyForm } from "./PoPropertyForm";
import {
  validatePropertyContacts,
  validatePropertyFields,
} from "./po-property-validation";

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
  const [property, setProperty] = useState<PoPropertyIntake>(emptyProperty);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void getPoRecord(poNumber).then((loaded) => {
      if (cancelled) return;
      setRecord(loaded);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [poNumber]);

  const patchProperty = useCallback(
    <K extends keyof PoPropertyIntake>(key: K, value: PoPropertyIntake[K]) => {
      setProperty((p) => {
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
        title="إضافة عقار"
        onBack={onBackAction}
        onSave={onBackAction}
        saveLabel="رجوع"
      >
        <p style={{ color: "var(--text3)" }}>جاري التحميل…</p>
      </PoEditShell>
    );
  }

  if (!record) {
    return (
      <PoEditShell
        title="إضافة عقار"
        onBack={onBackAction}
        onSave={onBackAction}
        saveLabel="رجوع"
      >
        <div className="note note-warn">لم يُعثر على أمر العمل.</div>
      </PoEditShell>
    );
  }

  async function handleSave() {
    if (!record) return;

    const propErrors = validatePropertyFields(property, record.assignmentType);
    const contactErrors = validatePropertyContacts(property);
    const errors = mergeFieldErrors(propErrors, contactErrors);

    if (await deedExistsInPo(poNumber, property.deedNumber)) {
      errors.deedNumber = "رقم الصك مسجّل مسبقاً في هذا أمر العمل";
    }

    if (hasFieldErrors(errors)) {
      setFieldErrors(errors);
      setFormError(
        errors._contacts ??
          errors.deedNumber ??
          errors.assignmentDocFileName ??
          "يرجى تعبئة بيانات العقار",
      );
      return;
    }

    setSaving(true);
    setFormError(null);

    const committed: PoPropertyIntake = {
      ...property,
      contacts: property.contacts.filter(
        (c) => c.name.trim() || c.phone.trim(),
      ),
    };

    const result = await addPropertyToPo(poNumber, committed);
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
      title={`إضافة عقار — ${formatPoDisplay(poNumber)}`}
      subtitle="أخصائي دراسة الحالة"
      saving={saving}
      onBack={onBackAction}
      onSave={() => void handleSave()}
      saveLabel="حفظ العقار"
    >
      {formError ? (
        <div className="note note-warn" style={{ marginBottom: 12 }}>
          {formError}
        </div>
      ) : null}

      <RegistrationFormCard title="بيانات الصك وضابط الاتصال">
        <PoPropertyForm
          property={property}
          assignmentType={record.assignmentType}
          fieldErrors={fieldErrors}
          onPatch={patchProperty}
          excludePoNumber={poNumber}
        />
      </RegistrationFormCard>
    </PoEditShell>
  );
}
