import type { RoleId } from "@platform/types";
import { ROLES, STORAGE_ROLE_KEY } from "@/lib/prototype/constants";
import { DISTRIBUTION_PARTY_ACCOUNTS } from "@/lib/prototype/distribution-party-accounts";

/**
 * Maps seeded login emails to prototype sidebar roles.
 * Identity roles on the API (HrAdmin, ProcAdmin, …) are separate.
 */
const EMAIL_TO_PROTOTYPE_ROLE: Record<string, RoleId> = {
  "admin@local.dev": "general-manager",
  "s.salhy@gmail.com": "cdo",
  "a.alamin@gmail.com": "hr-admin",
  "a.alqadri@gmail.com": "proc-admin",
  "g.abdo@gmail.com": "crm-admin",
  "salam@ejadah.dev": "general-manager",
  "abdulrahman@ejadah.dev": "section-supervisor",
  "osama@ejadah.dev": "case-specialist",
  "eman@ejadah.dev": "financial-officer",
};

for (const account of DISTRIBUTION_PARTY_ACCOUNTS) {
  EMAIL_TO_PROTOTYPE_ROLE[account.email.trim().toLowerCase()] = account.roleId;
}

const DEFAULT_PROTOTYPE_ROLE: RoleId = "general-manager";

function isPrototypeRole(value: string): value is RoleId {
  return value in ROLES;
}

/** Resolve shell navigation role for a login email. */
export function prototypeRoleForEmail(email: string): RoleId {
  const key = email.trim().toLowerCase();
  const mapped = EMAIL_TO_PROTOTYPE_ROLE[key];
  if (mapped && isPrototypeRole(mapped)) return mapped;
  return DEFAULT_PROTOTYPE_ROLE;
}

/** Persist prototype role after successful login (client only). */
export function applyPrototypeRoleForEmail(email: string): void {
  if (typeof window === "undefined") return;
  const role = prototypeRoleForEmail(email);
  if (!isPrototypeRole(role)) return;
  sessionStorage.setItem(STORAGE_ROLE_KEY, role);
}
