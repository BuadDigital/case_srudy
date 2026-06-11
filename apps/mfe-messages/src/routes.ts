import type { PageId } from "@platform/types";

/** Routes owned by @messages/mfe. */
export const MESSAGES_MFE_PAGE_IDS: ReadonlySet<PageId> = new Set(["messages"]);

export function isMessagesMfePage(page: string): page is PageId {
  return MESSAGES_MFE_PAGE_IDS.has(page as PageId);
}
