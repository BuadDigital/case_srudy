import type { PageId } from "@platform/types";

/** Routes owned by @financial/mfe. */
export const FINANCIAL_MFE_PAGE_IDS: ReadonlySet<PageId> = new Set(["financial"]);

export function isFinancialMfePage(page: string): page is PageId {
  return FINANCIAL_MFE_PAGE_IDS.has(page as PageId);
}
