import {
  requiresAssignmentDecree,
  type AssignmentType,
  type PoPropertyIntake,
} from "@/lib/prototype/po-intake-data";
import {
  collectRequiredErrors,
  hasFieldErrors,
  mergeFieldErrors,
  type FieldErrors,
} from "@/components/prototype/registration/registration-utils";

export const PHONE_MIN_DIGITS = 10;

export function phoneDigitCount(phone: string): number {
  return phone.replace(/\D/g, "").length;
}

export function isValidPhone(phone: string): boolean {
  return phoneDigitCount(phone) >= PHONE_MIN_DIGITS;
}

/** Digits only — used while typing in contact phone fields. */
export function normalizePhoneInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 15);
}

export function validatePropertyFields(
  p: PoPropertyIntake,
  assignmentType: AssignmentType,
): FieldErrors {
  const errors = mergeFieldErrors(
    collectRequiredErrors(
      {
        deedNumber: p.deedNumber,
        city: p.city,
        district: p.district,
        classification: p.classification,
        propertyType: p.propertyType,
      },
      ["deedNumber", "city", "district", "classification", "propertyType"],
    ),
  );

  if (requiresAssignmentDecree(assignmentType) && !p.assignmentDocFileName.trim()) {
    errors.assignmentDocFileName =
      "ارفع قرار الإسناد الخاص بهذا العقار (مطلوب لمسار التنفيذ)";
  }

  if (p.identifierType === "real_estate_reg" && !p.realEstateRegFileName.trim()) {
    errors.realEstateRegFileName =
      "ارفع السجل العقاري كمرفق (يُطلب من أطراف التنفيذ)";
  }

  return errors;
}

export function validatePropertyContacts(p: PoPropertyIntake): FieldErrors {
  const errors: FieldErrors = {};
  let hasValid = false;
  p.contacts.forEach((c, i) => {
    const name = c.name.trim();
    const phone = c.phone.trim();
    if (!name) errors[`contact_name_${i}`] = "الاسم مطلوب";
    if (!phone) {
      errors[`contact_phone_${i}`] = "رقم الجوال مطلوب";
    } else if (!isValidPhone(phone)) {
      errors[`contact_phone_${i}`] =
        `رقم الجوال يجب أن يكون ${PHONE_MIN_DIGITS} أرقام على الأقل`;
    }
    if (name && isValidPhone(phone)) hasValid = true;
  });
  if (!hasValid) errors._contacts = "أضف ضابط اتصال واحداً على الأقل";
  return errors;
}

export function mergePropertyValidation(
  p: PoPropertyIntake,
  assignmentType: AssignmentType,
): FieldErrors {
  return mergeFieldErrors(
    validatePropertyFields(p, assignmentType),
    validatePropertyContacts(p),
  );
}

export function firstPropertyValidationMessage(errors: FieldErrors): string {
  return (
    errors._contacts ??
    errors.assignmentDocFileName ??
    errors.realEstateRegFileName ??
    Object.values(errors).find((m) => m?.trim()) ??
    "أكمل بيانات هذا العقار"
  );
}

export function findInvalidPropertyIndex(
  properties: PoPropertyIntake[],
  assignmentType: AssignmentType,
): { index: number; errors: FieldErrors } | null {
  for (let i = 0; i < properties.length; i++) {
    const errors = mergePropertyValidation(properties[i], assignmentType);
    if (hasFieldErrors(errors)) return { index: i, errors };
  }
  return null;
}
