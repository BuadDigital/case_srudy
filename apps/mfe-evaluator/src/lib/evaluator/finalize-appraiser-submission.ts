import {
  loadPartyCaseStudyFormDraft,
  savePartyCaseStudyFormDraft,
} from "@case-study/mfe";
import {
  loadEvaluatorSubmission,
  submitEvaluatorSubmission,
} from "./evaluator-submission-storage";
import { clearEvaluatorRecall } from "./evaluator-recall-storage";
import type { EvaluatorSubmission } from "./evaluator-window-data";

/** يرسل تقييم المقيم + إجابات الاستدلال لأخصائي دراسة الحالة. */
export async function finalizeAppraiserSubmission(
  appraisalTaskId: string,
): Promise<EvaluatorSubmission | null> {
  const submitted = submitEvaluatorSubmission(appraisalTaskId);
  if (!submitted) return null;

  clearEvaluatorRecall(appraisalTaskId);

  const partyDraft = await loadPartyCaseStudyFormDraft(appraisalTaskId);
  if (partyDraft) {
    await savePartyCaseStudyFormDraft({
      ...partyDraft,
      status: "submitted",
      savedAtUtc: new Date().toISOString(),
    });
  }

  return submitted;
}

export function hasSubmittedAppraisalForChild(
  appraisalTaskId: string,
): boolean {
  const sub = loadEvaluatorSubmission(appraisalTaskId);
  return sub?.status === "submitted" || sub?.status === "completed";
}
