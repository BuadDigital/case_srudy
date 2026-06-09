import type { PageId, RoleId } from "@platform/types";
import { ALL_PROTOTYPE_PAGES, ROLES } from "@platform/app-shared/prototype/constants";
import { SYSTEM_FIELDS_PAGE_IDS } from "@platform/app-shared/prototype/system-fields-nav";

/** سليمان (CDO) — super admin with full prototype access. */
export function isSuperAdmin(role: RoleId): boolean {
  return role === "cdo";
}

export function pagesForPrototypeRole(role: RoleId): PageId[] {
  const base = isSuperAdmin(role) ? ALL_PROTOTYPE_PAGES : ROLES[role].pages;
  return [...new Set<PageId>([...base, ...SYSTEM_FIELDS_PAGE_IDS])];
}
