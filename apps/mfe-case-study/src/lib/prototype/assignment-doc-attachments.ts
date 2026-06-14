/** Browser cache for property document uploads (prototype — filename also saved on API). */

export type PropertyDocKind = "decree" | "delegation" | "other";

const STORAGE_PREFIX: Record<PropertyDocKind, string> = {
  decree: "evalAssignmentDoc:",
  delegation: "evalDelegationDoc:",
  other: "evalOtherDoc:",
};
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export type CachedAssignmentDoc = {
  fileName: string;
  mimeType: string;
  dataUrl?: string;
};

function storageKey(
  kind: PropertyDocKind,
  poNumber: string,
  propertyId: string,
): string {
  return `${STORAGE_PREFIX[kind]}${poNumber.trim()}:${propertyId}`;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function writeCachedDoc(
  kind: PropertyDocKind,
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

  const key = storageKey(kind, poNumber, propertyId);
  try {
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    localStorage.setItem(
      key,
      JSON.stringify({ fileName: file.name, mimeType: payload.mimeType }),
    );
  }
}

export async function cacheAssignmentDoc(
  poNumber: string,
  propertyId: string,
  file: File,
): Promise<void> {
  return writeCachedDoc("decree", poNumber, propertyId, file);
}

export async function cacheDelegationDoc(
  poNumber: string,
  propertyId: string,
  file: File,
): Promise<void> {
  return writeCachedDoc("delegation", poNumber, propertyId, file);
}

function readCachedDoc(
  kind: PropertyDocKind,
  poNumber: string,
  propertyId: string,
): CachedAssignmentDoc | null {
  if (typeof window === "undefined" || !poNumber.trim() || !propertyId) return null;
  try {
    const raw = localStorage.getItem(storageKey(kind, poNumber, propertyId));
    if (!raw) return null;
    return JSON.parse(raw) as CachedAssignmentDoc;
  } catch {
    return null;
  }
}

export function getCachedAssignmentDoc(
  poNumber: string,
  propertyId: string,
): CachedAssignmentDoc | null {
  return readCachedDoc("decree", poNumber, propertyId);
}

export function getCachedDelegationDoc(
  poNumber: string,
  propertyId: string,
): CachedAssignmentDoc | null {
  return readCachedDoc("delegation", poNumber, propertyId);
}

export function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}
