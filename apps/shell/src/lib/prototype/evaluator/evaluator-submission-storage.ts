import {
  createEvaluatorDraft,
  type EvaluatorChecklistAnswers,
  type EvaluatorSubmission,
  type EvaluatorSubmissionStatus,
} from "./evaluator-window-data";

const STORAGE_PREFIX = "evalEvaluatorSubmission:";

export const EVALUATOR_SUBMISSION_CHANGED_EVENT = "evaluator-submission-changed";

function notifyEvaluatorSubmissionChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVALUATOR_SUBMISSION_CHANGED_EVENT));
  }
}

function storageKey(taskId: string): string {
  return `${STORAGE_PREFIX}${taskId}`;
}

export function loadEvaluatorSubmission(
  taskId: string,
): EvaluatorSubmission | null {
  if (typeof window === "undefined" || !taskId) return null;
  try {
    const raw = localStorage.getItem(storageKey(taskId));
    if (!raw) return null;
    return JSON.parse(raw) as EvaluatorSubmission;
  } catch {
    return null;
  }
}

export function saveEvaluatorSubmission(submission: EvaluatorSubmission): void {
  if (typeof window === "undefined" || !submission.taskId) return;
  const next: EvaluatorSubmission = {
    ...submission,
    updatedAtUtc: new Date().toISOString(),
  };
  localStorage.setItem(storageKey(submission.taskId), JSON.stringify(next));
}

export function getOrCreateEvaluatorDraft(input: {
  taskId: string;
  propertyId: string;
  poNumber: string;
}): EvaluatorSubmission {
  const existing = loadEvaluatorSubmission(input.taskId);
  if (existing) return existing;
  const draft = createEvaluatorDraft(input);
  saveEvaluatorSubmission(draft);
  return draft;
}

export function updateEvaluatorDraft(
  taskId: string,
  patch: Partial<
    Pick<
      EvaluatorSubmission,
      "evaluatorPrice" | "evaluatorNotes" | "checklist" | "reportFileName"
    >
  >,
): EvaluatorSubmission | null {
  const current = loadEvaluatorSubmission(taskId);
  if (!current) return null;
  if (current.status === "submitted" || current.status === "completed") {
    return current;
  }
  const next: EvaluatorSubmission = {
    ...current,
    ...patch,
    checklist: patch.checklist
      ? { ...current.checklist, ...patch.checklist }
      : current.checklist,
    status:
      current.status === "reopened" ? "reopened" : ("draft" as const),
    updatedAtUtc: new Date().toISOString(),
  };
  saveEvaluatorSubmission(next);
  return next;
}

export function submitEvaluatorSubmission(
  taskId: string,
): EvaluatorSubmission | null {
  const current = loadEvaluatorSubmission(taskId);
  if (!current) return null;
  if (current.status === "submitted" || current.status === "completed") {
    return current;
  }
  const next: EvaluatorSubmission = {
    ...current,
    status: "submitted",
    submittedAtUtc: new Date().toISOString(),
    updatedAtUtc: new Date().toISOString(),
  };
  saveEvaluatorSubmission(next);
  notifyEvaluatorSubmissionChanged();
  return next;
}

export function reopenEvaluatorSubmission(
  taskId: string,
): EvaluatorSubmission | null {
  const current = loadEvaluatorSubmission(taskId);
  if (!current) return null;
  if (current.status !== "submitted" && current.status !== "completed") {
    return current;
  }
  const next: EvaluatorSubmission = {
    ...current,
    status: "reopened",
    updatedAtUtc: new Date().toISOString(),
  };
  saveEvaluatorSubmission(next);
  notifyEvaluatorSubmissionChanged();
  return next;
}

export function completeEvaluatorSubmission(
  taskId: string,
): EvaluatorSubmission | null {
  const current = loadEvaluatorSubmission(taskId);
  if (!current) return null;
  const next: EvaluatorSubmission = {
    ...current,
    status: "completed",
    updatedAtUtc: new Date().toISOString(),
  };
  saveEvaluatorSubmission(next);
  return next;
}

export function isVisibleInAppraiserQueue(
  taskId: string,
  taskStatus: string,
): boolean {
  if (taskStatus === "completed") return false;
  const sub = loadEvaluatorSubmission(taskId);
  if (sub?.status === "submitted") return false;
  return true;
}

export function isEvaluatorFormLocked(status: EvaluatorSubmissionStatus): boolean {
  return status === "submitted" || status === "completed";
}

