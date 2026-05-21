import {
  getApiBase,
  type CourtsApiConfig,
  type WorkOrdersApiConfig,
} from "@platform/api-client";
import { getAuthSession } from "@platform/auth-client";

export const WORK_ORDERS_CHANGED_EVENT = "work-orders-changed";

export function notifyWorkOrdersChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(WORK_ORDERS_CHANGED_EVENT));
  }
}

export function workOrdersApiConfig(): WorkOrdersApiConfig | null {
  const session = getAuthSession();
  if (!session?.token) return null;
  return { token: session.token, baseUrl: getApiBase() };
}

export function courtsApiConfig(): CourtsApiConfig | null {
  const session = getAuthSession();
  if (!session?.token) return null;
  return { token: session.token, baseUrl: getApiBase() };
}

/** First server validation message, if any. */
export function firstApiFieldError(
  errors?: Record<string, string>,
): string | undefined {
  if (!errors) return undefined;
  if (errors._?.trim()) return errors._;
  for (const value of Object.values(errors)) {
    if (value?.trim()) return value;
  }
  return undefined;
}

export function apiErrorMessage(
  kind: string,
  fallback = "تعذّر الاتصال بالخادم",
): string {
  if (kind === "auth") return "يجب تسجيل الدخول أولاً";
  if (kind === "network") return "تعذّر الاتصال بالخادم — تحقق من تشغيل API";
  if (kind === "validation") return "يرجى مراجعة الحقول المطلوبة";
  if (kind === "server") return "حدث خطأ في الخادم — حاول لاحقاً";
  if (kind === "not_found") return "لم يُعثر على أمر العمل";
  return fallback;
}

export function resolveApiError(
  kind: string,
  errors?: Record<string, string>,
  fallback?: string,
): string {
  return (
    firstApiFieldError(errors) ?? apiErrorMessage(kind, fallback)
  );
}
