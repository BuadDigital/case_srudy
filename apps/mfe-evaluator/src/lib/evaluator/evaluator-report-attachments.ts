import { MAX_EVALUATOR_PDF_BYTES } from "./evaluator-window-data";

export type CachedEvaluatorReport = {
  fileName: string;
  mimeType: string;
  dataUrl?: string;
};

const STORAGE_PREFIX = "evalEvaluatorReport:";

function storageKey(taskId: string): string {
  return `${STORAGE_PREFIX}${taskId}`;
}

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
  try {
    const raw = localStorage.getItem(storageKey(taskId));
    if (!raw) return null;
    return JSON.parse(raw) as CachedEvaluatorReport;
  } catch {
    return null;
  }
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

  const payload: CachedEvaluatorReport = {
    fileName: file.name,
    mimeType: file.type || "application/pdf",
  };

  try {
    payload.dataUrl = await readAsDataUrl(file);
    localStorage.setItem(storageKey(taskId), JSON.stringify(payload));
    return { ok: true };
  } catch {
    return { ok: false, error: "تعذّر قراءة الملف." };
  }
}

export function clearCachedEvaluatorReport(taskId: string): void {
  if (typeof window === "undefined" || !taskId) return;
  localStorage.removeItem(storageKey(taskId));
}

export function openEvaluatorReportPreview(taskId: string): void {
  const cached = getCachedEvaluatorReport(taskId);
  if (!cached?.dataUrl) return;
  window.open(cached.dataUrl, "_blank", "noopener,noreferrer");
}
