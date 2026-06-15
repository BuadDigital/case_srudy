import type { NavItem, PageId } from "@platform/types";

/** حقول النظام — فهرس حقول العقار */
export const SYSTEM_FIELDS_CATALOG_NAV_ITEM: NavItem = {
  id: "system-fields-catalog",
  label: "حقول النظام",
  icon: "M4 6h16M4 10h16M4 14h16M4 18h16",
  grp: null,
};

export const SYSTEM_FIELDS_CATALOG_PAGE_ID: PageId =
  SYSTEM_FIELDS_CATALOG_NAV_ITEM.id;

export function isSystemFieldsCatalogPage(page: PageId): boolean {
  return page === SYSTEM_FIELDS_CATALOG_PAGE_ID;
}
