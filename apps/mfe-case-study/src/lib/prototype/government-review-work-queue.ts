import {
  governmentReviewStatusLabel,
  isGovernmentReviewFormLocked,
} from "./government-review-work-data";
import { loadGovernmentReviewSubmission } from "./government-review-work-storage";
import type { WorkflowTask } from "./tasks-storage";

export function governmentReviewTaskStatusBadge(
  task: WorkflowTask,
): { label: string; className: string } | null {
  const sub = loadGovernmentReviewSubmission(task.id);
  if (sub?.status === "submitted" || task.status === "completed") {
    return { label: governmentReviewStatusLabel("submitted"), className: "b-done" };
  }
  if (!sub) {
    return { label: "جديدة", className: "b-new" };
  }
  if (sub.visitStatus && sub.keysStatus) {
    return { label: "قيد التنفيذ", className: "b-prog" };
  }
  if (sub.visitStatus || sub.keysStatus) {
    return { label: "مسودة", className: "b-new" };
  }
  return { label: "جديدة", className: "b-new" };
}

export function isGovernmentReviewLocked(
  taskId: string,
  taskStatus?: string,
): boolean {
  if (taskStatus === "completed") return true;
  const sub = loadGovernmentReviewSubmission(taskId);
  return sub ? isGovernmentReviewFormLocked(sub.status) : false;
}
