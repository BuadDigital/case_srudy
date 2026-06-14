import {
  isValuationCoordinationFormLocked,
  valuationCoordinationStatusLabel,
} from "./valuation-coordination-work-data";
import { loadValuationCoordinationSubmission } from "./valuation-coordination-work-storage";

export function valuationCoordinationTaskStatusBadge(
  taskId: string,
): { label: string; className: string } | null {
  const sub = loadValuationCoordinationSubmission(taskId);
  if (sub?.status === "submitted") {
    return {
      label: valuationCoordinationStatusLabel("submitted"),
      className: "b-done",
    };
  }
  if (sub?.receiptConfirmed && sub.coordinationNotes.trim()) {
    return { label: "قيد التنسيق", className: "b-prog" };
  }
  if (sub && (sub.receiptConfirmed || sub.coordinationNotes.trim())) {
    return { label: "مسودة", className: "b-new" };
  }
  return { label: "بانتظار الاستلام", className: "b-new" };
}

export function isValuationCoordinationLocked(taskId: string): boolean {
  const sub = loadValuationCoordinationSubmission(taskId);
  return sub ? isValuationCoordinationFormLocked(sub.status) : false;
}
