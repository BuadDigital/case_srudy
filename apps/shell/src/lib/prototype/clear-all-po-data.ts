import { listWorkOrders, deleteWorkOrder } from "@platform/api-client";
import { TASKS_STORAGE_KEY, notifyTasksChanged } from "@/lib/prototype/tasks-storage";
import {
  notifyWorkOrdersChanged,
  workOrdersApiConfig,
} from "@/lib/work-orders-api-config";

const PO_DRAFT_KEY = "evalPoIntakeDraft";
const FAILURES_KEY = "evalFailureRecords";

const PO_DOC_PREFIXES = [
  "evalAssignmentDoc:",
  "evalDelegationDoc:",
  "evalOtherDoc:",
] as const;

/** Wipe all PO-related keys from browser localStorage (tasks, failures, draft, doc cache). */
export function clearPoLocalStorage(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(TASKS_STORAGE_KEY);
  localStorage.removeItem(PO_DRAFT_KEY);
  localStorage.removeItem(FAILURES_KEY);

  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (PO_DOC_PREFIXES.some((p) => key.startsWith(p))) toRemove.push(key);
  }
  for (const key of toRemove) localStorage.removeItem(key);

  notifyTasksChanged();
  notifyWorkOrdersChanged();
}

export type ClearAllPoDataResult = {
  deletedFromApi: number;
  localStorageCleared: boolean;
  errors: string[];
};

/** Delete every work order on the API and clear all PO client storage. */
export async function clearAllPoData(): Promise<ClearAllPoDataResult> {
  const errors: string[] = [];
  let deletedFromApi = 0;

  const config = workOrdersApiConfig();
  if (config) {
    const list = await listWorkOrders(config);
    if (list.ok) {
      for (const item of list.data) {
        const po = item.poNumber?.trim();
        if (!po) continue;
        const result = await deleteWorkOrder(config, po);
        if (result.ok) deletedFromApi += 1;
        else errors.push(`${po}: ${result.message ?? result.kind}`);
      }
    } else {
      errors.push(list.message ?? `تعذّر جلب القائمة (${list.kind})`);
    }
  } else {
    errors.push("لا يوجد جلسة — تم مسح التخزين المحلي فقط");
  }

  clearPoLocalStorage();

  return {
    deletedFromApi,
    localStorageCleared: typeof window !== "undefined",
    errors,
  };
}
