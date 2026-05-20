"use client";

import { useCallback, useEffect, useState } from "react";
import {
  formatPoDisplay,
  type PoIntakeRecord,
  type PoPropertyIntake,
} from "@/lib/prototype/po-intake-data";
import {
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
import { PoPropertyForm } from "./PoPropertyForm";
import {
  validatePropertyContacts,
  validatePropertyFields,
} from "./po-property-validation";

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

  const canDelete = initialRecord.properties.length > 1;

  async function handleSave() {
    if (!initialRecord || !property) return;

    const propErrors = validatePropertyFields(
      property,
      initialRecord.assignmentType,
    );
    const contactErrors = validatePropertyContacts(property);
    const errors = mergeFieldErrors(propErrors, contactErrors);

    if (await deedExistsInPo(poNumber, property.deedNumber, propertyId)) {
      errors.deedNumber = "رقم الصك مسجّل مسبقاً في هذا أمر العمل";
    }

    if (hasFieldErrors(errors)) {
      setFieldErrors(errors);
      setFormError(
        errors._contacts ??
          errors.deedNumber ??
          errors.assignmentDocFileName ??
          errors.realEstateRegFileName ??
          "يرجى تصحيح بيانات العقار",
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

    const result = await updatePropertyInPo(poNumber, propertyId, committed);
    setSaving(false);

    if (!result.ok) {
      setFormError(result.error);
      if (result.errors) setFieldErrors(result.errors);
      return;
    }

    onSavedAction();
  }

  async function handleDelete() {
    if (!canDelete) return;
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
        canDelete ? (
          <button
            type="button"
            className="btn btn-danger-outline"
            disabled={saving}
            onClick={() => void handleDelete()}
          >
            حذف العقار
          </button>
        ) : (
          <span className="reg-field-hint" style={{ alignSelf: "center" }}>
            لا يمكن حذف العقار الوحيد
          </span>
        )
      }
    >
      {formError ? (
        <div className="note note-warn" style={{ marginBottom: 12 }}>
          {formError}
        </div>
      ) : null}

      <RegistrationFormCard title="بيانات الصك وضابط الاتصال">
        <PoPropertyForm
          property={property}
          assignmentType={initialRecord.assignmentType}
          fieldErrors={fieldErrors}
          onPatch={patchProperty}
          excludePoNumber={poNumber}
        />
      </RegistrationFormCard>
    </PoEditShell>
  );
}
