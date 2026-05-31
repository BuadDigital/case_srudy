import {
  isBourseInquiryIdentifier,
  requiresAssignmentDecree,
  type AssignmentType,
  type PoPropertyIntake,
} from "@/lib/prototype/po-intake-data";
import {
  collectRequiredErrors,
  mergeFieldErrors,
  type FieldErrors,
} from "@/components/prototype/registration/registration-utils";
import { validatePropertyContacts } from "./po-property-validation";

export function validatePropertyEnfathFields(
  p: PoPropertyIntake,
  assignmentType: AssignmentType,
): FieldErrors {
  if (isBourseInquiryIdentifier(p.identifierType)) {
    const errors = mergeFieldErrors(
      collectRequiredErrors(
        {
          district: p.district,
          classification: p.classification,
          propertyType: p.propertyType,
        },
        ["district", "classification", "propertyType"],
      ),
    );
    if (
      requiresAssignmentDecree(assignmentType) &&
      !p.assignmentDocFileName.trim()
    ) {
      errors.assignmentDocFileName =
        "ارفع قرار الإسناد الخاص بهذا العقار (مطلوب لمسار التنفيذ)";
    }
    return errors;
  }

  const errors = mergeFieldErrors(
    collectRequiredErrors(
      {
        deedNumber: p.deedNumber,
        taskNumber: p.taskNumber,
        deedDate: p.deedDate,
        ownerName: p.ownerName,
        delegationLetterFileName: p.delegationLetterFileName,
      },
      [
        "deedNumber",
        "taskNumber",
        "deedDate",
        "ownerName",
        "delegationLetterFileName",
      ],
    ),
  );

  if (
    p.identifierType === "real_estate_reg" &&
    !p.realEstateRegFileName.trim()
  ) {
    errors.realEstateRegFileName =
      "ارفع السجل العقاري كمرفق (يُطلب من أطراف التنفيذ)";
  }

  if (
    requiresAssignmentDecree(assignmentType) &&
    !p.assignmentDocFileName.trim()
  ) {
    errors.assignmentDocFileName =
      "ارفع قرار الإسناد الخاص بهذا العقار (مطلوب لمسار التنفيذ)";
  }

  return errors;
}

export function mergePropertyEnfathValidation(
  p: PoPropertyIntake,
  assignmentType: AssignmentType,
): FieldErrors {
  return mergeFieldErrors(
    validatePropertyEnfathFields(p, assignmentType),
    validatePropertyContacts(p),
  );
}

export function firstEnfathValidationMessage(errors: FieldErrors): string {
  return (
    errors._contacts ??
    errors._ ??
    errors.district ??
    errors.classification ??
    errors.propertyType ??
    errors.deedNumber ??
    errors.taskNumber ??
    errors.deedDate ??
    errors.ownerName ??
    errors.delegationLetterFileName ??
    errors.realEstateRegFileName ??
    errors.assignmentDocFileName ??
    "يرجى تعبئة بيانات العقار"
  );
}

export function findInvalidEnfathPropertyIndex(
  properties: PoPropertyIntake[],
  assignmentType: AssignmentType,
): { index: number; errors: FieldErrors } | null {
  for (let i = 0; i < properties.length; i++) {
    const errors = mergePropertyEnfathValidation(properties[i], assignmentType);
    if (Object.keys(errors).length > 0) {
      return { index: i, errors };
    }
  }
  return null;
}

export { isValidContactEntry } from "./po-property-validation";
