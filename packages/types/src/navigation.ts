/** Shell navigation contract — shared when splitting MFE remotes later. */
export type PageId =
  | "dashboard"
  | "po"
  | "properties"
  | "assignment"
  | "survey"
  | "keys"
  | "failures"
  | "valuation-requests"
  | "field-form"
  | "messages"
  | "financial"
  | "kpi"
  | "users"
  | "courts";

export type RoleId =
  | "general-manager"
  | "section-supervisor"
  | "operations-coordinator"
  | "case-specialist"
  | "report-preparer"
  | "court-delegate"
  | "valuation-coordinator"
  | "real-estate-appraiser"
  | "field-inspector"
  | "financial-officer";

export type NavItem = {
  id: PageId;
  label: string;
  icon: string;
  grp: string | null;
  badge?: string;
};

export type RoleDef = {
  name: string;
  dept: string;
  init: string;
  bg: string;
  tc: string;
  pages: PageId[];
};

export function isPageId(value: string): value is PageId {
  return (
    value === "dashboard" ||
    value === "po" ||
    value === "properties" ||
    value === "assignment" ||
    value === "survey" ||
    value === "keys" ||
    value === "failures" ||
    value === "valuation-requests" ||
    value === "field-form" ||
    value === "messages" ||
    value === "financial" ||
    value === "kpi" ||
    value === "users" ||
    value === "courts"
  );
}
