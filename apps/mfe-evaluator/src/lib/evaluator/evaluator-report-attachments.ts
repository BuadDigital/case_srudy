import { getCachedPartySubmission } from "@platform/app-shared/prototype/party-submission-api";
import { MAX_EVALUATOR_PDF_BYTES } from "./evaluator-window-data";
import {
  loadEvaluatorSubmission,
  saveEvaluatorSubmission,
  type EvaluatorReportMetadata,
} from "./evaluator-submission-storage";

export type CachedEvaluatorReport = {
  fileName: string;
  mimeType: string;
  dataUrl?: string;
  sizeBytes?: number;
};

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function getCachedEvaluatorReport(
  taskId: string,
): CachedEvaluatorReport | null {
  if (typeof window === "undefined" || !taskId) return null;
  const dto = getCachedPartySubmission(taskId);
  if (!dto) return null;
  const attachment = dto.payload.reportAttachment as CachedEvaluatorReport | undefined;
  if (attachment?.fileName) return attachment;
  const metadata = dto.payload.reportMetadata as EvaluatorReportMetadata | undefined;
  if (metadata?.fileName) {
    return {
      fileName: metadata.fileName,
      mimeType: metadata.mimeType,
      sizeBytes: metadata.sizeBytes,
    };
  }
  const sub = loadEvaluatorSubmission(taskId);
  if (sub?.reportFileName) {
    return { fileName: sub.reportFileName, mimeType: "application/pdf" };
  }
  return null;
}

export async function cacheEvaluatorReport(
  taskId: string,
  file: File,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (typeof window === "undefined" || !taskId) {
    return { ok: false, error: "تعذّر حفظ الملف." };
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return { ok: false, error: "يُقبل ملف PDF فقط." };
  }
  if (file.size > MAX_EVALUATOR_PDF_BYTES) {
    return { ok: false, error: "الحجم الأقصى 20 ميجابايت." };
  }

  const current = loadEvaluatorSubmission(taskId);
  if (!current) {
    return { ok: false, error: "لا توجد مسودة تقييم." };
  }

  try {
    const dataUrl = await readAsDataUrl(file);
    const reportAttachment: CachedEvaluatorReport = {
      fileName: file.name,
      mimeType: file.type || "application/pdf",
      dataUrl,
      sizeBytes: file.size,
    };
    const reportMetadata: EvaluatorReportMetadata = {
      fileName: file.name,
      mimeType: file.type || "application/pdf",
      sizeBytes: file.size,
    };
    await saveEvaluatorSubmission(
      {
        ...current,
        reportFileName: file.name,
        reportAttachment,
      } as typeof current & { reportAttachment: CachedEvaluatorReport },
      reportMetadata,
    );
    return { ok: true };
  } catch {
    return { ok: false, error: "تعذّر قراءة الملف." };
  }
}

export async function clearCachedEvaluatorReport(taskId: string): Promise<void> {
  if (typeof window === "undefined" || !taskId) return;
  const current = loadEvaluatorSubmission(taskId);
  if (!current) return;
  await saveEvaluatorSubmission({ ...current, reportFileName: null });
}

export function openEvaluatorReportPreview(taskId: string): void {
  const cached = getCachedEvaluatorReport(taskId);
  if (!cached?.dataUrl) return;
  window.open(cached.dataUrl, "_blank", "noopener,noreferrer");
}
