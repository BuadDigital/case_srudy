import type { PageId } from "@platform/types";
import { SETTINGS_PAGE_IDS } from "@platform/app-shared/prototype/settings-nav";
import { SYSTEM_FIELDS_PAGE_IDS } from "@platform/app-shared/prototype/system-fields-nav";

/** Routes owned by @settings/mfe (الإعدادات + جميع حقول النظام). */
export const SETTINGS_MFE_PAGE_IDS: ReadonlySet<PageId> = new Set([
  ...SETTINGS_PAGE_IDS,
  ...SYSTEM_FIELDS_PAGE_IDS,
]);

export function isSettingsMfePage(page: string): page is PageId {
  return SETTINGS_MFE_PAGE_IDS.has(page as PageId);
}
