import type { CaseStudyFormAnswer } from "@case-study/mfe/lib/prototype/case-study-form-data";
import { todayIsoDate } from "@case-study/mfe/lib/prototype/case-study-form-data";
import type { CaseStudyFormDto } from "@platform/api-client";
import {
  getCaseStudyForm,
  getPartyCaseStudyForm,
  saveCaseStudyForm,
  savePartyCaseStudyForm,
} from "@platform/api-client";
import { workOrdersApiConfig } from "@case-study/mfe";

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

function dtoToDraft(dto: CaseStudyFormDto): CaseStudyFormDraft {
  return {
    version: 1,
    taskId: dto.taskId,
    propertyId: dto.propertyId,
    poNumber: dto.poNumber,
    status: dto.status as CaseStudyFormStatus,
    currentStep: dto.currentStep,
    requestNumber: dto.requestNumber,
    requestDate: dto.requestDate,
    deedNumber: dto.deedNumber,
    answers: dto.answers as Record<string, CaseStudyFormAnswer | null>,
    deedRemarks: dto.deedRemarks,
    surveyRemarks: dto.surveyRemarks,
    componentsRemarks: dto.componentsRemarks,
    occupancyRemarks: dto.occupancyRemarks,
    meterType: (dto.meterType || "") as CaseStudyMeterType,
    meterNumber: dto.meterNumber,
    hoaFee: dto.hoaFee,
    sigDeed: dto.sigDeed,
    sigApprover: dto.sigApprover,
    sigDate: dto.sigDate,
    specialistReviewApproved: dto.specialistReviewApproved,
    savedAtUtc: dto.savedAtUtc,
  };
}

function draftToDto(draft: CaseStudyFormDraft): CaseStudyFormDto {
  return {
    version: 1,
    taskId: draft.taskId,
    propertyId: draft.propertyId,
    poNumber: draft.poNumber,
    status: draft.status,
    currentStep: draft.currentStep,
    requestNumber: draft.requestNumber,
    requestDate: draft.requestDate,
    deedNumber: draft.deedNumber,
    answers: draft.answers,
    deedRemarks: draft.deedRemarks,
    surveyRemarks: draft.surveyRemarks,
    componentsRemarks: draft.componentsRemarks,
    occupancyRemarks: draft.occupancyRemarks,
    meterType: draft.meterType,
    meterNumber: draft.meterNumber,
    hoaFee: draft.hoaFee,
    sigDeed: draft.sigDeed,
    sigApprover: draft.sigApprover,
    sigDate: draft.sigDate,
    specialistReviewApproved: draft.specialistReviewApproved,
    savedAtUtc: draft.savedAtUtc,
  };
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

export async function loadCaseStudyFormDraft(
  taskId: string,
): Promise<CaseStudyFormDraft | null> {
  const config = workOrdersApiConfig();
  if (!config) return null;
  const result = await getCaseStudyForm(config, taskId);
  if (!result.ok) return null;
  return dtoToDraft(result.data);
}

export async function saveCaseStudyFormDraft(
  draft: CaseStudyFormDraft,
): Promise<CaseStudyFormDraft | null> {
  const config = workOrdersApiConfig();
  if (!config) return null;
  const payload = {
    ...draft,
    savedAtUtc: new Date().toISOString(),
  };
  const result = await saveCaseStudyForm(config, draft.taskId, draftToDto(payload));
  if (!result.ok) return null;
  return dtoToDraft(result.data);
}

export async function loadPartyCaseStudyFormDraft(
  childTaskId: string,
): Promise<CaseStudyFormDraft | null> {
  const config = workOrdersApiConfig();
  if (!config) return null;
  const result = await getPartyCaseStudyForm(config, childTaskId);
  if (!result.ok) return null;
  return dtoToDraft(result.data);
}

export async function savePartyCaseStudyFormDraft(
  draft: CaseStudyFormDraft,
): Promise<CaseStudyFormDraft | null> {
  const config = workOrdersApiConfig();
  if (!config) return null;
  const payload = {
    ...draft,
    savedAtUtc: new Date().toISOString(),
  };
  const result = await savePartyCaseStudyForm(
    config,
    draft.taskId,
    draftToDto(payload),
  );
  if (!result.ok) return null;
  return dtoToDraft(result.data);
}
