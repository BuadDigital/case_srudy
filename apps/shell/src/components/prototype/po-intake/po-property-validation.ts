import {
  INCOMPLETE_CONTACT_MARKER_PHONE,
  isBourseInquiryIdentifier,
  requiresAssignmentDecree,
  type AssignmentType,
  type PoContact,
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

export function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** يطابق 0500000000 (مع أو بدون أصفار/رموز إضافية). */
export function isIncompleteMarkerPhone(phone: string): boolean {
  const digits = normalizePhoneDigits(phone);
  return (
    digits === INCOMPLETE_CONTACT_MARKER_PHONE ||
    digits === INCOMPLETE_CONTACT_MARKER_PHONE.replace(/^0/, "")
  );
}

export function propertyHasIncompleteContact(prop: PoPropertyIntake): boolean {
  return prop.contacts.some((c) => isIncompleteMarkerPhone(c.phone));
}

export function isValidContactEntry(c: PoContact): boolean {
  return isValidPhone(c.phone) && c.role.trim().length > 0;
}

export function validatePropertyFields(
  p: PoPropertyIntake,
  assignmentType: AssignmentType,
): FieldErrors {
  const bourseId = isBourseInquiryIdentifier(p.identifierType);

  const requiredKeys = bourseId
    ? (["district", "classification", "propertyType"] as const)
    : ([
        "deedNumber",
        "city",
        "district",
        "classification",
        "propertyType",
      ] as const);

  const errors = mergeFieldErrors(
    collectRequiredErrors(
      {
        deedNumber: p.deedNumber,
        city: p.city,
        district: p.district,
        classification: p.classification,
        propertyType: p.propertyType,
      },
      [...requiredKeys],
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
    const phone = c.phone.trim();
    const role = c.role.trim();
    if (!phone) {
      errors[`contact_phone_${i}`] = "رقم الجوال مطلوب";
    } else if (!isValidPhone(phone)) {
      errors[`contact_phone_${i}`] =
        `رقم الجوال يجب أن يكون ${PHONE_MIN_DIGITS} أرقام على الأقل`;
    }
    if (!role) errors[`contact_role_${i}`] = "صفة الضابط مطلوبة";
    if (isValidContactEntry(c)) hasValid = true;
  });
  if (!hasValid) errors._contacts = "أضف ضابط اتصال واحداً على الأقل (جوال + صفة)";
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
