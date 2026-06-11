import {
  loadPartyCaseStudyFormDraft,
  savePartyCaseStudyFormDraft,
} from "@case-study/mfe";
import type { EngineeringSurveySubmission } from "./engineering-survey-data";
import { submitEngineeringSurveySubmission } from "./engineering-survey-submission-storage";

/** يرسل الرفع المساحي + إجابات نموذج الدراسة لأخصائي دراسة الحالة. */
export async function finalizeEngineeringSurveySubmission(
  surveyTaskId: string,
): Promise<EngineeringSurveySubmission | null> {
  const submitted = submitEngineeringSurveySubmission(surveyTaskId);
  if (!submitted) return null;

  const partyDraft = await loadPartyCaseStudyFormDraft(surveyTaskId);
  if (partyDraft) {
    await savePartyCaseStudyFormDraft({
      ...partyDraft,
      status: "submitted",
      savedAtUtc: new Date().toISOString(),
    });
  }

  return submitted;
}
