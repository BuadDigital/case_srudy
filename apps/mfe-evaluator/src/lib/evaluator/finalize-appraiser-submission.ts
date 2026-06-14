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

export type FinalizeAppraiserResult =
  | { ok: true; submission: EvaluatorSubmission }
  | { ok: false; message: string };

/** يرسل تقييم المقيم + إجابات الاستدلال لأخصائي دراسة الحالة. */
export async function finalizeAppraiserSubmission(
  appraisalTaskId: string,
): Promise<FinalizeAppraiserResult> {
  const result = await submitEvaluatorSubmission(appraisalTaskId);
  if (!result.ok) return result;

  clearEvaluatorRecall(appraisalTaskId);

  const partyDraft = await loadPartyCaseStudyFormDraft(appraisalTaskId);
  if (partyDraft) {
    await savePartyCaseStudyFormDraft({
      ...partyDraft,
      status: "submitted",
      savedAtUtc: new Date().toISOString(),
    });
  }

  return result;
}

export function hasSubmittedAppraisalForChild(
  appraisalTaskId: string,
): boolean {
  const sub = loadEvaluatorSubmission(appraisalTaskId);
  return sub?.status === "submitted" || sub?.status === "completed";
}
