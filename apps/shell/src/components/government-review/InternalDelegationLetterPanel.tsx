"use client";

import { useMemo, useState } from "react";
import { RegistrationFormCard } from "@/components/prototype/registration/RegistrationFormCard";
import type { InternalDelegationLetter } from "@/lib/prototype/internal-delegation-letters";
import { updateDelegationLetterSelection } from "@/lib/prototype/internal-delegation-letters";
import { printInternalDelegationLetter } from "@/lib/prototype/internal-delegation-letter-html";
import { poPrimaryDataReadiness } from "@/lib/prototype/po-primary-data-readiness";
import {
  formatPropertyDeedDisplay,
  type PoIntakeRecord,
} from "@/lib/prototype/po-intake-data";

type Props = {
  letter: InternalDelegationLetter;
  record: PoIntakeRecord;
  onRefresh: () => void;
};

export function InternalDelegationLetterPanel({
  letter,
  record,
  onRefresh,
}: Props) {
  const readiness = useMemo(() => poPrimaryDataReadiness(record), [record]);
  const courtProperties = useMemo(
    () =>
      record.properties.filter((p) => p.court.trim() === letter.court.trim()),
    [record, letter.court],
  );
  const [selected, setSelected] = useState<string[]>(letter.selectedPropertyIds);

  function toggleProperty(propertyId: string) {
    setSelected((prev) => {
      const next = prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId];
      updateDelegationLetterSelection(letter.id, next);
      onRefresh();
      return next;
    });
  }

  function handlePrint() {
    if (!readiness.ready) return;
    printInternalDelegationLetter(
      { ...letter, selectedPropertyIds: selected },
      record,
    );
  }

  return (
    <RegistrationFormCard
      title={`خطاب تفويض داخلي — ${letter.court}`}
    >
      <div className="note note-info" style={{ marginBottom: 12 }}>
        {letter.city ? `${letter.city} · ` : ""}
        {letter.circuit !== "—" ? `الدائرة: ${letter.circuit}` : null}
      </div>

      <p className="reg-field-hint" style={{ marginBottom: 10 }}>
        اختر العقارات المشمولة في خطاب الزيارة لهذه المحكمة:
      </p>

      <ul className="gov-delegation-property-list">
        {courtProperties.map((property) => (
          <li key={property.id}>
            <label className="gov-delegation-property-opt">
              <input
                type="checkbox"
                checked={selected.includes(property.id)}
                onChange={() => toggleProperty(property.id)}
              />
              <span>
                {formatPropertyDeedDisplay(property) || property.id}
                {property.ownerName ? ` — ${property.ownerName}` : ""}
              </span>
            </label>
          </li>
        ))}
      </ul>

      {!readiness.ready ? (
        <div className="note note-warn" style={{ marginTop: 12 }}>
          التصدير متاح بعد اكتمال البيانات الأولية لجميع عقارات أمر العمل (
          {readiness.label}).
        </div>
      ) : null}

      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          disabled={!readiness.ready || selected.length === 0}
          onClick={handlePrint}
        >
          طباعة / تصدير الخطاب
        </button>
        <span className="reg-field-hint">
          {selected.length} عقار مختار
        </span>
      </div>
    </RegistrationFormCard>
  );
}
