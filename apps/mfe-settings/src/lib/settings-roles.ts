import type { RoleId } from "@platform/types";
import { isSuperAdmin } from "@platform/app-shared/prototype/prototype-role-access";

export function canManageCourts(role: RoleId): boolean {
  return isSuperAdmin(role) || role === "section-supervisor";
}
