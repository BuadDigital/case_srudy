import {
  createGovernmentReviewDraft,
  type GovernmentReviewSubmission,
} from "./government-review-work-data";

const STORAGE_PREFIX = "evalGovernmentReviewSubmission:";

export const GOVERNMENT_REVIEW_SUBMISSION_CHANGED_EVENT =
  "government-review-submission-changed";

function notifyChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(GOVERNMENT_REVIEW_SUBMISSION_CHANGED_EVENT));
  }
}

function storageKey(taskId: string): string {
  return `${STORAGE_PREFIX}${taskId}`;
}

export function loadGovernmentReviewSubmission(
  taskId: string,
): GovernmentReviewSubmission | null {
  if (typeof window === "undefined" || !taskId) return null;
  try {
    const raw = localStorage.getItem(storageKey(taskId));
    if (!raw) return null;
    return JSON.parse(raw) as GovernmentReviewSubmission;
  } catch {
    return null;
  }
}

export function saveGovernmentReviewSubmission(
  submission: GovernmentReviewSubmission,
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

export function getOrCreateGovernmentReviewDraft(input: {
  taskId: string;
  propertyId: string;
  poNumber: string;
  courtName?: string;
}): GovernmentReviewSubmission {
  const existing = loadGovernmentReviewSubmission(input.taskId);
  if (existing) return existing;
  const draft = createGovernmentReviewDraft(input);
  saveGovernmentReviewSubmission(draft);
  return draft;
}

export function updateGovernmentReviewDraft(
  taskId: string,
  patch: Partial<
    Pick<
      GovernmentReviewSubmission,
      | "visitStatus"
      | "visitDate"
      | "courtName"
      | "keysStatus"
      | "keysDescription"
      | "accessBlockReason"
      | "reviewNotes"
      | "confirmed"
    >
  >,
): GovernmentReviewSubmission | null {
  const current = loadGovernmentReviewSubmission(taskId);
  if (!current || current.status === "submitted") return current;

  const next: GovernmentReviewSubmission = {
    ...current,
    ...patch,
    status: "draft",
    updatedAtUtc: new Date().toISOString(),
  };
  saveGovernmentReviewSubmission(next);
  return next;
}

export function submitGovernmentReviewSubmission(
  taskId: string,
): GovernmentReviewSubmission | null {
  const current = loadGovernmentReviewSubmission(taskId);
  if (!current || current.status === "submitted") return current;

  const next: GovernmentReviewSubmission = {
    ...current,
    status: "submitted",
    submittedAtUtc: new Date().toISOString(),
    updatedAtUtc: new Date().toISOString(),
  };
  saveGovernmentReviewSubmission(next);
  return next;
}
