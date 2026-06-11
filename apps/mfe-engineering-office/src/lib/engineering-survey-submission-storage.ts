import {
  createEngineeringSurveyDraft,
  type EngineeringSurveyChecklistRow,
  type EngineeringSurveySubmission,
  type EngineeringSurveySubmissionStatus,
} from "./engineering-survey-data";
import {
  jeddahDefaultCoords,
  shouldUseJeddahDefaultCoords,
} from "./jeddah-default-coords";

const STORAGE_PREFIX = "evalEngineeringSurveySubmission:";

export const ENGINEERING_SURVEY_SUBMISSION_CHANGED_EVENT =
  "engineering-survey-submission-changed";

function notifyChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ENGINEERING_SURVEY_SUBMISSION_CHANGED_EVENT));
  }
}

function storageKey(taskId: string): string {
  return `${STORAGE_PREFIX}${taskId}`;
}

export function loadEngineeringSurveySubmission(
  taskId: string,
): EngineeringSurveySubmission | null {
  if (typeof window === "undefined" || !taskId) return null;
  try {
    const raw = localStorage.getItem(storageKey(taskId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EngineeringSurveySubmission;
    if (!parsed.checklist?.length) {
      return createEngineeringSurveyDraft({
        taskId: parsed.taskId,
        propertyId: parsed.propertyId,
        poNumber: parsed.poNumber,
      });
    }
    if (
      parsed.status !== "submitted" &&
      shouldUseJeddahDefaultCoords(parsed.latitude, parsed.longitude)
    ) {
      const defaults = jeddahDefaultCoords();
      const updated = { ...parsed, ...defaults };
      saveEngineeringSurveySubmission(updated);
      return updated;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveEngineeringSurveySubmission(
  submission: EngineeringSurveySubmission,
): void {
  if (typeof window === "undefined" || !submission.taskId) return;
  localStorage.setItem(
    storageKey(submission.taskId),
    JSON.stringify({
      ...submission,
      updatedAtUtc: new Date().toISOString(),
    }),
  );
  notifyChanged();
}

export function getOrCreateEngineeringSurveyDraft(input: {
  taskId: string;
  propertyId: string;
  poNumber: string;
}): EngineeringSurveySubmission {
  const existing = loadEngineeringSurveySubmission(input.taskId);
  if (existing) return existing;
  const draft = createEngineeringSurveyDraft(input);
  saveEngineeringSurveySubmission(draft);
  return draft;
}

export function updateEngineeringSurveyDraft(
  taskId: string,
  patch: Partial<
    Pick<
      EngineeringSurveySubmission,
      | "latitude"
      | "longitude"
      | "surveyReportFileName"
      | "siteLetterFileName"
      | "siteConfirmed"
      | "checklist"
      | "returnNote"
    >
  >,
): EngineeringSurveySubmission | null {
  const current = loadEngineeringSurveySubmission(taskId);
  if (!current || current.status === "submitted") return current;

  const next: EngineeringSurveySubmission = {
    ...current,
    ...patch,
    checklist: patch.checklist ?? current.checklist,
    status: current.status === "reopened" ? "reopened" : "draft",
    updatedAtUtc: new Date().toISOString(),
  };
  saveEngineeringSurveySubmission(next);
  return next;
}

export function submitEngineeringSurveySubmission(
  taskId: string,
): EngineeringSurveySubmission | null {
  const current = loadEngineeringSurveySubmission(taskId);
  if (!current || current.status === "submitted") return current;

  const next: EngineeringSurveySubmission = {
    ...current,
    status: "submitted",
    submittedAtUtc: new Date().toISOString(),
    updatedAtUtc: new Date().toISOString(),
  };
  saveEngineeringSurveySubmission(next);
  return next;
}

export function reopenEngineeringSurveySubmission(
  taskId: string,
  returnNote: string,
): EngineeringSurveySubmission | null {
  const current = loadEngineeringSurveySubmission(taskId);
  if (!current) return null;

  const next: EngineeringSurveySubmission = {
    ...current,
    status: "reopened",
    returnNote,
    updatedAtUtc: new Date().toISOString(),
  };
  saveEngineeringSurveySubmission(next);
  return next;
}

export function isVisibleInEngineeringSurveyQueue(
  taskId: string,
  taskStatus: string,
): boolean {
  if (taskStatus === "completed") return false;
  const sub = loadEngineeringSurveySubmission(taskId);
  return sub?.status !== "submitted";
}

export function patchChecklistRow(
  rows: EngineeringSurveyChecklistRow[],
  index: number,
  patch: Partial<EngineeringSurveyChecklistRow>,
): EngineeringSurveyChecklistRow[] {
  return rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
}

export function engineeringSurveyStatusLabel(
  status: EngineeringSurveySubmissionStatus,
): string {
  if (status === "submitted") return "مُرسَل";
  if (status === "reopened") return "مُعاد";
  return "قيد العمل";
}
