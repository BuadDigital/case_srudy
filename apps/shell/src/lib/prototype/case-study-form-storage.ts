import type { CaseStudyFormAnswer } from "@/lib/prototype/case-study-form-data";
import { todayIsoDate } from "@/lib/prototype/case-study-form-data";

export type CaseStudyFormStatus = "new" | "draft" | "submitted";

export type CaseStudyMeterType = "" | "electronic" | "analog" | "none";

export type CaseStudyFormDraft = {
  version: 1;
  taskId: string;
  propertyId?: string;
  poNumber?: string;
  status: CaseStudyFormStatus;
  currentStep: number;
  requestNumber: string;
  requestDate: string;
  deedNumber: string;
  answers: Record<string, CaseStudyFormAnswer | null>;
  deedRemarks: string;
  surveyRemarks: string;
  componentsRemarks: string;
  occupancyRemarks: string;
  meterType: CaseStudyMeterType;
  meterNumber: string;
  hoaFee: string;
  sigDeed: string;
  sigApprover: string;
  sigDate: string;
  /** اعتماد الأخصائي بعد مراجعة إجابات الأطراف — questionKey → true */
  specialistReviewApproved?: Record<string, boolean>;
  savedAtUtc?: string;
};

function storageKey(taskId: string): string {
  return `evalCaseStudyForm:${taskId}`;
}

function partyStorageKey(childTaskId: string): string {
  return `evalCaseStudyFormParty:${childTaskId}`;
}

export function emptyCaseStudyFormDraft(
  taskId: string,
  seed?: Partial<
    Pick<
      CaseStudyFormDraft,
      | "requestNumber"
      | "requestDate"
      | "deedNumber"
      | "propertyId"
      | "poNumber"
      | "sigDeed"
    >
  >,
): CaseStudyFormDraft {
  const today = todayIsoDate();
  return {
    version: 1,
    taskId,
    propertyId: seed?.propertyId,
    poNumber: seed?.poNumber,
    status: "new",
    currentStep: 0,
    requestNumber: seed?.requestNumber ?? "",
    requestDate: seed?.requestDate ?? today,
    deedNumber: seed?.deedNumber ?? "",
    answers: {},
    deedRemarks: "",
    surveyRemarks: "",
    componentsRemarks: "",
    occupancyRemarks: "",
    meterType: "",
    meterNumber: "",
    hoaFee: "",
    sigDeed: seed?.sigDeed ?? seed?.deedNumber ?? "",
    sigApprover: "",
    sigDate: today,
    specialistReviewApproved: {},
  };
}

export function loadCaseStudyFormDraft(taskId: string): CaseStudyFormDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(taskId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CaseStudyFormDraft;
    if (parsed?.version !== 1 || parsed.taskId !== taskId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCaseStudyFormDraft(draft: CaseStudyFormDraft): void {
  if (typeof window === "undefined") return;
  const payload: CaseStudyFormDraft = {
    ...draft,
    savedAtUtc: new Date().toISOString(),
  };
  localStorage.setItem(storageKey(payload.taskId), JSON.stringify(payload));
}

export function loadPartyCaseStudyFormDraft(
  childTaskId: string,
): CaseStudyFormDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(partyStorageKey(childTaskId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CaseStudyFormDraft;
    if (parsed?.version !== 1 || parsed.taskId !== childTaskId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePartyCaseStudyFormDraft(draft: CaseStudyFormDraft): void {
  if (typeof window === "undefined") return;
  const payload: CaseStudyFormDraft = {
    ...draft,
    savedAtUtc: new Date().toISOString(),
  };
  localStorage.setItem(
    partyStorageKey(payload.taskId),
    JSON.stringify(payload),
  );
}
