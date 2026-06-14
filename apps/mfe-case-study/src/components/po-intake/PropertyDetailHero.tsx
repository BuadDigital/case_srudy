"use client";

import { PoNumber } from "../ui/PoNumber";
import {
  formatDateAr,
  formatPropertyLocation,
  formatPropertyTypeLine,
  identifierTypeLabel,
  showsCourtFields,
  type PoIntakeRecord,
  type PoPropertyIntake,
} from "../../lib/prototype/po-intake-data";

function deedTitle(property: { deedNumber: string }): string {
  return property.deedNumber.trim() || "—";
}

function isDueSoon(iso: string): boolean {
  if (!iso) return false;
  const due = new Date(iso.slice(0, 10));
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

function BuildingIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
    </svg>
  );
}

export function PropertyDetailHero({
  record,
  property,
  propertyIndex,
}: {
  record: PoIntakeRecord;
  property: PoPropertyIntake;
  /** 1-based index in PO properties list */
  propertyIndex: number;
}) {
  const titleDeed = deedTitle(property);
  const locationLine = formatPropertyLocation(property);
  const typeLine = formatPropertyTypeLine(property);
  const courtLine = [property.court, property.circuit]
    .filter(Boolean)
    .join(" · ");
  const dueUrgent = record.dueDateAt ? isDueSoon(record.dueDateAt) : false;

  return (
    <header className="pd-hero">
      <div className="pd-hero-row1">
        <div className="pd-hero-left">
          <div className="pd-prop-eyebrow">
            <BuildingIcon />
            عقار {propertyIndex} من {record.properties.length} في{" "}
            <PoNumber value={record.poNumber} />
          </div>
          <div className="pd-prop-title">
            <span>
              صك رقم{" "}
              <bdi dir="ltr" className="po-property-detail-ltr-val">
                {titleDeed}
              </bdi>
            </span>
            <span className="pd-badge pd-badge-teal">
              {identifierTypeLabel(property.identifierType)}
            </span>
            <span className="pd-badge pd-badge-amber">
              {record.assignmentType}
            </span>
          </div>
        </div>
        <div className="pd-hero-right">
          <div className="pd-mission-block">
            <div className="pd-mission-label">رقم المهمة</div>
            <div className="pd-mission-num">
              <bdi dir="ltr" className="po-property-detail-ltr-val">
                {property.taskNumber.trim() || "—"}
              </bdi>
            </div>
          </div>
        </div>
      </div>

      <div className="pd-meta-strip" aria-label="ملخص العقار">
        <div className="pd-meta-item">
          <div className="pd-meta-label">اسم المالك</div>
          <div className="pd-meta-val">{property.ownerName.trim() || "—"}</div>
        </div>
        <div className="pd-meta-item">
          <div className="pd-meta-label">المدينة / الحي</div>
          <div className="pd-meta-val">{locationLine || "—"}</div>
        </div>
        <div className="pd-meta-item">
          <div className="pd-meta-label">التصنيف</div>
          <div className="pd-meta-val">{typeLine || "—"}</div>
        </div>
        <div className="pd-meta-item">
          <div className="pd-meta-label">المساحة</div>
          <div className="pd-meta-val">
            {property.area.trim() ? `${property.area.trim()} م²` : "—"}
          </div>
        </div>
        {showsCourtFields(record.assignmentType) ? (
          <div className="pd-meta-item">
            <div className="pd-meta-label">المحكمة / الدائرة</div>
            <div className="pd-meta-val">{courtLine || "—"}</div>
          </div>
        ) : null}
        <div className="pd-meta-item">
          <div className="pd-meta-label">تاريخ الاستحقاق</div>
          <div
            className={`pd-meta-val${dueUrgent ? " pd-meta-val--urgent" : ""}`}
          >
            {record.dueDateAt ? (
              <bdi dir="ltr" className="po-property-detail-ltr-val">
                {formatDateAr(record.dueDateAt)}
              </bdi>
            ) : (
              "—"
            )}
          </div>
        </div>
        <div className="pd-meta-item">
          <div className="pd-meta-label">استلام إنفاذ</div>
          <div className="pd-meta-val">
            {record.receivedFromEnfathAt ? (
              <bdi dir="ltr" className="po-property-detail-ltr-val">
                {formatDateAr(record.receivedFromEnfathAt)}
              </bdi>
            ) : (
              "—"
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
