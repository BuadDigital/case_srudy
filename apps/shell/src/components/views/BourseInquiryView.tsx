"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  emptyProperty,
  formatDateAr,
  type PoPropertyIntake,
} from "@/lib/prototype/po-intake-data";
import {
  completePropertyBourse,
  findPropertyInRecord,
  loadPendingBourseItems,
} from "@/lib/prototype/po-intake-storage";
import { poPropertiesPath } from "@/lib/po-routes";
import { RegistrationFormCard } from "@/components/prototype/registration/RegistrationFormCard";
import {
  hasFieldErrors,
  type FieldErrors,
} from "@/components/prototype/registration/registration-utils";
import { PoPropertyBourseForm } from "@/components/prototype/po-intake/PoPropertyBourseForm";
import {
  firstBourseValidationMessage,
  validatePropertyBourseFields,
} from "@/components/prototype/po-intake/po-property-bourse-validation";
import type { PendingBoursePropertyDto } from "@platform/api-client";

export function BourseInquiryView() {
  const router = useRouter();
  const [items, setItems] = useState<PendingBoursePropertyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PendingBoursePropertyDto | null>(null);
  const [property, setProperty] = useState<PoPropertyIntake>(emptyProperty);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await loadPendingBourseItems();
    setItems(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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

  async function openItem(item: PendingBoursePropertyDto) {
    setSelected(item);
    setFormError(null);
    setFieldErrors({});
    const hit = await findPropertyInRecord(item.poNumber, item.propertyId);
    if (hit) {
      setProperty({ ...hit.property, id: item.propertyId });
    } else {
      setProperty({
        ...emptyProperty(),
        id: item.propertyId,
        deedNumber: item.deedNumber,
        ownerName: item.ownerName ?? "",
        taskNumber: item.taskNumber ?? "",
      });
    }
  }

  function closeForm() {
    setSelected(null);
    setProperty(emptyProperty());
    setFormError(null);
    setFieldErrors({});
  }

  async function handleSubmit() {
    if (!selected) return;
    const errors = validatePropertyBourseFields(property);
    if (hasFieldErrors(errors)) {
      setFieldErrors(errors);
      setFormError(firstBourseValidationMessage(errors));
      return;
    }

    setSaving(true);
    setFormError(null);
    const result = await completePropertyBourse(
      selected.poNumber,
      selected.propertyId,
      property,
    );
    setSaving(false);

    if (!result.ok) {
      setFormError(result.error);
      if (result.errors) setFieldErrors(result.errors);
      return;
    }

    closeForm();
    await refresh();
  }

  return (
    <div className="po-bourse-inquiry-page">
      <div className="page-hdr">
        <div>
          <h1 className="page-title">استعلام البورصة</h1>
          <p className="page-sub">
            صكوك بانتظار إكمال بيانات البورصة (المدينة، التصنيف، الحدود)
          </p>
        </div>
      </div>

      <div className="po-bourse-inquiry-layout">
        <div className="card po-bourse-queue">
          <div className="card-hd">
            <h2 className="card-title">قائمة الانتظار</h2>
            <span className="badge b-prog">{items.length}</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <p style={{ padding: 16, color: "var(--text3)" }}>جاري التحميل…</p>
            ) : items.length === 0 ? (
              <p style={{ padding: 16, color: "var(--text3)" }}>
                لا توجد صكوك بانتظار البورصة.
              </p>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>أمر العمل</th>
                    <th>رقم الصك</th>
                    <th>المالك</th>
                    <th>الاستحقاق</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={`${item.poNumber}-${item.propertyId}`}>
                      <td dir="ltr">{item.poNumber}</td>
                      <td dir="ltr">{item.deedNumber}</td>
                      <td>{item.ownerName || "—"}</td>
                      <td>{formatDateAr(item.dueDateAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => void openItem(item)}
                        >
                          إكمال بيانات البورصة
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {selected ? (
          <div className="card po-bourse-form-panel">
            <div className="card-hd">
              <h2 className="card-title">
                بيانات البورصة — {selected.deedNumber}
              </h2>
              <button type="button" className="btn btn-sm" onClick={closeForm}>
                إغلاق
              </button>
            </div>
            <div className="card-body">
              {formError ? (
                <div className="note note-warn" style={{ marginBottom: 12 }}>
                  {formError}
                </div>
              ) : null}
              <RegistrationFormCard
                title={`PO ${selected.poNumber}`}
                subtitle={selected.ownerName || "—"}
              >
                <PoPropertyBourseForm
                  property={property}
                  fieldErrors={fieldErrors}
                  onPatch={patchProperty}
                />
              </RegistrationFormCard>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={saving}
                  onClick={() => void handleSubmit()}
                >
                  {saving ? "جاري الحفظ…" : "حفظ وإكمال البورصة"}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    router.push(poPropertiesPath(selected.poNumber))
                  }
                >
                  عرض أمر العمل
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
