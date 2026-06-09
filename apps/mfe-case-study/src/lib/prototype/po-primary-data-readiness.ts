import { hasFieldErrors } from "@platform/app-shared/registration/registration-utils";
import { mergePropertyEnfathValidation } from "../domain/po-intake/property-enfath-validation";
import type { PoIntakeRecord } from "./po-intake-data";

export function poPrimaryDataReadiness(record: PoIntakeRecord): {
  ready: boolean;
  label: string;
  completeCount: number;
  totalCount: number;
} {
  const total = record.properties.length;
  let complete = 0;
  for (const p of record.properties) {
    const errors = mergePropertyEnfathValidation(p, record.assignmentType);
    if (!hasFieldErrors(errors)) complete += 1;
  }
  const ready = total > 0 && complete === total;
  return {
    ready,
    label: ready
      ? "البيانات الأولية مكتملة"
      : `${complete}/${total} عقار — بيانات أولية ناقصة`,
    completeCount: complete,
    totalCount: total,
  };
}
