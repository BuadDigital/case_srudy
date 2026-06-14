"use client";

import {
  FIELD_INSPECTION_ACCESS_OPTIONS,
  FIELD_INSPECTION_CONDITION_OPTIONS,
  FIELD_INSPECTION_MARKET_ACTIVITY_OPTIONS,
  FIELD_INSPECTION_PHOTO_SLOTS,
  FIELD_INSPECTION_PROPERTY_TYPE_OPTIONS,
  FIELD_INSPECTION_SIGNATORY_ROLE_OPTIONS,
  type FieldInspectionAccess,
  type FieldInspectionCondition,
  type FieldInspectionMarketActivity,
  type FieldInspectionPropertyType,
  type FieldInspectionRentalStatus,
  type FieldInspectionSignatoryRole,
  type FieldInspectionSubmission,
} from "../lib/prototype/field-inspection-data";
import type { FieldInspectionFieldErrors } from "../lib/prototype/field-inspection-validation";

export type FieldFormViewProps = {
  embedded?: boolean;
  value: FieldInspectionSubmission;
  onChange: (
    patch: Partial<
      Pick<
        FieldInspectionSubmission,
        | "propertyType"
        | "areaDistrict"
        | "actualAreaSqm"
        | "structuralCondition"
        | "hasMovableItems"
        | "isCurrentlyRented"
        | "accessDifficulty"
        | "avgPricePerSqm"
        | "marketActivityLevel"
        | "marketNotes"
        | "responsiblePersonName"
        | "responsiblePersonRole"
        | "signedDocumentPhotos"
        | "propertyPhotos"
        | "generalNotes"
      >
    >,
  ) => void;
  disabled?: boolean;
  fieldErrors?: FieldInspectionFieldErrors;
  saving?: boolean;
  onSaveDraft?: () => void;
  onSubmit?: () => void;
};

