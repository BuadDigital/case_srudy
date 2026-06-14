export type ValuationCoordinationPriority = "normal" | "urgent";

export type ValuationCoordinationSubmissionStatus = "draft" | "submitted";

export type ValuationCoordinationSubmission = {
  taskId: string;
  propertyId: string;
  poNumber: string;
  receiptConfirmed: boolean;
  receiptDate: string;
  inspectorName: string;
  appraiserName: string;
  priority: ValuationCoordinationPriority;
  coordinationNotes: string;
  inspectorInstructions: string;
  appraiserInstructions: string;
  status: ValuationCoordinationSubmissionStatus;
  submittedAtUtc: string | null;
  updatedAtUtc: string;
};

export function createValuationCoordinationDraft(input: {
  taskId: string;
  propertyId: string;
  poNumber: string;
  inspectorName?: string;
  appraiserName?: string;
}): ValuationCoordinationSubmission {
  const now = new Date().toISOString();
  return {
    taskId: input.taskId,
    propertyId: input.propertyId,
    poNumber: input.poNumber,
    receiptConfirmed: false,
    receiptDate: now.slice(0, 10),
    inspectorName: input.inspectorName?.trim() ?? "",
    appraiserName: input.appraiserName?.trim() ?? "",
    priority: "normal",
    coordinationNotes: "",
    inspectorInstructions: "",
    appraiserInstructions: "",
    status: "draft",
    submittedAtUtc: null,
    updatedAtUtc: now,
  };
}

export function isValuationCoordinationFormLocked(
  status: ValuationCoordinationSubmissionStatus,
): boolean {
  return status === "submitted";
}

export function valuationCoordinationPriorityLabel(
  value: ValuationCoordinationPriority,
): string {
  return value === "urgent" ? "عاجلة" : "عادية";
}

export function valuationCoordinationStatusLabel(
  status: ValuationCoordinationSubmissionStatus,
): string {
  if (status === "submitted") return "مُستلَم";
  return "قيد التنسيق";
}
