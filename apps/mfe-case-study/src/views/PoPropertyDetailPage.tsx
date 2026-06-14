"use client";

import Link from "next/link";
import { PoDetailPropertyCard } from "@case-study/mfe/components/po-intake/PoDetailPropertyCard";
import { PropertyDetailHero } from "@case-study/mfe/components/po-intake/PropertyDetailHero";
import {
  requiresAssignmentDecree,
} from "../lib/prototype/po-intake-data";
import { poListPath, poPropertiesPath } from "../lib/po-routes";
import { usePoRecordQuery } from "@case-study/mfe/query/case-study-queries";

export function PoPropertyDetailPage({
  poNumber,
  propertyId,
}: {
  poNumber: string;
  propertyId: string;
}) {
  const { data: record, isPending } = usePoRecordQuery(poNumber);
  const property =
    record?.properties.find((p) => p.id === propertyId) ?? null;
  const index =
    record && property
      ? record.properties.findIndex((p) => p.id === propertyId)
      : -1;

  if (isPending && !record) {
    return (
      <div className="po-property-detail-page pd-page">
        <p className="po-properties-loading">جاري التحميل…</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="po-property-detail-page pd-page">
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

  const showDecree = requiresAssignmentDecree(record.assignmentType);

  if (!property || index < 0) {
    return (
      <div className="po-property-detail-page pd-page">
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

  return (
    <div className="po-property-detail-page pd-page">
      <article className="po-property-detail-shell">
        <PropertyDetailHero
          record={record}
          property={property}
          propertyIndex={index + 1}
        />

        <PoDetailPropertyCard
          layout="page"
          index={index + 1}
          property={property}
          poNumber={record.poNumber}
          assignmentType={record.assignmentType}
          showDecree={showDecree}
          record={record}
        />
      </article>
    </div>
  );
}
