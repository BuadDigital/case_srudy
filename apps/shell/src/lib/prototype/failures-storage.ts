import {
  findPropertyInRecord,
  updatePropertyInPo,
} from "@/lib/prototype/po-intake-storage";
import { escalateTaskForObstruction } from "@/lib/prototype/tasks-storage";

const FAILURES_KEY = "evalFailureRecords";

export type FailureStatus = "internal" | "review" | "approved" | "returned";

export type FailureRecord = {
  id: string;
  poNumber: string;
  propertyId: string;
  deedNumber: string;
  title: string;
  internalNote: string;
  finalNote: string;
  status: FailureStatus;
  specialist: string;
  createdAt: string;
  updatedAt: string;
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `f-${Date.now()}`;
}

export function loadFailures(): FailureRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAILURES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FailureRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFailures(list: FailureRecord[]): void {
  localStorage.setItem(FAILURES_KEY, JSON.stringify(list));
}

function patchPropertyDeedStatus(
  poNumber: string,
  propertyId: string,
  deedStatus: string,
): void {
  void (async () => {
    const found = await findPropertyInRecord(poNumber, propertyId);
    if (!found) return;
    await updatePropertyInPo(poNumber, propertyId, {
      ...found.property,
      deedStatus,
    });
  })();
}

export function createFailure(input: {
  poNumber: string;
  propertyId: string;
  deedNumber: string;
  title: string;
  internalNote: string;
  specialist: string;
}): FailureRecord {
  const now = new Date().toISOString();
  const record: FailureRecord = {
    id: newId(),
    poNumber: input.poNumber,
    propertyId: input.propertyId,
    deedNumber: input.deedNumber,
    title: input.title.trim(),
    internalNote: input.internalNote.trim(),
    finalNote: "",
    status: "internal",
    specialist: input.specialist,
    createdAt: now,
    updatedAt: now,
  };
  const list = loadFailures();
  saveFailures([record, ...list]);
  patchPropertyDeedStatus(input.poNumber, input.propertyId, "قيد التحقق");
  escalateTaskForObstruction(
    input.poNumber,
    input.propertyId,
    input.title.trim() || input.internalNote.trim(),
  );
  return record;
}

export function submitFailureForReview(id: string): FailureRecord | null {
  const list = loadFailures();
  const idx = list.findIndex((f) => f.id === id);
  if (idx < 0 || list[idx].status !== "internal") return null;
  const next = {
    ...list[idx],
    status: "review" as const,
    updatedAt: new Date().toISOString(),
  };
  list[idx] = next;
  saveFailures(list);
  return next;
}

export function approveFailure(id: string, finalNote: string): FailureRecord | null {
  const list = loadFailures();
  const idx = list.findIndex((f) => f.id === id);
  if (idx < 0 || list[idx].status !== "review") return null;
  const item = list[idx];
  const next: FailureRecord = {
    ...item,
    status: "approved",
    finalNote: finalNote.trim(),
    updatedAt: new Date().toISOString(),
  };
  list[idx] = next;
  saveFailures(list);
  patchPropertyDeedStatus(item.poNumber, item.propertyId, "موقوف");
  return next;
}

export function returnFailure(id: string, finalNote: string): FailureRecord | null {
  const list = loadFailures();
  const idx = list.findIndex((f) => f.id === id);
  if (idx < 0 || list[idx].status !== "review") return null;
  const item = list[idx];
  const next: FailureRecord = {
    ...item,
    status: "returned",
    finalNote: finalNote.trim(),
    updatedAt: new Date().toISOString(),
  };
  list[idx] = next;
  saveFailures(list);
  patchPropertyDeedStatus(item.poNumber, item.propertyId, "فعال");
  return next;
}

export function deleteFailuresForPo(poNumber: string): void {
  const n = poNumber.trim();
  const next = loadFailures().filter((f) => f.poNumber.trim() !== n);
  saveFailures(next);
}

export function getPropertyFailure(
  poNumber: string,
  propertyId: string,
): FailureRecord | null {
  return (
    loadFailures().find(
      (f) => f.poNumber === poNumber && f.propertyId === propertyId,
    ) ?? null
  );
}

export function failureStatusLabel(status: FailureStatus): string {
  if (status === "internal") return "مسودة داخلية";
  if (status === "review") return "قيد المراجعة";
  if (status === "approved") return "معتمد";
  return "معاد للأخصائي";
}
