import {
  INCOMPLETE_CONTACT_MARKER_PHONE,
  type PoContact,
  type PoPropertyIntake,
} from "@/lib/prototype/po-intake-data";
import type { FieldErrors } from "@/components/prototype/registration/registration-utils";

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

/** Trim contact rows for API — keeps indices aligned with the form (backend skips fully empty rows). */
export function contactsForApi(contacts: PoContact[]): PoContact[] {
  return contacts.map((c) => ({
    name: c.name.trim(),
    role: c.role.trim(),
    phone: c.phone.trim(),
  }));
}

export function validatePropertyContacts(p: PoPropertyIntake): FieldErrors {
  const errors: FieldErrors = {};
  let hasValid = false;
  p.contacts.forEach((c, i) => {
    const phone = c.phone.trim();
    const role = c.role.trim();
    if (!phone && !role) return;
    if (!phone) {
      errors[`contact_phone_${i}`] = "رقم الجوال مطلوب";
    } else if (!isValidPhone(phone)) {
      errors[`contact_phone_${i}`] =
        `رقم الجوال يجب أن يكون ${PHONE_MIN_DIGITS} أرقام على الأقل`;
    }
    if (!role) errors[`contact_role_${i}`] = "صفة الضابط مطلوبة";
    if (isValidContactEntry(c)) hasValid = true;
  });
  if (!hasValid) {
    errors._contacts = "أضف ضابط اتصال واحداً على الأقل (جوال + صفة)";
  }
  return errors;
}
