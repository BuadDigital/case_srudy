import type { PageId } from "@platform/types";

/** Routes owned by @valuation/mfe. */
export const VALUATION_MFE_PAGE_IDS: ReadonlySet<PageId> = new Set([
  "valuation-requests",
]);

export function isValuationMfePage(page: string): page is PageId {
  return VALUATION_MFE_PAGE_IDS.has(page as PageId);
}
