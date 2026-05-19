"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BOUNDARIES_MATCH_OPTIONS,
  CITY_OPTIONS,
  CLASSIFICATION_OPTIONS,
  classificationRequiresSurvey,
  DEED_STATUS_OPTIONS,
  PROPERTY_CLASSIFICATIONS,
  RESTRICTIONS_OPTIONS,
  requiresAssignmentDecree,
  type AssignmentType,
  type PoPropertyIntake,
} from "@/lib/prototype/po-intake-data";
import {
  circuitsForCourt,
  courtsForCity,
  loadCourtsCatalog,
  type CourtCatalogEntry,
} from "@/lib/prototype/courts-storage";
import { findPriorDeedRegistration } from "@/lib/prototype/po-intake-storage";
import { RegField, RegSelect } from "@/components/prototype/registration/FormFields";
import type { FieldErrors } from "@/components/prototype/registration/registration-utils";
import { PoContactEditor } from "./PoContactEditor";

export function PoPropertyForm({
  property,
  assignmentType,
  fieldErrors,
  onPatch,
  excludePoNumber,
}: {
  property: PoPropertyIntake;
  assignmentType: AssignmentType;
  fieldErrors: FieldErrors;
  onPatch: <K extends keyof PoPropertyIntake>(
    key: K,
    value: PoPropertyIntake[K],
  ) => void;
  excludePoNumber?: string;
}) {
  const [courts, setCourts] = useState<CourtCatalogEntry[]>([]);
  const [priorDeed, setPriorDeed] = useState<{ poNumber: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadCourtsCatalog().then((list) => {
      if (!cancelled) setCourts(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const deed = property.deedNumber.trim();
    if (!deed) {
      setPriorDeed(null);
      return;
    }
    let cancelled = false;
    void findPriorDeedRegistration(deed, excludePoNumber).then((hit) => {
      if (!cancelled) setPriorDeed(hit);
    });
    return () => {
      cancelled = true;
    };
  }, [property.deedNumber, excludePoNumber]);

  const showAssignmentDecree = requiresAssignmentDecree(assignmentType);

  const propertyTypes = useMemo(() => {
    const c = property.classification;
    return c ? (PROPERTY_CLASSIFICATIONS[c] ?? []) : [];
  }, [property.classification]);

  const surveyRequired = classificationRequiresSurvey(property.classification);
  const courtNames = useMemo(
    () => courtsForCity(courts, property.city).map((c) => c.court),
    [courts, property.city],
  );
  const circuitOptions = useMemo(
    () => circuitsForCourt(courts, property.city, property.court),
    [courts, property.city, property.court],
  );

  function handleCityChange(city: string) {
    onPatch("city", city);
    onPatch("court", "");
    onPatch("circuit", "");
  }

  function handleCourtChange(court: string) {
    onPatch("court", court);
    onPatch("circuit", "");
  }

  return (
    <>
      <div className="reg-fg-full" style={{ marginBottom: 12 }}>
        <span className="reg-fl">نوع المعرّف</span>
        <div className="po-id-type-pills">
          <button
            type="button"
            className={`reg-type-pill${property.identifierType === "deed" ? " sel" : ""}`}
            onClick={() => onPatch("identifierType", "deed")}
          >
            رقم صك
          </button>
          <button
            type="button"
            className={`reg-type-pill${property.identifierType === "real_estate_reg" ? " sel" : ""}`}
            onClick={() => onPatch("identifierType", "real_estate_reg")}
          >
            تسجيل عيني
          </button>
        </div>
      </div>

      {property.identifierType === "real_estate_reg" ? (
        <div className="note note-warn" style={{ marginBottom: 12 }}>
          لا يمكن الاستعلام من بورصة العقارات — يطلب الأخصائي السجل العقاري من
          أطراف التنفيذ ويرفعه كمرفق.
        </div>
      ) : (
        <div className="note note-info" style={{ marginBottom: 12 }}>
          رقم الصك وتاريخه من إنفاذ — يستعلم الأخصائي يدوياً من بورصة العقارات
          خارج النظام ثم يُدخل النتائج هنا.
        </div>
      )}

      {priorDeed ? (
        <div className="note note-success" style={{ marginBottom: 12 }}>
          هذا الصك مسجّل سابقاً في أمر العمل «{priorDeed.poNumber}» — الرفع
          المساحي غير مطلوب إن سبق إنجازه (§4).
        </div>
      ) : null}

      {property.classification && !surveyRequired ? (
        <div className="note note-info" style={{ marginBottom: 12 }}>
          تصنيف «وحدة داخل مبنى» — الرفع المساحي غير مطلوب (§4).
        </div>
      ) : null}

      <div className="reg-fg2">
        <RegField
          id="deed_number"
          label={
            property.identifierType === "deed" ? "رقم الصك" : "رقم التسجيل العيني"
          }
          required
          dir="ltr"
          value={property.deedNumber}
          error={fieldErrors.deedNumber}
          onChange={(v) => onPatch("deedNumber", v)}
        />
        <RegField
          id="deed_date"
          label="تاريخ الصك"
          type="date"
          value={property.deedDate}
          onChange={(v) => onPatch("deedDate", v)}
        />
        <RegField
          id="owner_name"
          label="اسم المالك"
          value={property.ownerName}
          onChange={(v) => onPatch("ownerName", v)}
        />
        <RegSelect
          id="restrictions"
          label="القيود على العقار"
          options={[...RESTRICTIONS_OPTIONS]}
          value={property.restrictions}
          onChange={(v) => onPatch("restrictions", v)}
        />
        <RegSelect
          id="boundaries_match"
          label="مطابقة الحدود (بورصة)"
          options={[...BOUNDARIES_MATCH_OPTIONS]}
          value={property.boundariesMatch}
          onChange={(v) => onPatch("boundariesMatch", v)}
        />
        <RegSelect
          id="city"
          label="المدينة"
          required
          options={[...CITY_OPTIONS]}
          value={property.city}
          error={fieldErrors.city}
          onChange={handleCityChange}
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
          id="deed_status"
          label="حالة الصك"
          options={[...DEED_STATUS_OPTIONS]}
          value={property.deedStatus}
          onChange={(v) => onPatch("deedStatus", v)}
        />
        <RegField
          id="area"
          label="المساحة"
          value={property.area}
          onChange={(v) => onPatch("area", v)}
        />
        <RegField
          id="boundaries"
          label="الحدود"
          value={property.boundaries}
          onChange={(v) => onPatch("boundaries", v)}
        />
        <RegSelect
          id="classification"
          label="التصنيف"
          required
          options={CLASSIFICATION_OPTIONS}
          value={property.classification}
          error={fieldErrors.classification}
          onChange={(v) => onPatch("classification", v)}
        />
        <RegSelect
          id="property_type"
          label="نوع العقار"
          required
          options={propertyTypes}
          value={property.propertyType}
          error={fieldErrors.propertyType}
          onChange={(v) => onPatch("propertyType", v)}
        />
        {property.city && courtNames.length > 0 ? (
          <>
            <RegSelect
              id="court"
              label="المحكمة"
              options={courtNames}
              value={property.court}
              onChange={handleCourtChange}
            />
            <RegSelect
              id="circuit"
              label="الدائرة"
              options={circuitOptions}
              value={property.circuit}
              onChange={(v) => onPatch("circuit", v)}
            />
          </>
        ) : (
          <>
            <RegField
              id="court"
              label="المحكمة"
              value={property.court}
              onChange={(v) => onPatch("court", v)}
            />
            <RegField
              id="circuit"
              label="الدائرة"
              value={property.circuit}
              onChange={(v) => onPatch("circuit", v)}
            />
          </>
        )}
      </div>
      {property.city && courtNames.length === 0 ? (
        <p className="reg-field-hint" style={{ marginTop: 4 }}>
          لا توجد محاكم لهذه المدينة في القائمة — أضفها من شاشة «المحاكم والدوائر»
          أو أدخل نصاً حراً.
        </p>
      ) : null}

      {showAssignmentDecree ? (
        <div className="reg-fg-full" style={{ marginTop: 8 }}>
          <label className="reg-fl" htmlFor="assignment_doc">
            قرار الإسناد (مرفق) *
          </label>
          <input
            id="assignment_doc"
            type="file"
            className="reg-fi"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              const file = e.target.files?.[0];
              onPatch("assignmentDocFileName", file?.name ?? "");
            }}
          />
          {property.assignmentDocFileName ? (
            <p className="reg-field-hint">
              الملف المحدد: {property.assignmentDocFileName}
            </p>
          ) : fieldErrors.assignmentDocFileName ? (
            <p className="reg-field-error" role="alert">
              {fieldErrors.assignmentDocFileName}
            </p>
          ) : (
            <p className="reg-field-hint">مطلوب لمسار التنفيذ — metadata فقط</p>
          )}
        </div>
      ) : null}

      {property.identifierType === "real_estate_reg" ? (
        <div className="reg-fg-full" style={{ marginTop: 8 }}>
          <label className="reg-fl" htmlFor="real_estate_reg_doc">
            السجل العقاري (مرفق) *
          </label>
          <input
            id="real_estate_reg_doc"
            type="file"
            className="reg-fi"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              const file = e.target.files?.[0];
              onPatch("realEstateRegFileName", file?.name ?? "");
            }}
          />
          {property.realEstateRegFileName ? (
            <p className="reg-field-hint">
              الملف المحدد: {property.realEstateRegFileName}
            </p>
          ) : fieldErrors.realEstateRegFileName ? (
            <p className="reg-field-error" role="alert">
              {fieldErrors.realEstateRegFileName}
            </p>
          ) : null}
        </div>
      ) : null}

      <div style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
          ضابط الاتصال
        </h3>
        {fieldErrors._contacts ? (
          <div className="note note-warn" style={{ marginBottom: 12 }}>
            {fieldErrors._contacts}
          </div>
        ) : null}
        <PoContactEditor
          contacts={property.contacts}
          errors={fieldErrors}
          onChange={(contacts) => onPatch("contacts", contacts)}
        />
      </div>
    </>
  );
}
