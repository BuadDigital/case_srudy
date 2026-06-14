import type { FieldInspectionSubmission } from "./field-inspection-data";

export type FieldInspectionFieldErrors = Partial<
  Record<
    | "propertyType"
    | "areaDistrict"
    | "actualAreaSqm"
    | "structuralCondition"
    | "hasMovableItems"
    | "isCurrentlyRented"
    | "accessDifficulty"
    | "avgPricePerSqm"
    | "marketActivityLevel"
    | "responsiblePersonName"
    | "responsiblePersonRole"
    | "generalNotes"
    | "_",
    string
  >
>;

export function validateFieldInspectionSubmission(
  submission: FieldInspectionSubmission,
): FieldInspectionFieldErrors {
  const errors: FieldInspectionFieldErrors = {};
  if (!submission.propertyType.trim()) {
    errors.propertyType = "نوع العقار مطلوب";
  }
  return errors;
}

export function firstFieldInspectionError(
  errors: FieldInspectionFieldErrors,
): string | null {
  const general = errors._?.trim();
  if (general) return general;
  for (const value of Object.values(errors)) {
    if (value?.trim()) return value.trim();
  }
  return null;
}
