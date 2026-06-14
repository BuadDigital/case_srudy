import type { GovernmentReviewSubmission } from "./government-review-work-data";
import { submitGovernmentReviewSubmission } from "./government-review-work-storage";
import { completeChildTask } from "./tasks-storage";

/** يُنهي المراجعة الحكومية ويُكمل مهمة الطرف. */
export async function finalizeGovernmentReviewSubmission(
  taskId: string,
): Promise<GovernmentReviewSubmission | null> {
  const submitted = submitGovernmentReviewSubmission(taskId);
  if (!submitted) return null;

  await completeChildTask(taskId);
  return submitted;
}
