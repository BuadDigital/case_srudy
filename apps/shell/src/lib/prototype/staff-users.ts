import type { StaffUser } from "@/lib/prototype/constants";

/** @deprecated Users are loaded from the API — see `@/lib/users-api`. */
export function loadStaffUsers(): StaffUser[] {
  return [];
}

/** @deprecated */
export function saveStaffUsers(): void {
  // no-op — persisted via API
}

/** @deprecated */
export function getStaffRoleOptions(): string[] {
  return [];
}
