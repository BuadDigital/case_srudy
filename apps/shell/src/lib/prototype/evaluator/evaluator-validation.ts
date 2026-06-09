import type { EvaluatorChecklistAnswers } from "./evaluator-window-data";
import { getCachedEvaluatorReport } from "./evaluator-report-attachments";

export type EvaluatorValidationErrors = Record<string, string>;

export function validateEvaluatorSubmission(input: {
  taskId: string;
  evaluatorPrice: string;
  checklist?: EvaluatorChecklistAnswers;
}): EvaluatorValidationErrors {
  const errors: EvaluatorValidationErrors = {};
  const { taskId, evaluatorPrice, checklist } = input;

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

  if (!checklist) return errors;

  const simpleKeys = [
    "q_plan_match",
    "q_excess_zoning",
    "q_land_waqf",
    "q_property_waqf",
    "q_expropriation",
    "q_agriculture_inquiry",
    "q_overlap",
    "q_shared_building",
    "q_environmental_factors",
    "q_unregistered_additions",
    "q_shared_deed",
    "q_lease_exists",
    "q_technical_notes_exists",
  ] as const;

  for (const key of simpleKeys) {
    if (checklist[key] === null || checklist[key] === undefined) {
      errors[key] = "مطلوب اختيار نعم أو لا.";
    }
  }

  if (checklist.q_shared_deed === true) {
    if (!checklist.shared_deed_scope) {
      errors.shared_deed_scope = "مطلوب تحديد نطاق الملكية.";
    } else if (
      checklist.shared_deed_scope === "part" &&
      !checklist.shared_deed_percentage.trim()
    ) {
      errors.shared_deed_percentage = "مطلوب إدخال نسبة الملكية.";
    }
  }

  if (checklist.q_lease_exists === true) {
    if (checklist.q_lease_active === null || checklist.q_lease_active === undefined) {
      errors.q_lease_active = "مطلوب تحديد ما إذا كان عقد الإيجار سارياً.";
    }
  }

  if (checklist.q_technical_notes_exists === true) {
    if (!checklist.technical_notes_text.trim()) {
      errors.technical_notes_text = "مطلوب وصف الملاحظات الفنية.";
    }
  }

  return errors;
}

export function firstEvaluatorError(
  errors: EvaluatorValidationErrors,
): string | null {
  const values = Object.values(errors);
  return values[0] ?? null;
}
