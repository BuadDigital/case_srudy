"use client";

import {
  boundariesAvailabilityLabel,
  formatPropertyDeedDisplay,
  formatPropertyLocation,
  formatPropertyTypeLine,
  hasBourseDetailFields,
  restrictionsPresentLabel,
  showsCourtFields,
  skipsBourseForIdentifier,
  type PoIntakeRecord,
  type PoPropertyIntake,
} from "../../lib/prototype/po-intake-data";
import { isValidContactEntry } from "./po-property-validation";
import { AssignmentDocAttachment } from "./AssignmentDocAttachment";
import { PoPropertyDetailTabs } from "./PoPropertyDetailTabs";

export function PoDetailPropertyCard({
  index,
  property,
  poNumber,
  assignmentType,
  showDecree,
  layout = "compact",
  record,
}: {
  index: number;
  property: PoPropertyIntake;
  poNumber: string;
  assignmentType: PoIntakeRecord["assignmentType"];
  showDecree: boolean;
  layout?: "compact" | "page";
  /** Required for page layout (tabs + timeline). */
  record?: PoIntakeRecord;
}) {
  const contactCount = property.contacts.filter((c) =>
    isValidContactEntry(c),
  ).length;
  const boursePending = !property.bourseDataCompleted;
  const needsBourse = !skipsBourseForIdentifier(property.identifierType);
  const location = formatPropertyLocation(property);
  const typeLine = formatPropertyTypeLine(property);
  const deedDisplay = formatPropertyDeedDisplay(property);

  if (layout === "page") {
    if (!record) return null;
    return (
      <PoPropertyDetailTabs
        record={record}
        property={property}
        showDecree={showDecree}
      />
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
