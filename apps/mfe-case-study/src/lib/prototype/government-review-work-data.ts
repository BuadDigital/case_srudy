export type GovernmentReviewVisitStatus =
  | "completed"
  | "scheduled"
  | "blocked";

export type GovernmentReviewKeysStatus =
  | "received"
  | "pending"
  | "not_required";

export type GovernmentReviewSubmissionStatus = "draft" | "submitted";

export type GovernmentReviewSubmission = {
  taskId: string;
  propertyId: string;
  poNumber: string;
  visitStatus: GovernmentReviewVisitStatus | "";
  visitDate: string;
  courtName: string;
  keysStatus: GovernmentReviewKeysStatus | "";
  keysDescription: string;
  accessBlockReason: string;
  reviewNotes: string;
  confirmed: boolean;
  status: GovernmentReviewSubmissionStatus;
  submittedAtUtc: string | null;
  updatedAtUtc: string;
};

export function createGovernmentReviewDraft(input: {
  taskId: string;
  propertyId: string;
  poNumber: string;
  courtName?: string;
}): GovernmentReviewSubmission {
  const now = new Date().toISOString();
  return {
    taskId: input.taskId,
    propertyId: input.propertyId,
    poNumber: input.poNumber,
    visitStatus: "",
    visitDate: "",
    courtName: input.courtName?.trim() ?? "",
    keysStatus: "",
    keysDescription: "",
    accessBlockReason: "",
    reviewNotes: "",
    confirmed: false,
    status: "draft",
    submittedAtUtc: null,
    updatedAtUtc: now,
  };
}

export function isGovernmentReviewFormLocked(
  status: GovernmentReviewSubmissionStatus,
): boolean {
  return status === "submitted";
}

export function governmentReviewVisitStatusLabel(
  value: GovernmentReviewVisitStatus | "",
): string {
  if (value === "completed") return "تمت الزيارة";
  if (value === "scheduled") return "بانتظار الموعد";
  if (value === "blocked") return "تعذر الوصول";
  return "—";
}

export function governmentReviewKeysStatusLabel(
  value: GovernmentReviewKeysStatus | "",
): string {
  if (value === "received") return "تم استلام المفاتيح";
  if (value === "pending") return "لم تُسلَّم بعد";
  if (value === "not_required") return "غير مطلوبة";
  return "—";
}

export function governmentReviewStatusLabel(
  status: GovernmentReviewSubmissionStatus,
): string {
  if (status === "submitted") return "مُرسَل";
  return "قيد العمل";
}
