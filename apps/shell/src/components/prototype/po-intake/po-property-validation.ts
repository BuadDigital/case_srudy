import {
  requiresAssignmentDecree,
  type AssignmentType,
  type PoPropertyIntake,
} from "@/lib/prototype/po-intake-data";
import {
  collectRequiredErrors,
  mergeFieldErrors,
  type FieldErrors,
} from "@/components/prototype/registration/registration-utils";

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
    errors.assignmentDocFileName = "مرفق قرار الإسناد مطلوب لمسار التنفيذ";
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
    if (!c.name.trim()) errors[`contact_name_${i}`] = "الاسم مطلوب";
    if (!c.phone.trim()) errors[`contact_phone_${i}`] = "رقم الجوال مطلوب";
    if (c.name.trim() && c.phone.trim()) hasValid = true;
  });
  if (!hasValid) errors._contacts = "أضف ضابط اتصال واحداً على الأقل";
  return errors;
}
