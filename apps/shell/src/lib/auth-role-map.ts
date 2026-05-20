import type { RoleId } from "@platform/types";
import { STORAGE_ROLE_KEY } from "@/lib/prototype/constants";

/** Maps seeded org login emails to prototype navigation role. */
const EMAIL_TO_ROLE: Record<string, RoleId> = {
  "s.salhy@gmail.com": "cdo",
};

export function prototypeRoleForEmail(email: string): RoleId | null {
  const key = email.trim().toLowerCase();
  return EMAIL_TO_ROLE[key] ?? null;
}

export function applyPrototypeRoleForEmail(email: string): void {
  const role = prototypeRoleForEmail(email);
  if (role && typeof window !== "undefined") {
    sessionStorage.setItem(STORAGE_ROLE_KEY, role);
  }
}
