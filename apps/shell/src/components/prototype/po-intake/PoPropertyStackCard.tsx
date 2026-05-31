"use client";

import {
  formatPropertyDeedDisplay,
  requiresAssignmentDecree,
  type AssignmentType,
  type PoPropertyIntake,
} from "@/lib/prototype/po-intake-data";
import { isValidContactEntry } from "./po-property-validation";

export function PoPropertyStackCard({
  index,
  property,
  assignmentType,
  onEdit,
  onRemove,
}: {
  index: number;
  property: PoPropertyIntake;
  assignmentType: AssignmentType;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const contactCount = property.contacts.filter((c) =>
    isValidContactEntry(c),
  ).length;
  const location = property.bourseDataCompleted
    ? [property.city, property.district].filter(Boolean).join(" · ")
    : "بانتظار البورصة";
  const typeLabel =
    property.propertyType || property.classification || "—";
  const deedLabel = formatPropertyDeedDisplay(property);

  return (
    <article className="po-property-stack-card" aria-label={`عقار ${index}`}>
      <header className="po-property-stack-card-hd">
        <div className="po-property-stack-card-title">
          <span className="po-property-stack-card-num">عقار {index}</span>
          <span className="po-property-stack-card-deed" dir="ltr">
            {deedLabel}
          </span>
          {property.taskNumber ? (
            <span className="po-property-stack-card-meta">
              مهمة: {property.taskNumber}
            </span>
          ) : null}
        </div>
        <div className="po-property-stack-card-actions">
          <button type="button" className="btn btn-sm" onClick={onEdit}>
            تعديل
          </button>
          <button
            type="button"
            className="btn btn-sm btn-danger-outline"
            onClick={onRemove}
          >
            حذف
          </button>
        </div>
      </header>
      <div className="po-property-stack-card-body">
        <p>{location || "—"}</p>
        <p className="po-property-stack-card-meta">
          <span>{typeLabel}</span>
          <span aria-hidden>·</span>
          <span>
            {contactCount}{" "}
            {contactCount === 1 ? "ضابط اتصال" : "ضباط اتصال"}
          </span>
          {requiresAssignmentDecree(assignmentType) ? (
            <>
              <span aria-hidden>·</span>
              <span
                className={
                  property.assignmentDocFileName.trim()
                    ? "po-stack-decree-ok"
                    : "po-stack-decree-missing"
                }
              >
                قرار الإسناد:{" "}
                {property.assignmentDocFileName.trim() || "غير مرفق"}
              </span>
            </>
          ) : null}
        </p>
      </div>
    </article>
  );
}
