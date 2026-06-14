import { notifyTasksChanged } from "./tasks-storage";
import {
  fetchPartySubmission,
  getCachedPartySubmission,
  payloadFromDto,
  persistPartySubmissionPayload,
  prefetchPartySubmissionsForTasks,
  setCachedPartySubmission,
  submitPartySubmission,
} from "@platform/app-shared/prototype/party-submission-api";
import {
  createGovernmentReviewDraft,
  type GovernmentReviewSubmission,
} from "./government-review-work-data";

export const GOVERNMENT_REVIEW_SUBMISSION_CHANGED_EVENT =
  "government-review-submission-changed";

function notifyChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(GOVERNMENT_REVIEW_SUBMISSION_CHANGED_EVENT));
  }
}

function dtoToSubmission(
  dto: ReturnType<typeof getCachedPartySubmission>,
): GovernmentReviewSubmission | null {
  if (!dto) return null;
  const payload = payloadFromDto<GovernmentReviewSubmission>(dto);
  return {
    ...payload,
    taskId: dto.taskId,
    propertyId: payload.propertyId ?? dto.propertyId ?? "",
    poNumber: payload.poNumber ?? dto.poNumber ?? "",
    status: payload.status ?? (dto.status as GovernmentReviewSubmission["status"]),
    submittedAtUtc: dto.submittedAtUtc ?? payload.submittedAtUtc ?? null,
    updatedAtUtc: dto.updatedAtUtc ?? payload.updatedAtUtc,
  };
}

export function loadGovernmentReviewSubmission(
  taskId: string,
): GovernmentReviewSubmission | null {
  return dtoToSubmission(getCachedPartySubmission(taskId));
}

export async function fetchGovernmentReviewSubmission(
  taskId: string,
): Promise<GovernmentReviewSubmission | null> {
  const dto = await fetchPartySubmission(taskId);
  return dtoToSubmission(dto);
}

export async function saveGovernmentReviewSubmission(
  submission: GovernmentReviewSubmission,
): Promise<GovernmentReviewSubmission | null> {
  if (!submission.taskId) return null;
  const payload = {
    ...submission,
    updatedAtUtc: new Date().toISOString(),
  };
  const dto = await persistPartySubmissionPayload(submission.taskId, payload);
  if (!dto) return null;
  notifyChanged();
  return dtoToSubmission(dto);
}

export async function getOrCreateGovernmentReviewDraft(input: {
  taskId: string;
  propertyId: string;
  poNumber: string;
  courtName?: string;
}): Promise<GovernmentReviewSubmission> {
  const existing = await fetchGovernmentReviewSubmission(input.taskId);
  if (existing) return existing;
  const draft = createGovernmentReviewDraft(input);
  const saved = await saveGovernmentReviewSubmission(draft);
  return saved ?? draft;
}

export async function updateGovernmentReviewDraft(
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
): Promise<GovernmentReviewSubmission | null> {
  const current = loadGovernmentReviewSubmission(taskId);
  if (!current || current.status === "submitted") return current;

  const next: GovernmentReviewSubmission = {
    ...current,
    ...patch,
    status: "draft",
    updatedAtUtc: new Date().toISOString(),
  };
  return saveGovernmentReviewSubmission(next);
}

export async function submitGovernmentReviewSubmission(
  taskId: string,
): Promise<GovernmentReviewSubmission | null> {
  const current = loadGovernmentReviewSubmission(taskId);
  if (!current || current.status === "submitted") return current;

  await saveGovernmentReviewSubmission({
    ...current,
    status: "draft",
    updatedAtUtc: new Date().toISOString(),
  });

  const dto = await submitPartySubmission(taskId);
  if (!dto) return loadGovernmentReviewSubmission(taskId);
  notifyChanged();
  notifyTasksChanged();
  return dtoToSubmission(dto);
}

export async function prefetchGovernmentReviewSubmissions(
  taskIds: string[],
): Promise<void> {
  await prefetchPartySubmissionsForTasks(taskIds);
}

export function seedGovernmentReviewSubmissionCache(
  submission: GovernmentReviewSubmission,
): void {
  setCachedPartySubmission(
    {
      taskId: submission.taskId,
      kind: "government-review",
      status: submission.status,
      propertyId: submission.propertyId,
      poNumber: submission.poNumber,
      payload: { ...submission },
      submittedAtUtc: submission.submittedAtUtc ?? undefined,
      updatedAtUtc: submission.updatedAtUtc,
    },
    submission.taskId,
  );
}
