import {
  fieldInspectionStatusLabel,
  isFieldInspectionFormLocked,
} from "./field-inspection-data";
import { loadFieldInspectionSubmission } from "./field-inspection-submission-storage";

export function fieldInspectionTaskStatusBadge(
  taskId: string,
  taskStatus?: string,
): { label: string; className: string } | null {
  if (taskStatus === "completed") {
    return { label: fieldInspectionStatusLabel("submitted"), className: "b-done" };
  }

  const sub = loadFieldInspectionSubmission(taskId);
  if (sub?.status === "submitted") {
    return { label: fieldInspectionStatusLabel("submitted"), className: "b-done" };
  }
  if (sub?.propertyType || sub?.structuralCondition) {
    return { label: "مسودة", className: "b-prog" };
  }
  return { label: "جديدة", className: "b-new" };
}

export function isFieldInspectionLocked(taskId: string): boolean {
  const sub = loadFieldInspectionSubmission(taskId);
  return sub ? isFieldInspectionFormLocked(sub.status) : false;
}
