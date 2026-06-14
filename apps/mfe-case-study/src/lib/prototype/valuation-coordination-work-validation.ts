import type { ValuationCoordinationSubmission } from "./valuation-coordination-work-data";

export type ValuationCoordinationFieldErrors = Partial<
  Record<
    | "receiptConfirmed"
    | "receiptDate"
    | "coordinationNotes"
    | "inspectorName"
    | "appraiserName",
    string
  >
>;

export function validateValuationCoordinationSubmission(
  submission: ValuationCoordinationSubmission,
): ValuationCoordinationFieldErrors {
  const errors: ValuationCoordinationFieldErrors = {};

  if (!submission.receiptConfirmed) {
    errors.receiptConfirmed = "يجب تأكيد استلام المعاملة في قسم التقييم";
  }

  if (!submission.receiptDate.trim()) {
    errors.receiptDate = "أدخل تاريخ الاستلام";
  }

  if (!submission.inspectorName.trim()) {
    errors.inspectorName = "لم يُعيَّن معاين ميداني — راجع توزيع المعاملات";
  }

  if (!submission.appraiserName.trim()) {
    errors.appraiserName = "لم يُعيَّن مقيم عقاري — راجع توزيع المعاملات";
  }

  if (submission.coordinationNotes.trim().length < 10) {
    errors.coordinationNotes =
      "أضف ملاحظات تنسيق (10 أحرف على الأقل) لتوضيح خطة الإسناد";
  }

  return errors;
}

export function firstValuationCoordinationError(
  errors: ValuationCoordinationFieldErrors,
): string {
  return (
    errors.receiptConfirmed ??
    errors.receiptDate ??
    errors.inspectorName ??
    errors.appraiserName ??
    errors.coordinationNotes ??
    "تحقق من الحقول المطلوبة"
  );
}
