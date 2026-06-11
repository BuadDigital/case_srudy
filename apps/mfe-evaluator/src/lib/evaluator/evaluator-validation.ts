import { getCachedEvaluatorReport } from "./evaluator-report-attachments";

export type EvaluatorValidationErrors = Record<string, string>;

export function validateEvaluatorSubmission(input: {
  taskId: string;
  evaluatorPrice: string;
}): EvaluatorValidationErrors {
  const errors: EvaluatorValidationErrors = {};
  const { taskId, evaluatorPrice } = input;

  const report = getCachedEvaluatorReport(taskId);
  if (!report?.dataUrl) {
    errors.evaluator_report_file = "مطلوب رفع تقرير PDF من برنامج المقياس.";
  }

  const price = Number.parseFloat(evaluatorPrice.replace(/,/g, "").trim());
  if (!evaluatorPrice.trim()) {
    errors.evaluator_price = "مطلوب إدخال سعر التقييم.";
  } else if (!Number.isFinite(price) || price <= 0) {
    errors.evaluator_price = "يجب أن يكون السعر رقماً موجباً أكبر من صفر.";
  }

  return errors;
}

export function firstEvaluatorError(
  errors: EvaluatorValidationErrors,
): string | null {
  const values = Object.values(errors);
  return values[0] ?? null;
}
