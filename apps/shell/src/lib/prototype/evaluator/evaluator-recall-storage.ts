import { reopenEvaluatorSubmission } from "./evaluator-submission-storage";

export type EvaluatorRecallStatus = "pending" | "approved" | "rejected";

export type EvaluatorRecallRequest = {
  taskId: string;
  poNumber: string;
  propertyId: string;
  status: EvaluatorRecallStatus;
  reason: string;
  requestedAtUtc: string;
  resolvedAtUtc: string | null;
  specialistNote: string;
};

const STORAGE_KEY = "evalEvaluatorRecallRequests";

export const EVALUATOR_RECALL_CHANGED_EVENT = "evaluator-recall-changed";

function loadAll(): EvaluatorRecallRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EvaluatorRecallRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(items: EvaluatorRecallRequest[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function notifyEvaluatorRecallChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVALUATOR_RECALL_CHANGED_EVENT));
  }
}

export function getEvaluatorRecall(
  taskId: string,
): EvaluatorRecallRequest | null {
  return loadAll().find((r) => r.taskId === taskId) ?? null;
}

export function listEvaluatorRecalls(): EvaluatorRecallRequest[] {
  return loadAll();
}

export function listPendingEvaluatorRecalls(): EvaluatorRecallRequest[] {
  return loadAll().filter((r) => r.status === "pending");
}

export function recallStatusLabel(status: EvaluatorRecallStatus): string {
  if (status === "pending") return "بانتظار موافقة الأخصائي";
  if (status === "approved") return "وُوفّق على الاستدعاء";
  return "رُفض الاستدعاء";
}

export function requestEvaluatorRecall(input: {
  taskId: string;
  poNumber: string;
  propertyId: string;
  reason?: string;
}): EvaluatorRecallRequest | null {
  const existing = getEvaluatorRecall(input.taskId);
  if (existing?.status === "pending") return existing;

  const next: EvaluatorRecallRequest = {
    taskId: input.taskId,
    poNumber: input.poNumber.trim(),
    propertyId: input.propertyId,
    status: "pending",
    reason: input.reason?.trim() ?? "",
    requestedAtUtc: new Date().toISOString(),
    resolvedAtUtc: null,
    specialistNote: "",
  };

  const items = loadAll().filter((r) => r.taskId !== input.taskId);
  items.push(next);
  saveAll(items);
  notifyEvaluatorRecallChanged();
  return next;
}

export function approveEvaluatorRecall(taskId: string): EvaluatorRecallRequest | null {
  const items = loadAll();
  const idx = items.findIndex((r) => r.taskId === taskId);
  if (idx < 0) return null;

  const current = items[idx]!;
  if (current.status !== "pending") return current;

  const updated: EvaluatorRecallRequest = {
    ...current,
    status: "approved",
    resolvedAtUtc: new Date().toISOString(),
  };
  items[idx] = updated;
  saveAll(items);
  reopenEvaluatorSubmission(taskId);
  notifyEvaluatorRecallChanged();
  return updated;
}

export function rejectEvaluatorRecall(
  taskId: string,
  specialistNote?: string,
): EvaluatorRecallRequest | null {
  const items = loadAll();
  const idx = items.findIndex((r) => r.taskId === taskId);
  if (idx < 0) return null;

  const current = items[idx]!;
  if (current.status !== "pending") return current;

  const updated: EvaluatorRecallRequest = {
    ...current,
    status: "rejected",
    resolvedAtUtc: new Date().toISOString(),
    specialistNote: specialistNote?.trim() ?? "",
  };
  items[idx] = updated;
  saveAll(items);
  notifyEvaluatorRecallChanged();
  return updated;
}
