import type { ValuationCoordinationSubmission } from "./valuation-coordination-work-data";
import { submitValuationCoordinationSubmission } from "./valuation-coordination-work-storage";
import { completeChildTask } from "./tasks-storage";

/** يُنهي استلام منسق التقييم ويُكمل مهمة الطرف. */
export async function finalizeValuationCoordinationSubmission(
  taskId: string,
): Promise<ValuationCoordinationSubmission | null> {
  const submitted = submitValuationCoordinationSubmission(taskId);
  if (!submitted) return null;

  await completeChildTask(taskId);
  return submitted;
}
