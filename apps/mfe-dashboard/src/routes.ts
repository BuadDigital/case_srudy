import type { PageId } from "@platform/types";

/** Routes owned by @dashboard/mfe. */
export const DASHBOARD_MFE_PAGE_IDS: ReadonlySet<PageId> = new Set(["dashboard"]);

export function isDashboardMfePage(page: string): page is PageId {
  return DASHBOARD_MFE_PAGE_IDS.has(page as PageId);
}
