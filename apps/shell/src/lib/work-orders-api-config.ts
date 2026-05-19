import type { CourtsApiConfig, WorkOrdersApiConfig } from "@platform/api-client";
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
  return { token: session.token };
}

export function courtsApiConfig(): CourtsApiConfig | null {
  const session = getAuthSession();
  if (!session?.token) return null;
  return { token: session.token };
}

export function apiErrorMessage(
  kind: string,
  fallback = "تعذّر الاتصال بالخادم",
): string {
  if (kind === "auth") return "يجب تسجيل الدخول أولاً";
  if (kind === "network") return "تعذّر الاتصال بالخادم — تحقق من تشغيل API";
  return fallback;
}
