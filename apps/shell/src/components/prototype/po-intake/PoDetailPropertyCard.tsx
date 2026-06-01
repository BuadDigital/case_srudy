"use client";

import type { ReactNode } from "react";
import {
  boundariesAvailabilityLabel,
  formatPropertyDeedDisplay,
  formatPropertyLocation,
  formatPropertyTypeLine,
  hasBourseDetailFields,
  identifierTypeLabel,
  isBourseInquiryIdentifier,
  restrictionsPresentLabel,
  showsCourtFields,
  skipsBourseForIdentifier,
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
  badge,
}: {
  title: string;
  children: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <section className="po-property-detail-section">
      <div className="po-property-detail-section-hd">
        <h2 className="po-property-detail-section-title">{title}</h2>
        {badge}
      </div>
      <div className="po-property-detail-fields">{children}</div>
    </section>
  );
}

function BourseDetailFields({ property }: { property: PoPropertyIntake }) {
  const location = formatPropertyLocation(property);
  const typeLine = formatPropertyTypeLine(property);
  const restrictionsLabel = restrictionsPresentLabel(property.restrictionsPresent);
  const boundariesLabel = boundariesAvailabilityLabel(
    property.boundariesAvailability,
  );

  return (
    <>
      <DetailField label="الموقع" value={location} />
      <DetailField label="المدينة" value={property.city} />
      <DetailField label="الحي" value={property.district} />
      <DetailField label="التصنيف / النوع" value={typeLine} />
      <DetailField label="المساحة" value={property.area} ltr />
      <DetailField label="حالة الصك" value={property.deedStatus} />
      <DetailField label="القيود على العقار" value={restrictionsLabel} />
      {property.restrictionsPresent === "yes" ? (
        <DetailField label="تفاصيل القيود" value={property.restrictions} />
      ) : null}
      <DetailField label="توفر الحدود" value={boundariesLabel} />
      {property.boundariesAvailability === "doc" ? (
        <DetailField
          label="المستند الخارجي للحدود"
          value={property.boundariesExternalDocName}
        />
      ) : null}
      <DetailField label="وصف الحدود" value={property.boundaries} />
      {!isBourseInquiryIdentifier(property.identifierType) ? (
        <DetailField
          label="مطابقة الحدود"
          value={property.boundariesMatch}
        />
      ) : null}
    </>
  );
}

function DeedOwnerFields({
  property,
  assignmentType,
}: {
  property: PoPropertyIntake;
  assignmentType: PoIntakeRecord["assignmentType"];
}) {
  const isBourseId = isBourseInquiryIdentifier(property.identifierType);
  const deedDisplay = formatPropertyDeedDisplay(property);

  return (
    <>
      <DetailField
        label="مصدر البيانات"
        value={identifierTypeLabel(property.identifierType)}
      />
      <DetailField
        label="رقم الصك"
        value={property.deedNumber.trim() || deedDisplay}
        ltr
      />
      <DetailField label="رقم المهمة" value={property.taskNumber} ltr />
      <DetailField label="تاريخ الصك" value={property.deedDate} ltr />
      <DetailField label="اسم المالك" value={property.ownerName} />
      {!isBourseId ? (
        <>
          <DetailField label="حالة الصك" value={property.deedStatus} />
          <DetailField label="القيود" value={property.restrictions} />
          <DetailField
            label="مطابقة الحدود"
            value={property.boundariesMatch}
          />
        </>
      ) : (
        <DetailField label="حالة المسار" value={deedDisplay} />
      )}
      {showsCourtFields(assignmentType) ? (
        <DetailField
          label="المحكمة / الدائرة"
          value={[property.court, property.circuit].filter(Boolean).join(" · ")}
        />
      ) : null}
    </>
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
  const needsBourse = !skipsBourseForIdentifier(property.identifierType);
  const showBourseSection =
    needsBourse &&
    (boursePending || hasBourseDetailFields(property) || property.bourseDataCompleted);
  const location = formatPropertyLocation(property);
  const typeLine = formatPropertyTypeLine(property);
  const validContacts = property.contacts.filter((c) => isValidContactEntry(c));
  const hasRegFile = Boolean(property.realEstateRegFileName?.trim());
  const showAside = showDecree || hasRegFile;
  const deedDisplay = formatPropertyDeedDisplay(property);

  if (layout === "page") {
    return (
      <div
        className={`po-property-detail-body${showAside ? "" : " po-property-detail-body--solo"}`}
      >
        <div className="po-property-detail-main">
          <DetailSection title="بيانات الصك والمالك">
            <DeedOwnerFields
              property={property}
              assignmentType={assignmentType}
            />
          </DetailSection>

          {showBourseSection ? (
            <DetailSection
              title="بيانات البورصة"
              badge={
                boursePending ? (
                  <span className="badge b-prog">بانتظار الإكمال</span>
                ) : (
                  <span className="badge b-done">مكتملة</span>
                )
              }
            >
              {boursePending && !hasBourseDetailFields(property) ? (
                <p className="po-property-detail-empty-contacts">
                  لم تُسجَّل بعد بيانات استعلام البورصة — أكملها من قائمة
                  استعلام بورصة.
                </p>
              ) : (
                <BourseDetailFields property={property} />
              )}
            </DetailSection>
          ) : null}

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
          {needsBourse && boursePending ? (
            <span className="badge b-prog">بانتظار البورصة</span>
          ) : null}
          {needsBourse && !boursePending ? (
            <span className="badge b-done">بورصة مكتملة</span>
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
          <span className="po-detail-meta-val">{typeLine || "—"}</span>
        </div>
        {hasBourseDetailFields(property) ? (
          <>
            <div className="po-detail-meta-item">
              <span className="po-detail-meta-lbl">المساحة</span>
              <span className="po-detail-meta-val">{property.area || "—"}</span>
            </div>
            <div className="po-detail-meta-item">
              <span className="po-detail-meta-lbl">القيود</span>
              <span className="po-detail-meta-val">
                {restrictionsPresentLabel(property.restrictionsPresent) || "—"}
              </span>
            </div>
            <div className="po-detail-meta-item">
              <span className="po-detail-meta-lbl">توفر الحدود</span>
              <span className="po-detail-meta-val">
                {boundariesAvailabilityLabel(property.boundariesAvailability) ||
                  "—"}
              </span>
            </div>
          </>
        ) : null}
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
