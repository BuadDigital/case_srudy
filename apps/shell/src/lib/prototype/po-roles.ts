import type { RoleId } from "@platform/types";

export function canReceivePo(role: RoleId): boolean {
  return role === "section-supervisor";
}

export function canEditPoHeader(role: RoleId): boolean {
  return role === "section-supervisor";
}

export function canEditProperty(role: RoleId): boolean {
  return role === "case-specialist";
}

export function isPoViewOnly(role: RoleId): boolean {
  return role === "general-manager";
}

export function canManageCourts(role: RoleId): boolean {
  return role === "section-supervisor";
}

export function canDeletePo(role: RoleId): boolean {
  return role === "section-supervisor" || role === "case-specialist";
}
