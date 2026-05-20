/** Browser cache for assignment-decree uploads (prototype — filename also saved on API). */

const STORAGE_PREFIX = "evalAssignmentDoc:";
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export type CachedAssignmentDoc = {
  fileName: string;
  mimeType: string;
  dataUrl?: string;
};

function storageKey(poNumber: string, propertyId: string): string {
  return `${STORAGE_PREFIX}${poNumber.trim()}:${propertyId}`;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function cacheAssignmentDoc(
  poNumber: string,
  propertyId: string,
  file: File,
): Promise<void> {
  if (typeof window === "undefined" || !poNumber.trim() || !propertyId) return;

  const payload: CachedAssignmentDoc = {
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
  };

  if (file.type.startsWith("image/") && file.size <= MAX_IMAGE_BYTES) {
    try {
      payload.dataUrl = await readAsDataUrl(file);
    } catch {
      /* keep metadata only */
    }
  }

  try {
    localStorage.setItem(storageKey(poNumber, propertyId), JSON.stringify(payload));
  } catch {
    /* quota — metadata only */
    localStorage.setItem(
      storageKey(poNumber, propertyId),
      JSON.stringify({ fileName: file.name, mimeType: payload.mimeType }),
    );
  }
}

export function getCachedAssignmentDoc(
  poNumber: string,
  propertyId: string,
): CachedAssignmentDoc | null {
  if (typeof window === "undefined" || !poNumber.trim() || !propertyId) return null;
  try {
    const raw = localStorage.getItem(storageKey(poNumber, propertyId));
    if (!raw) return null;
    return JSON.parse(raw) as CachedAssignmentDoc;
  } catch {
    return null;
  }
}

export function removeCachedAssignmentDoc(
  poNumber: string,
  propertyId: string,
): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey(poNumber, propertyId));
}

export function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}
