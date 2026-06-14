import type { FieldInspectionSubmission } from "./field-inspection-data";
import { notifyTasksChanged } from "./tasks-storage";
import { submitFieldInspectionSubmission } from "./field-inspection-submission-storage";

/** يُنهي المعاينة الميدانية عبر API (يُكمل المهمة على الخادم). */
export async function finalizeFieldInspectionSubmission(
  taskId: string,
): Promise<
  | { ok: true; submission: FieldInspectionSubmission }
  | { ok: false; message: string; errors?: Record<string, string> }
> {
  const result = await submitFieldInspectionSubmission(taskId);
  if (result.ok) {
    notifyTasksChanged();
  }
  return result;
}
