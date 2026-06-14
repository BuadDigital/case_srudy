import { getCachedPartySubmission } from "@platform/app-shared/prototype/party-submission-api";
import { persistPartySubmissionPayload } from "@platform/app-shared/prototype/party-submission-api";
import { ENGINEERING_SURVEY_SUBMISSION_CHANGED_EVENT } from "./engineering-survey-submission-storage";
import { loadEngineeringSurveySubmission } from "./engineering-survey-submission-storage";

export type CachedEngineeringSurveyFile = {
  fileName: string;
  mimeType: string;
  dataUrl?: string;
  sizeBytes?: number;
};

export type EngineeringSurveyDocField = "surveyReport" | "siteLetter";

const MAX_SURVEY_REPORT_BYTES = 20 * 1024 * 1024;
const MAX_SITE_LETTER_BYTES = 10 * 1024 * 1024;

const FIELD_META: Record<
  EngineeringSurveyDocField,
  {
    fileNameKey: "surveyReportFileName" | "siteLetterFileName";
    attachmentKey: "surveyReportAttachment" | "siteLetterAttachment";
    maxBytes: number;
    title: string;
  }
> = {
  surveyReport: {
    fileNameKey: "surveyReportFileName",
    attachmentKey: "surveyReportAttachment",
    maxBytes: MAX_SURVEY_REPORT_BYTES,
    title: "تقرير الرفع المساحي",
  },
  siteLetter: {
    fileNameKey: "siteLetterFileName",
    attachmentKey: "siteLetterAttachment",
    maxBytes: MAX_SITE_LETTER_BYTES,
    title: "خطاب إقرار صحة الموقع",
  },
};

function notifyChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ENGINEERING_SURVEY_SUBMISSION_CHANGED_EVENT));
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function attachmentFromPayload(
  payload: Record<string, unknown>,
  field: EngineeringSurveyDocField,
): CachedEngineeringSurveyFile | null {
  const { attachmentKey, fileNameKey } = FIELD_META[field];
  const raw = payload[attachmentKey];
  if (raw && typeof raw === "object" && "fileName" in raw) {
    const att = raw as CachedEngineeringSurveyFile;
    if (att.fileName?.trim()) return att;
  }
  const fileName = String(payload[fileNameKey] ?? "").trim();
  if (!fileName) return null;
  return { fileName, mimeType: "application/pdf" };
}

export function getEngineeringSurveyAttachment(
  taskId: string,
  field: EngineeringSurveyDocField,
): CachedEngineeringSurveyFile | null {
  if (!taskId) return null;
  const dto = getCachedPartySubmission(taskId);
  if (dto?.payload) {
    return attachmentFromPayload(dto.payload, field);
  }
  const sub = loadEngineeringSurveySubmission(taskId);
  if (!sub) return null;
  const fileName = sub[FIELD_META[field].fileNameKey].trim();
  if (!fileName) return null;
  return { fileName, mimeType: "application/pdf" };
}

export type EngineeringSurveyDocumentEntry = {
  id: string;
  field: EngineeringSurveyDocField;
  name: string;
  sub: string;
  attachment: CachedEngineeringSurveyFile;
};

export function listEngineeringSurveyDocuments(
  taskId: string | null | undefined,
): EngineeringSurveyDocumentEntry[] {
  if (!taskId) return [];
  const entries: EngineeringSurveyDocumentEntry[] = [];
  for (const field of ["surveyReport", "siteLetter"] as const) {
    const attachment = getEngineeringSurveyAttachment(taskId, field);
    if (!attachment?.fileName.trim()) continue;
    entries.push({
      id: `eng-${field}`,
      field,
      name: FIELD_META[field].title,
      sub: attachment.fileName.trim(),
      attachment,
    });
  }
  return entries;
}

export async function cacheEngineeringSurveyFile(
  taskId: string,
  field: EngineeringSurveyDocField,
  file: File,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!taskId) return { ok: false, error: "تعذّر حفظ الملف." };
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return { ok: false, error: "يُقبل ملف PDF فقط." };
  }

  const meta = FIELD_META[field];
  if (file.size > meta.maxBytes) {
    return {
      ok: false,
      error:
        field === "surveyReport"
          ? "الحجم الأقصى 20 ميجابايت."
          : "الحجم الأقصى 10 ميجابايت.",
    };
  }

  const current = loadEngineeringSurveySubmission(taskId);
  if (!current || current.status === "submitted") {
    return { ok: false, error: "لا يمكن تعديل الرفع بعد الإرسال." };
  }

  try {
    const dataUrl = await readAsDataUrl(file);
    const attachment: CachedEngineeringSurveyFile = {
      fileName: file.name,
      mimeType: file.type || "application/pdf",
      dataUrl,
      sizeBytes: file.size,
    };
    const dto = getCachedPartySubmission(taskId);
    const payload: Record<string, unknown> = {
      ...(dto?.payload ?? {}),
      ...current,
      [meta.fileNameKey]: file.name,
      [meta.attachmentKey]: attachment,
      updatedAtUtc: new Date().toISOString(),
    };
    const saved = await persistPartySubmissionPayload(taskId, payload);
    if (!saved) return { ok: false, error: "تعذّر حفظ الملف." };
    notifyChanged();
    return { ok: true };
  } catch {
    return { ok: false, error: "تعذّر قراءة الملف." };
  }
}

export async function clearEngineeringSurveyFile(
  taskId: string,
  field: EngineeringSurveyDocField,
): Promise<void> {
  if (!taskId) return;
  const current = loadEngineeringSurveySubmission(taskId);
  if (!current || current.status === "submitted") return;

  const meta = FIELD_META[field];
  const dto = getCachedPartySubmission(taskId);
  const payload: Record<string, unknown> = {
    ...(dto?.payload ?? {}),
    ...current,
    [meta.fileNameKey]: "",
    updatedAtUtc: new Date().toISOString(),
  };
  delete payload[meta.attachmentKey];
  await persistPartySubmissionPayload(taskId, payload);
  notifyChanged();
}

export function openEngineeringSurveyDocumentPreview(
  attachment: CachedEngineeringSurveyFile,
): void {
  if (!attachment.dataUrl) return;
  window.open(attachment.dataUrl, "_blank", "noopener,noreferrer");
}

export function downloadEngineeringSurveyDocument(
  attachment: CachedEngineeringSurveyFile,
): void {
  if (!attachment.dataUrl) return;
  const link = document.createElement("a");
  link.href = attachment.dataUrl;
  link.download = attachment.fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}
