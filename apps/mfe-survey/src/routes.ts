import type { PageId } from "@platform/types";

/** Routes owned by @survey/mfe (/survey — not /active-survey party queue). */
export const SURVEY_MFE_PAGE_IDS: ReadonlySet<PageId> = new Set(["survey"]);

export function isSurveyMfePage(page: string): page is PageId {
  return SURVEY_MFE_PAGE_IDS.has(page as PageId);
}
