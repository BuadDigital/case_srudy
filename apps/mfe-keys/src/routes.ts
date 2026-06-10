import type { PageId } from "@platform/types";

/** Routes owned by @keys/mfe. */
export const KEYS_MFE_PAGE_IDS: ReadonlySet<PageId> = new Set(["keys"]);

export function isKeysMfePage(page: string): page is PageId {
  return KEYS_MFE_PAGE_IDS.has(page as PageId);
}
