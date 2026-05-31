"use client";

import type { ReactNode } from "react";
import {
  formatPropertyDeedDisplay,
  identifierTypeLabel,
  isBourseInquiryIdentifier,
  showsCourtFields,
  type PoIntakeRecord,
  type PoPropertyIntake,
} from "@/lib/prototype/po-intake-data";
import { isValidContactEntry } from "./po-property-validation";
import { AssignmentDocAttachment } from "./AssignmentDocAttachment";

function DetailField({
  label,
  value,
  ltr,
}: {
  label: string;
  value: string;
  ltr?: boolean;
}) {
  if (!value || value === "—") return null;
  return (
    <div className="po-property-detail-field">
      <span className="po-property-detail-field-lbl">{label}</span>
      <span className="po-property-detail-field-val">
        {ltr ? (
          <bdi dir="ltr" className="po-property-detail-ltr-val">
            {value}
          </bdi>
        ) : (
          value
        )}
      </span>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="po-property-detail-section">
      <h2 className="po-property-detail-section-title">{title}</h2>
      <div className="po-property-detail-fields">{children}</div>
    </section>
  );
}

export function PoDetailPropertyCard({
  index,
  property,
  poNumber,
  assignmentType,
  showDecree,
  layout = "compact",
}: {
  index: number;
  property: PoPropertyIntake;
  poNumber: string;
  assignmentType: PoIntakeRecord["assignmentType"];
  showDecree: boolean;
  layout?: "compact" | "page";
}) {
  const contactCount = property.contacts.filter((c) =>
    isValidContactEntry(c),
  ).length;
  const boursePending = !property.bourseDataCompleted;
  const typeLabel = property.propertyType || property.classification || "—";
  const location = boursePending
    ? "بانتظار البورصة"
    : [property.city, property.district].filter(Boolean).join(" · ");
  const typeDisplay = property.classification
    ? `${property.classification} · ${typeLabel}`
    : typeLabel;
  const validContacts = property.contacts.filter((c) => isValidContactEntry(c));
  const hasRegFile = Boolean(property.realEstateRegFileName?.trim());
  const showAside = showDecree || hasRegFile;
  const isBourseId = isBourseInquiryIdentifier(property.identifierType);
  const deedDisplay = formatPropertyDeedDisplay(property);

  if (layout === "page") {
    return (
      <div
        className={`po-property-detail-body${showAside ? "" : " po-property-detail-body--solo"}`}
      >
        <div className="po-property-detail-main">
          <DetailSection title={isBourseId ? "مسار الاستعلام" : "بيانات الصك والمالك"}>
            <DetailField
              label="نوع المعرف"
              value={identifierTypeLabel(property.identifierType)}
            />
            {!isBourseId ? (
              <>
                <DetailField label="رقم الصك" value={property.deedNumber} ltr />
                <DetailField label="رقم المهمة" value={property.taskNumber} ltr />
                <DetailField label="تاريخ الصك" value={property.deedDate} ltr />
                <DetailField label="اسم المالك" value={property.ownerName} />
                <DetailField label="حالة الصك" value={property.deedStatus} />
                <DetailField label="القيود" value={property.restrictions} />
                <DetailField
                  label="مطابقة الحدود"
                  value={property.boundariesMatch}
                />
              </>
            ) : (
              <DetailField label="الحالة" value={deedDisplay} />
            )}
          </DetailSection>

          <DetailSection title="الموقع والعقار">
            <DetailField label="الموقع" value={location || "—"} />
            <DetailField label="التصنيف / النوع" value={typeDisplay} />
            <DetailField label="المساحة" value={property.area} />
            <DetailField label="وصف الحدود" value={property.boundaries} />
            {showsCourtFields(assignmentType) ? (
              <DetailField
                label="المحكمة / الدائرة"
                value={[property.court, property.circuit]
                  .filter(Boolean)
                  .join(" · ")}
              />
            ) : null}
          </DetailSection>

          <DetailSection title="ضباط الاتصال">
            {validContacts.length === 0 ? (
              <p className="po-property-detail-empty-contacts">
                لا يوجد ضابط اتصال مسجّل.
              </p>
            ) : (
              <ul className="po-property-detail-contacts">
                {validContacts.map((c, i) => (
                  <li key={i} className="po-property-detail-contact">
                    <span className="po-property-detail-contact-name">
                      {c.name}
                      {c.role ? (
                        <span className="po-property-detail-contact-role">
                          {" "}
                          — {c.role}
                        </span>
                      ) : null}
                    </span>
                    <span className="po-property-detail-contact-phone">
                      <bdi dir="ltr" className="po-property-detail-ltr-val">
                        {c.phone}
                      </bdi>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DetailSection>
        </div>

        {showAside ? (
          <aside className="po-property-detail-aside" aria-label="المرفقات">
            {showDecree ? (
              <div className="po-property-detail-attach-block">
                <h2 className="po-property-detail-section-title">
                  قرار الإسناد
                </h2>
                <AssignmentDocAttachment
                  poNumber={poNumber}
                  propertyId={property.id}
                  fileName={property.assignmentDocFileName}
                  variant="panel"
                />
              </div>
            ) : null}
            {hasRegFile ? (
              <div className="po-property-detail-attach-block">
                <h2 className="po-property-detail-section-title">
                  ملف السجل العقاري
                </h2>
                <p className="po-property-detail-reg-name">
                  <bdi dir="ltr" className="po-property-detail-ltr-val">
                    {property.realEstateRegFileName}
                  </bdi>
                </p>
                <p className="po-attach-note">
                  اسم الملف محفوظ في النظام — المعاينة متوفرة عند الرفع من نفس
                  المتصفح.
                </p>
              </div>
            ) : null}
          </aside>
        ) : null}
      </div>
    );
  }

  return (
    <article className="po-detail-property-card">
      <header className="po-detail-property-hd">
        <div className="po-detail-property-hd-main">
          <span className="po-detail-property-num">عقار {index}</span>
          <span className="po-detail-property-deed" dir="ltr">
            {deedDisplay}
          </span>
          {boursePending ? (
            <span className="badge b-prog">بانتظار البورصة</span>
          ) : null}
        </div>
        {property.deedStatus ? (
          <span className="badge b-prog">{property.deedStatus}</span>
        ) : null}
      </header>

      <div className="po-detail-property-meta">
        <div className="po-detail-meta-item">
          <span className="po-detail-meta-lbl">الموقع</span>
          <span className="po-detail-meta-val">{location || "—"}</span>
        </div>
        <div className="po-detail-meta-item">
          <span className="po-detail-meta-lbl">التصنيف / النوع</span>
          <span className="po-detail-meta-val">
            {property.classification
              ? `${property.classification} · ${typeLabel}`
              : typeLabel}
          </span>
        </div>
        <div className="po-detail-meta-item">
          <span className="po-detail-meta-lbl">ضباط اتصال</span>
          <span className="po-detail-meta-val">
            {contactCount} {contactCount === 1 ? "ضابط" : "ضباط"}
          </span>
        </div>
        {showsCourtFields(assignmentType) &&
          (property.court || property.circuit) && (
            <div className="po-detail-meta-item">
              <span className="po-detail-meta-lbl">المحكمة / الدائرة</span>
              <span className="po-detail-meta-val">
                {[property.court, property.circuit].filter(Boolean).join(" · ")}
              </span>
            </div>
          )}
      </div>

      {showDecree ? (
        <div className="po-detail-property-attach">
          <span className="po-detail-meta-lbl">مرفق قرار الإسناد</span>
          <AssignmentDocAttachment
            poNumber={poNumber}
            propertyId={property.id}
            fileName={property.assignmentDocFileName}
            variant="card"
          />
        </div>
      ) : null}
    </article>
  );
}
