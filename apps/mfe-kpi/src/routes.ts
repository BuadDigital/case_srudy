import type { PageId } from "@platform/types";

/** Routes owned by @kpi/mfe. */
export const KPI_MFE_PAGE_IDS: ReadonlySet<PageId> = new Set(["kpi"]);

export function isKpiMfePage(page: string): page is PageId {
  return KPI_MFE_PAGE_IDS.has(page as PageId);
}
