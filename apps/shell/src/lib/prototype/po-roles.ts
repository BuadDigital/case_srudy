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

export function isCaseStudySpecialist(role: RoleId): boolean {
  return role === "case-specialist";
}

/** عرض تفاصيل عبر زر العين — ليس لأخصائي دراسة الحالة (يفتح من الصف أو التعديل). */
export function canViewPoEye(role: RoleId): boolean {
  return !isCaseStudySpecialist(role);
}

export function isPoViewOnly(role: RoleId): boolean {
  return role === "general-manager";
}

export function canManageCourts(role: RoleId): boolean {
  return role === "section-supervisor";
}

export function canDeletePo(role: RoleId): boolean {
  return role === "section-supervisor";
}

export function canDeleteProperty(role: RoleId): boolean {
  return role === "section-supervisor";
}
