import { resetSystemData } from "@platform/api-client";
import { TASKS_CHANGED_EVENT, TASKS_STORAGE_KEY } from "@/lib/prototype/tasks-storage";
import { STORAGE_ROLE_KEY } from "@/lib/prototype/constants";
import {
  notifyWorkOrdersChanged,
  workOrdersApiConfig,
} from "@/lib/work-orders-api-config";

const EVAL_STORAGE_PREFIX = "eval";

/** Wipe every prototype key from browser storage (local + session). */
export function clearAllEvalBrowserStorage(): void {
  if (typeof window === "undefined") return;

  const localKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(EVAL_STORAGE_PREFIX)) localKeys.push(key);
  }
  for (const key of localKeys) localStorage.removeItem(key);

  const sessionKeys: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key?.startsWith(EVAL_STORAGE_PREFIX)) sessionKeys.push(key);
  }
  for (const key of sessionKeys) sessionStorage.removeItem(key);

  window.dispatchEvent(new Event(TASKS_CHANGED_EVENT));
  notifyWorkOrdersChanged();
}

export type ClearAllSystemDataResult = {
  apiReset: boolean;
  workOrdersDeleted: number;
  workflowTasksDeleted: number;
  caseStudyFormsDeleted: number;
  courtCatalogEntriesDeleted: number;
  registeredUsersDeleted: number;
  localStorageCleared: boolean;
  errors: string[];
};

/** Delete all operational data on the API and clear all eval* browser storage. */
export async function clearAllSystemData(): Promise<ClearAllSystemDataResult> {
  const errors: string[] = [];
  let apiReset = false;
  let workOrdersDeleted = 0;
  let workflowTasksDeleted = 0;
  let caseStudyFormsDeleted = 0;
  let courtCatalogEntriesDeleted = 0;
  let registeredUsersDeleted = 0;

  const config = workOrdersApiConfig();
  if (config) {
    const result = await resetSystemData(config);
    if (result.ok) {
      apiReset = true;
      workOrdersDeleted = result.data.workOrdersDeleted;
      workflowTasksDeleted = result.data.workflowTasksDeleted;
      caseStudyFormsDeleted = result.data.caseStudyFormsDeleted;
      courtCatalogEntriesDeleted = result.data.courtCatalogEntriesDeleted;
      registeredUsersDeleted = result.data.registeredUsersDeleted;
    } else if (result.kind === "not_found") {
      errors.push(
        "مسح الخادم غير متاح — أعد تشغيل API بعد dotnet build (النقطة DELETE /api/system/data غير موجودة أو البيئة ليست Development)",
      );
    } else if (result.kind === "auth") {
      errors.push("لا يوجد جلسة صالحة — سجّل الدخول من جديد");
    } else if (result.kind === "forbidden") {
      errors.push(
        "صلاحية غير كافية على الخادم — سجّل الدخول بـ s.salhy@gmail.com (CDO) أو admin@local.dev، وليس بحساب تجريبي آخر مع تبديل الدور من القائمة فقط",
      );
    } else if (result.kind === "server") {
      errors.push(
        result.detail
          ? `خطأ في الخادم (${result.status ?? "?"}): ${result.detail}`
          : `خطأ في الخادم (${result.status ?? "server"}) — أعد تشغيل API: npm run dev:api`,
      );
    } else {
      errors.push(`تعذّر مسح الخادم (${result.kind})`);
    }
  } else {
    errors.push("لا يوجد جلسة — تم مسح التخزين المحلي فقط");
  }

  clearAllEvalBrowserStorage();

  return {
    apiReset,
    workOrdersDeleted,
    workflowTasksDeleted,
    caseStudyFormsDeleted,
    courtCatalogEntriesDeleted,
    registeredUsersDeleted,
    localStorageCleared: typeof window !== "undefined",
    errors,
  };
}

/** @deprecated Use clearAllSystemData */
export const clearAllPoData = clearAllSystemData;

/** @deprecated Use clearAllEvalBrowserStorage */
export const clearPoLocalStorage = clearAllEvalBrowserStorage;

export { TASKS_STORAGE_KEY, STORAGE_ROLE_KEY };
