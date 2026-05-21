"use client";

import { requiresAssignmentDecree, type PoIntakeRecord } from "@/lib/prototype/po-intake-data";
import { PoDetailPropertyCard } from "./PoDetailPropertyCard";

export function PoPropertyDetailModal({
  record,
  propertyId,
  onCloseAction,
}: {
  record: PoIntakeRecord;
  propertyId: string;
  onCloseAction: () => void;
}) {
  const index = record.properties.findIndex((p) => p.id === propertyId);
  const property = index >= 0 ? record.properties[index] : null;
  const showDecree = requiresAssignmentDecree(record.assignmentType);

  if (!property) {
    return (
      <div
        className="po-preview-overlay"
        role="dialog"
        aria-modal="true"
        onClick={onCloseAction}
      >
        <div
          className="po-preview-panel"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="po-detail-empty">لم يُعثر على العقار.</p>
          <button type="button" className="btn btn-sm" onClick={onCloseAction}>
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="po-preview-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`تفاصيل الصك ${property.deedNumber || ""}`}
      onClick={onCloseAction}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCloseAction();
      }}
    >
      <div
        className="po-preview-panel po-preview-panel--property"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="po-preview-panel-hd">
          <h3 className="po-preview-panel-title">
            تفاصيل الصك — {record.poNumber}
          </h3>
          <button type="button" className="btn btn-sm" onClick={onCloseAction}>
            إغلاق
          </button>
        </div>
        <PoDetailPropertyCard
          index={index + 1}
          property={property}
          poNumber={record.poNumber}
          assignmentType={record.assignmentType}
          showDecree={showDecree}
        />
      </div>
    </div>
  );
}
