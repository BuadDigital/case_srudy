import type { PageId, RoleId } from "@platform/types";
import { ALL_PROTOTYPE_PAGES, ROLES } from "@/lib/prototype/constants";

/** سليمان (CDO) — super admin with full prototype access. */
export function isSuperAdmin(role: RoleId): boolean {
  return role === "cdo";
}

export function pagesForPrototypeRole(role: RoleId): PageId[] {
  if (isSuperAdmin(role)) return ALL_PROTOTYPE_PAGES;
  return ROLES[role].pages;
}
