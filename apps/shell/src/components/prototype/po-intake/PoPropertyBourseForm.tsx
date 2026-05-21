"use client";

import { useMemo } from "react";
import {
  BOUNDARIES_AVAILABILITY_OPTIONS,
  CITY_OPTIONS,
  CLASSIFICATION_OPTIONS,
  DEED_STATUS_OPTIONS,
  PROPERTY_CLASSIFICATIONS,
  RESTRICTIONS_PRESENT_OPTIONS,
  type PoPropertyIntake,
} from "@/lib/prototype/po-intake-data";
import { RegField, RegSelect } from "@/components/prototype/registration/FormFields";
import type { FieldErrors } from "@/components/prototype/registration/registration-utils";

type Props = {
  property: PoPropertyIntake;
  fieldErrors: FieldErrors;
  onPatch: <K extends keyof PoPropertyIntake>(
    key: K,
    value: PoPropertyIntake[K],
  ) => void;
};

export function PoPropertyBourseForm({ property, fieldErrors, onPatch }: Props) {
  const propertyTypes = useMemo(() => {
    const c = property.classification;
    return c ? (PROPERTY_CLASSIFICATIONS[c] ?? []) : [];
  }, [property.classification]);

  return (
    <>
      <div className="note note-info" style={{ marginBottom: 12 }}>
        بيانات البورصة — التصنيف ونوع العقار من القائمة الهرمية المعتمدة في
        النظام (5 تصنيفات / 47 نوعاً).
      </div>

      <div className="reg-fg2">
        <RegSelect
          id="city"
          label="المدينة"
          required
          options={[...CITY_OPTIONS]}
          value={property.city}
          error={fieldErrors.city}
          onChange={(v) => onPatch("city", v)}
        />
        <RegField
          id="district"
          label="الحي"
          required
          value={property.district}
          error={fieldErrors.district}
          onChange={(v) => onPatch("district", v)}
        />
        <RegSelect
          id="classification"
          label="التصنيف"
          required
          options={CLASSIFICATION_OPTIONS}
          value={property.classification}
          error={fieldErrors.classification}
          onChange={(v) => {
            onPatch("classification", v);
            onPatch("propertyType", "");
          }}
        />
        <RegSelect
          id="property_type"
          label="نوع العقار"
          required
          options={propertyTypes}
          value={property.classification ? property.propertyType : ""}
          error={fieldErrors.propertyType}
          disabled={!property.classification}
          placeholder={
            property.classification
              ? "اختر نوع العقار..."
              : "اختر التصنيف أولاً"
          }
          onChange={(v) => onPatch("propertyType", v)}
        />
        <RegField
          id="area"
          label="المساحة"
          value={property.area}
          onChange={(v) => onPatch("area", v)}
        />
        <RegSelect
          id="deed_status"
          label="حالة الصك"
          options={[...DEED_STATUS_OPTIONS]}
          value={property.deedStatus}
          onChange={(v) => onPatch("deedStatus", v)}
        />
      </div>

      <div className="reg-fg-full" style={{ marginTop: 12 }}>
        <span className="reg-fl">القيود على العقار</span>
        <div className="po-id-type-pills">
          {RESTRICTIONS_PRESENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`reg-type-pill${property.restrictionsPresent === opt.value ? " sel" : ""}`}
              onClick={() => onPatch("restrictionsPresent", opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="reg-fg-full" style={{ marginTop: 12 }}>
        <span className="reg-fl">توفر الحدود</span>
        <div className="po-id-type-pills">
          {BOUNDARIES_AVAILABILITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`reg-type-pill${property.boundariesAvailability === opt.value ? " sel" : ""}`}
              onClick={() => onPatch("boundariesAvailability", opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {property.boundariesAvailability === "doc" ? (
          <RegField
            id="boundaries_external"
            label="اسم المستند الخارجي"
            required
            value={property.boundariesExternalDocName}
            error={fieldErrors.boundariesExternalDocName}
            onChange={(v) => onPatch("boundariesExternalDocName", v)}
          />
        ) : null}
      </div>
    </>
  );
}
