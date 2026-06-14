import {
  governmentReviewStatusLabel,
  isGovernmentReviewFormLocked,
} from "./government-review-work-data";
import { loadGovernmentReviewSubmission } from "./government-review-work-storage";

export function governmentReviewTaskStatusBadge(
  taskId: string,
): { label: string; className: string } | null {
  const sub = loadGovernmentReviewSubmission(taskId);
  if (sub?.status === "submitted") {
    return { label: governmentReviewStatusLabel("submitted"), className: "b-done" };
  }
  if (sub?.visitStatus && sub.keysStatus) {
    return { label: "قيد التنفيذ", className: "b-prog" };
  }
  if (sub?.visitStatus || sub?.keysStatus) {
    return { label: "مسودة", className: "b-new" };
  }
  return { label: "جديدة", className: "b-new" };
}

export function isGovernmentReviewLocked(taskId: string): boolean {
  const sub = loadGovernmentReviewSubmission(taskId);
  return sub ? isGovernmentReviewFormLocked(sub.status) : false;
}
