import type { FailureRecord } from "./failures-types";
import { isActiveFailureStatus } from "./failures-types";

function propertyKey(poNumber: string, propertyId: string): string {
  return `${poNumber.trim()}|${propertyId.trim()}`;
}

let listCache: FailureRecord[] = [];

export function getCachedFailuresList(): FailureRecord[] {
  return listCache;
}

export function setCachedFailuresList(list: FailureRecord[]): void {
  listCache = list;
}

export function getCachedPropertyFailure(
  poNumber: string,
  propertyId: string,
): FailureRecord | null {
  const key = propertyKey(poNumber, propertyId);
  return (
    listCache.find(
      (f) =>
        propertyKey(f.poNumber, f.propertyId) === key &&
        isActiveFailureStatus(f.status),
    ) ?? null
  );
}

export function upsertCachedFailure(record: FailureRecord): void {
  const idx = listCache.findIndex((f) => f.id === record.id);
  if (idx >= 0) {
    listCache = [
      ...listCache.slice(0, idx),
      record,
      ...listCache.slice(idx + 1),
    ];
    return;
  }
  listCache = [record, ...listCache];
}

export function removeCachedFailuresForPo(poNumber: string): void {
  const n = poNumber.trim();
  listCache = listCache.filter((f) => f.poNumber.trim() !== n);
}
