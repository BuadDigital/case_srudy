import type { PoPropertyIntake } from "@/lib/prototype/po-intake-data";
import {
  collectRequiredErrors,
  mergeFieldErrors,
  type FieldErrors,
} from "@/components/prototype/registration/registration-utils";

export function validatePropertyBourseFields(
  p: PoPropertyIntake,
): FieldErrors {
  const errors = mergeFieldErrors(
    collectRequiredErrors(
      {
        city: p.city,
        district: p.district,
        classification: p.classification,
        propertyType: p.propertyType,
      },
      ["city", "district", "classification", "propertyType"],
    ),
  );

  if (
    p.boundariesAvailability === "doc" &&
    !p.boundariesExternalDocName.trim()
  ) {
    errors.boundariesExternalDocName = "اسم المستند الخارجي مطلوب";
  }

  return errors;
}

export function firstBourseValidationMessage(errors: FieldErrors): string {
  return (
    errors.city ??
    errors.district ??
    errors.classification ??
    errors.propertyType ??
    errors.boundariesExternalDocName ??
    "يرجى تعبئة بيانات البورصة"
  );
}
