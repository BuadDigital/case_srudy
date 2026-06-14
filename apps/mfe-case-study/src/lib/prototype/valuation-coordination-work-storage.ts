import {
  createValuationCoordinationDraft,
  type ValuationCoordinationSubmission,
} from "./valuation-coordination-work-data";

const STORAGE_PREFIX = "evalValuationCoordinationSubmission:";

export const VALUATION_COORDINATION_SUBMISSION_CHANGED_EVENT =
  "valuation-coordination-submission-changed";

function notifyChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new Event(VALUATION_COORDINATION_SUBMISSION_CHANGED_EVENT),
    );
  }
}

function storageKey(taskId: string): string {
  return `${STORAGE_PREFIX}${taskId}`;
}

export function loadValuationCoordinationSubmission(
  taskId: string,
): ValuationCoordinationSubmission | null {
  if (typeof window === "undefined" || !taskId) return null;
  try {
    const raw = localStorage.getItem(storageKey(taskId));
    if (!raw) return null;
    return JSON.parse(raw) as ValuationCoordinationSubmission;
  } catch {
    return null;
  }
}

export function saveValuationCoordinationSubmission(
  submission: ValuationCoordinationSubmission,
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

export function getOrCreateValuationCoordinationDraft(input: {
  taskId: string;
  propertyId: string;
  poNumber: string;
  inspectorName?: string;
  appraiserName?: string;
}): ValuationCoordinationSubmission {
  const existing = loadValuationCoordinationSubmission(input.taskId);
  if (existing) return existing;
  const draft = createValuationCoordinationDraft(input);
  saveValuationCoordinationSubmission(draft);
  return draft;
}

export function updateValuationCoordinationDraft(
  taskId: string,
  patch: Partial<
    Pick<
      ValuationCoordinationSubmission,
      | "receiptConfirmed"
      | "receiptDate"
      | "priority"
      | "coordinationNotes"
      | "inspectorInstructions"
      | "appraiserInstructions"
    >
  >,
): ValuationCoordinationSubmission | null {
  const current = loadValuationCoordinationSubmission(taskId);
  if (!current || current.status === "submitted") return current;

  const next: ValuationCoordinationSubmission = {
    ...current,
    ...patch,
    status: "draft",
    updatedAtUtc: new Date().toISOString(),
  };
  saveValuationCoordinationSubmission(next);
  return next;
}

export function submitValuationCoordinationSubmission(
  taskId: string,
): ValuationCoordinationSubmission | null {
  const current = loadValuationCoordinationSubmission(taskId);
  if (!current || current.status === "submitted") return current;

  const next: ValuationCoordinationSubmission = {
    ...current,
    status: "submitted",
    submittedAtUtc: new Date().toISOString(),
    updatedAtUtc: new Date().toISOString(),
  };
  saveValuationCoordinationSubmission(next);
  return next;
}
