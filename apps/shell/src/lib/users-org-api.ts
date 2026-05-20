import { fetchOrganizationOverview } from "@platform/api-client";
import type { OrganizationOverview } from "@platform/types";
import { getAuthSession } from "@platform/auth-client";

export type FetchOrganizationResult = {
  overview: OrganizationOverview | null;
  loadError: string | null;
};

export async function fetchOrganization(): Promise<FetchOrganizationResult> {
  const session = getAuthSession();
  if (!session?.token) {
    return { overview: null, loadError: null };
  }

  const result = await fetchOrganizationOverview({ token: session.token });
  if (!result.ok) {
    const message =
      result.kind === "network"
        ? "تعذر تحميل هيكل الإدارات. تحقق من أن الخادم يعمل."
        : "تعذر تحميل هيكل الإدارات.";
    return { overview: null, loadError: message };
  }

  return { overview: result.overview, loadError: null };
}
