"use client";

import type { PoPropertyIntake } from "@/lib/prototype/po-intake-data";

export function PoPropertyStackCard({
  index,
  property,
  onEdit,
  onRemove,
}: {
  index: number;
  property: PoPropertyIntake;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const contactCount = property.contacts.filter(
    (c) => c.name.trim() && c.phone.trim(),
  ).length;
  const location = [property.city, property.district].filter(Boolean).join(" · ");
  const typeLabel = property.propertyType || property.classification || "—";

  return (
    <article className="po-property-stack-card" aria-label={`عقار ${index}`}>
      <header className="po-property-stack-card-hd">
        <div className="po-property-stack-card-title">
          <span className="po-property-stack-card-num">عقار {index}</span>
          <span className="po-property-stack-card-deed" dir="ltr">
            {property.deedNumber || "—"}
          </span>
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
        </p>
      </div>
    </article>
  );
}
