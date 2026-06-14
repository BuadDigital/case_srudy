import type { ValuationCoordinationSubmission } from "./valuation-coordination-work-data";
import {
  saveValuationCoordinationSubmission,
  submitValuationCoordinationSubmission,
} from "./valuation-coordination-work-storage";

/** يُنهي استلام منسق التقييم عبر PartyTaskSubmissions — الخادم يُكمل مهمة الطرف. */
export async function finalizeValuationCoordinationSubmission(
  taskId: string,
  draft?: ValuationCoordinationSubmission,
): Promise<ValuationCoordinationSubmission | null> {
  if (draft) {
    const saved = await saveValuationCoordinationSubmission(draft);
    if (!saved) return null;
  }
  return submitValuationCoordinationSubmission(taskId);
}
