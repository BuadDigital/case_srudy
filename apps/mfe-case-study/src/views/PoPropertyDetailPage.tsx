"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@platform/design-system";
import { PoNumber } from "@case-study/mfe/components/ui/PoNumber";
import { PoDetailPropertyCard } from "@case-study/mfe/components/po-intake/PoDetailPropertyCard";
import {
  assignmentTypeBadgeClass,
  formatDateAr,
  requiresAssignmentDecree,
} from "../lib/prototype/po-intake-data";
import { poPropertyToPropertyRow } from "../lib/prototype/po-intake-storage";
import { canEditProperty } from "../lib/prototype/po-roles";
import {
  poListPath,
  poPropertiesPath,
  poPropertyEditPath,
} from "../lib/po-routes";
import { usePoRecordQuery } from "@case-study/mfe/query/case-study-queries";
import { usePrototype } from "@platform/app-shared/contexts/PrototypeContext";
import type { PoPropertyIntake } from "../lib/prototype/po-intake-data";

function deedTitle(property: PoPropertyIntake): string {
  return property.deedNumber.trim() || "—";
}

function BackIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

export function PoPropertyDetailPage({
  poNumber,
  propertyId,
}: {
  poNumber: string;
  propertyId: string;
}) {
  const router = useRouter();
  const { role } = usePrototype();
  const showEdit = canEditProperty(role);
  const { data: record, isPending } = usePoRecordQuery(poNumber);

  if (isPending && !record) {
    return (
      <div className="po-property-detail-page">
        <p className="po-properties-loading">جاري التحميل…</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="po-property-detail-page">
        <div className="note note-warn">
          لم يُعثر على أمر العمل.
          <div className="po-properties-empty-actions">
            <Link href={poListPath()} className="btn btn-sm">
              رجوع لأوامر العمل
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const index = record.properties.findIndex((p) => p.id === propertyId);
  const property = index >= 0 ? record.properties[index] : null;
  const showDecree = requiresAssignmentDecree(record.assignmentType);

  if (!property) {
    return (
      <div className="po-property-detail-page">
        <div className="note note-warn">
          لم يُعثر على العقار.
          <div className="po-properties-empty-actions">
            <Link href={poPropertiesPath(poNumber)} className="btn btn-sm">
              رجوع لعقارات الأمر
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const priorByDeed = new Map<string, string>();
  const row = poPropertyToPropertyRow(record, property, priorByDeed);
  const titleDeed = deedTitle(property);

  return (
    <div className="po-property-detail-page">
      <article className="po-property-detail-shell">
        <header className="po-property-detail-hero">
          <div className="po-property-detail-hero-main">
            <Link href={poPropertiesPath(poNumber)} className="po-properties-back">
              <BackIcon />
              <span>
                عقارات <PoNumber value={record.poNumber} />
              </span>
            </Link>
            <h1 className="po-property-detail-title">
              <span className="po-property-detail-title-ar">تفاصيل الصك</span>
              <span className="po-property-detail-deed">
                <bdi dir="ltr" className="po-property-detail-ltr-val">
                  {titleDeed}
                </bdi>
              </span>
            </h1>
            <div className="po-property-detail-meta">
              <StatusBadge status={row.status} />
              <span className="po-properties-meta-sep" aria-hidden>
                ·
              </span>
              <span className="po-property-detail-meta-item">
                عقار {index + 1} من {record.properties.length}
              </span>
              <span className="po-properties-meta-sep" aria-hidden>
                ·
              </span>
              <span
                className={`badge ${assignmentTypeBadgeClass(record.assignmentType)}`}
              >
                {record.assignmentType}
              </span>
            </div>
          </div>
          <div className="po-properties-hero-stats" aria-label="ملخص أمر العمل">
            <div className="po-properties-stat">
              <span className="po-properties-stat-lbl">الأخصائي</span>
              <span
                className="po-properties-stat-val"
                title={record.assignmentSpecialist}
              >
                {record.assignmentSpecialist || "—"}
              </span>
            </div>
            <div className="po-properties-stat">
              <span className="po-properties-stat-lbl">تاريخ الاستحقاق</span>
              <span className="po-properties-stat-val po-properties-stat-val--due">
                {record.dueDateAt ? formatDateAr(record.dueDateAt) : "—"}
              </span>
            </div>
            <div className="po-properties-stat">
              <span className="po-properties-stat-lbl">استلام إنفاذ</span>
              <span className="po-properties-stat-val">
                {record.receivedFromEnfathAt
                  ? formatDateAr(record.receivedFromEnfathAt)
                  : "—"}
              </span>
            </div>
          </div>
          {showEdit ? (
            <button
              type="button"
              className="btn btn-sm po-properties-add"
              onClick={() =>
                router.push(poPropertyEditPath(poNumber, property.id))
              }
            >
              تعديل العقار
            </button>
          ) : null}
        </header>

        <PoDetailPropertyCard
          layout="page"
          index={index + 1}
          property={property}
          poNumber={record.poNumber}
          assignmentType={record.assignmentType}
          showDecree={showDecree}
        />
      </article>
    </div>
  );
}