export function FieldFormView({
  embedded = false,
  value,
  onChange,
  disabled = false,
  fieldErrors = {},
  saving = false,
  onSaveDraft,
  onSubmit,
}: FieldFormViewProps) {
  const toggleSignedPhoto = (index: number) => {
    const next = [...value.signedDocumentPhotos];
    while (next.length < 3) next.push("");
    next[index] = next[index]?.trim()
      ? ""
      : `signed-doc-${index + 1}.jpg`;
    onChange({ signedDocumentPhotos: next });
  };

  const togglePropertyPhoto = (key: (typeof FIELD_INSPECTION_PHOTO_SLOTS)[number]["key"]) => {
    const current = value.propertyPhotos[key]?.trim() ?? "";
    onChange({
      propertyPhotos: {
        ...value.propertyPhotos,
        [key]: current ? "" : `${key}.jpg`,
      },
    });
  };

  return (
    <>
      {!embedded ? (
        <div className="note note-info">
          هذا النموذج مُحسَّن للموبايل — يفتحه المعاين في الميدان بجانب برنامج
          مقياس
        </div>
      ) : null}
      <div className="field-form">
        <div className="field-sec-title">١ — بيانات العقار الأساسية</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="ff-id">
              رقم العقار
            </label>
            <input
              id="ff-id"
              className="form-control"
              value={value.propertyDisplayId}
              readOnly
              style={{ background: "var(--surface3)" }}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="ff-type">
              نوع العقار
            </label>
            <select
              id="ff-type"
              className="form-control"
              value={value.propertyType}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  propertyType: e.target.value as FieldInspectionPropertyType | "",
                })
              }
            >
              <option value="">— اختر —</option>
              {FIELD_INSPECTION_PROPERTY_TYPE_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            {fieldErrors.propertyType ? (
              <p className="reg-field-error">{fieldErrors.propertyType}</p>
            ) : null}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="ff-area">
              المنطقة / الحي
            </label>
            <input
              id="ff-area"
              className="form-control"
              value={value.areaDistrict}
              disabled={disabled}
              placeholder="مثال: حي النزهة، مكة المكرمة"
              onChange={(e) => onChange({ areaDistrict: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="ff-sqm">
              المساحة الفعلية (م²)
            </label>
            <input
              id="ff-sqm"
              className="form-control"
              type="number"
              value={value.actualAreaSqm}
              disabled={disabled}
              placeholder="0.00"
              onChange={(e) => onChange({ actualAreaSqm: e.target.value })}
            />
          </div>
        </div>
      </div>
      <div className="field-form">
        <div className="field-sec-title">٢ — حالة العقار</div>
        <div className="form-group">
          <span className="form-label">الحالة الإنشائية</span>
          <div className="radio-group">
            {FIELD_INSPECTION_CONDITION_OPTIONS.map((o) => (
              <label key={o} className="radio-opt">
                <input
                  type="radio"
                  name="cond"
                  checked={value.structuralCondition === o}
                  disabled={disabled}
                  onChange={() =>
                    onChange({ structuralCondition: o as FieldInspectionCondition })
                  }
                />{" "}
                {o}
              </label>
            ))}
          </div>
        </div>
        <div className="form-group">
          <span className="form-label">هل يوجد منقولات داخل العقار؟</span>
          <div className="radio-group">
            <label className="radio-opt">
              <input
                type="radio"
                name="items"
                checked={value.hasMovableItems === true}
                disabled={disabled}
                onChange={() => onChange({ hasMovableItems: true })}
              />{" "}
              نعم
            </label>
            <label className="radio-opt">
              <input
                type="radio"
                name="items"
                checked={value.hasMovableItems === false}
                disabled={disabled}
                onChange={() => onChange({ hasMovableItems: false })}
              />{" "}
              لا
            </label>
          </div>
        </div>
        <div className="form-group">
          <span className="form-label">هل العقار مؤجر حالياً؟</span>
          <div className="radio-group">
            {(
              [
                ["yes", "نعم"],
                ["no", "لا"],
                ["unknown", "غير معروف"],
              ] as const
            ).map(([rentValue, label]) => (
              <label key={rentValue} className="radio-opt">
                <input
                  type="radio"
                  name="rent"
                  checked={value.isCurrentlyRented === rentValue}
                  disabled={disabled}
                  onChange={() =>
                    onChange({
                      isCurrentlyRented: rentValue as FieldInspectionRentalStatus,
                    })
                  }
                />{" "}
                {label}
              </label>
            ))}
          </div>
        </div>
        <div className="form-group">
          <span className="form-label">إمكانية الوصول للعقار</span>
          <div className="radio-group">
            {FIELD_INSPECTION_ACCESS_OPTIONS.map((o) => (
              <label key={o} className="radio-opt">
                <input
                  type="radio"
                  name="acc"
                  checked={value.accessDifficulty === o}
                  disabled={disabled}
                  onChange={() =>
                    onChange({ accessDifficulty: o as FieldInspectionAccess })
                  }
                />{" "}
                {o}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="field-form">
        <div className="field-sec-title">٣ — البيانات السوقية</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="ff-price">
              متوسط سعر م² في المنطقة
            </label>
            <input
              id="ff-price"
              className="form-control"
              type="number"
              value={value.avgPricePerSqm}
              disabled={disabled}
              placeholder="ريال / م²"
              onChange={(e) => onChange({ avgPricePerSqm: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="ff-market">
              مستوى نشاط السوق
            </label>
            <select
              id="ff-market"
              className="form-control"
              value={value.marketActivityLevel}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  marketActivityLevel: e.target
                    .value as FieldInspectionMarketActivity | "",
                })
              }
            >
              <option value="">— اختر —</option>
              {FIELD_INSPECTION_MARKET_ACTIVITY_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ff-mkt-note">
            ملاحظات سوقية إضافية
          </label>
          <textarea
            id="ff-mkt-note"
            className="form-control"
            rows={2}
            value={value.marketNotes}
            disabled={disabled}
            placeholder="أي معلومات إضافية عن السوق..."
            onChange={(e) => onChange({ marketNotes: e.target.value })}
          />
        </div>
      </div>
      <div className="field-form">
        <div className="field-sec-title">٤ — المستندات الموقعة</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="ff-sign-name">
              اسم الشخص المسؤول
            </label>
            <input
              id="ff-sign-name"
              className="form-control"
              value={value.responsiblePersonName}
              disabled={disabled}
              placeholder="الاسم الكامل"
              onChange={(e) =>
                onChange({ responsiblePersonName: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="ff-sign-title">
              صفته
            </label>
            <select
              id="ff-sign-title"
              className="form-control"
              value={value.responsiblePersonRole}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  responsiblePersonRole: e.target
                    .value as FieldInspectionSignatoryRole | "",
                })
              }
            >
              <option value="">— اختر —</option>
              {FIELD_INSPECTION_SIGNATORY_ROLE_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <span className="form-label">صور المستندات الموقعة</span>
          <div className="photo-grid">
            {value.signedDocumentPhotos.slice(0, 3).map((fileName, n) => (
              <button
                key={n}
                type="button"
                className={`photo-ph${fileName.trim() ? " has-photo" : ""}`}
                disabled={disabled}
                onClick={() => toggleSignedPhoto(n)}
              >
                📷
                <span>{fileName.trim() || "إضافة صورة"}</span>
              </button>
            ))}
            <button type="button" className="photo-ph" disabled={disabled}>
              +<span>المزيد</span>
            </button>
          </div>
        </div>
      </div>
      <div className="field-form">
        <div className="field-sec-title">٥ — صور العقار</div>
        <div className="photo-grid">
          {FIELD_INSPECTION_PHOTO_SLOTS.map(({ key, label }) => {
            const fileName = value.propertyPhotos[key]?.trim() ?? "";
            return (
              <button
                key={key}
                type="button"
                className={`photo-ph${fileName ? " has-photo" : ""}`}
                disabled={disabled}
                onClick={() => togglePropertyPhoto(key)}
              >
                📷<span>{fileName || label}</span>
              </button>
            );
          })}
        </div>
        <div className="form-group" style={{ marginTop: 12 }}>
          <label className="form-label" htmlFor="ff-gen">
            ملاحظات عامة
          </label>
          <textarea
            id="ff-gen"
            className="form-control"
            rows={2}
            value={value.generalNotes}
            disabled={disabled}
            placeholder="أي ملاحظات إضافية..."
            onChange={(e) => onChange({ generalNotes: e.target.value })}
          />
        </div>
      </div>
      {!embedded ? (
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={disabled || saving}
            onClick={onSubmit}
          >
            {saving ? "جاري الإرسال…" : "حفظ وإرسال"}
          </button>
          <button
            type="button"
            className="btn"
            disabled={disabled || saving}
            onClick={onSaveDraft}
          >
            حفظ مسودة
          </button>
        </div>
      ) : null}
    </>
  );
}
