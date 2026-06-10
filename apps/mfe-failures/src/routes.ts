import type { PageId } from "@platform/types";

/** Routes owned by @failures/mfe. */
export const FAILURES_MFE_PAGE_IDS: ReadonlySet<PageId> = new Set([
  "failures",
  "failure-types",
]);

export function isFailuresMfePage(page: string): page is PageId {
  return FAILURES_MFE_PAGE_IDS.has(page as PageId);
}
