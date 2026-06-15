"use client";

import { useMemo, useState } from "react";
import { Button, Note } from "@platform/design-system";
import { RegistrationFormCard } from "@platform/app-shared/registration/RegistrationFormCard";
import type { InternalDelegationLetter } from "../../lib/prototype/internal-delegation-letters";
import { updateDelegationLetterSelection } from "../../lib/prototype/internal-delegation-letters";
import { printInternalDelegationLetter } from "../../lib/prototype/internal-delegation-letter-html";
import { poPrimaryDataReadiness } from "../../lib/prototype/po-primary-data-readiness";
import {
  formatPropertyDeedDisplay,
  type PoIntakeRecord,
} from "../../lib/prototype/po-intake-data";

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
      <Note tone="info">
        {letter.city ? `${letter.city} · ` : ""}
        {letter.circuit !== "—" ? `الدائرة: ${letter.circuit}` : null}
      </Note>

      <p className="mb-2.5 text-[10px] text-text-3">
        اختر العقارات المشمولة في خطاب الزيارة لهذه المحكمة:
      </p>

      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {courtProperties.map((property) => (
          <li key={property.id}>
            <label className="flex cursor-pointer items-start gap-2 text-[13px] text-text">
              <input
                type="checkbox"
                className="mt-0.5"
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
        <Note tone="warn" className="mt-3">
          التصدير متاح بعد اكتمال البيانات الأولية لجميع عقارات أمر العمل (
          {readiness.label}).
        </Note>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="primary"
          disabled={!readiness.ready || selected.length === 0}
          onClick={handlePrint}
        >
          طباعة / تصدير الخطاب
        </Button>
        <span className="text-[10px] text-text-3">
          {selected.length} عقار مختار
        </span>
      </div>
    </RegistrationFormCard>
  );
}
