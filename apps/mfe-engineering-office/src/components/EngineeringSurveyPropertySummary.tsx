"use client";

import type { PoPropertyIntake } from "@case-study/mfe";
import { formatPropertyDeedDisplay } from "@case-study/mfe";
import { RegistrationFormCard } from "@platform/app-shared/registration/RegistrationFormCard";

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="eng-office-info-cell">
      <div className="eng-office-info-lbl">{label}</div>
      <div className="eng-office-info-val">{value || "—"}</div>
    </div>
  );
}

export function EngineeringSurveyPropertySummary({
  property,
}: {
  property: PoPropertyIntake | undefined;
}) {
  if (!property) {
    return (
      <RegistrationFormCard title="بيانات العقار">
        <p className="po-properties-hint">جاري تحميل بيانات الصك…</p>
      </RegistrationFormCard>
    );
  }

  const deedLabel = formatPropertyDeedDisplay(property);

  return (
    <>
      <RegistrationFormCard title="بيانات الصك">
        <div className="eng-office-info-grid">
          <InfoCell label="رقم الصك" value={deedLabel} />
          <InfoCell label="تاريخ الصك" value={property.deedDate || "—"} />
          <InfoCell label="حالة الصك" value={property.deedStatus || "—"} />
          <InfoCell label="اسم المالك" value={property.ownerName || "—"} />
          <InfoCell
            label="القيود على العقار"
            value={property.restrictionsPresent?.trim() || "لا توجد قيود"}
          />
        </div>
      </RegistrationFormCard>

      <RegistrationFormCard title="بيانات الموقع">
        <div className="eng-office-info-grid">
          <InfoCell label="المدينة" value={property.city} />
          <InfoCell label="الحي" value={property.district} />
          <InfoCell
            label="المحكمة / الدائرة"
            value={
              [property.court, property.circuit].filter(Boolean).join(" - ") ||
              "—"
            }
          />
          <InfoCell
            label="توفر الحدود"
            value={property.boundariesAvailability || "—"}
          />
        </div>
      </RegistrationFormCard>

      <RegistrationFormCard title="البيانات المساحية">
        <div className="eng-office-info-grid">
          <InfoCell label="التصنيف" value={property.classification || "—"} />
          <InfoCell label="النوع / الاستخدام" value={property.propertyType || "—"} />
          <InfoCell
            label="المساحة الإجمالية"
            value={property.area ? `${property.area} م²` : "—"}
          />
          <InfoCell label="رقم المهمة" value={property.taskNumber || "—"} />
        </div>
      </RegistrationFormCard>
    </>
  );
}
