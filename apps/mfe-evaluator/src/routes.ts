import type { PageId } from "@platform/types";

/** Routes owned by @evaluator/mfe (party queue via shell host). */
export const EVALUATOR_MFE_PAGE_IDS: ReadonlySet<PageId> = new Set([
  "property-appraisal",
]);

export function isEvaluatorMfePage(page: string): page is PageId {
  return EVALUATOR_MFE_PAGE_IDS.has(page as PageId);
}
