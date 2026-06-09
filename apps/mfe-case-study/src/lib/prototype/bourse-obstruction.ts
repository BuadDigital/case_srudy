import { reportBourseObstructionToSupervisor } from "@case-study/mfe/lib/prototype/failures-storage";
import type { BourseDeedVitality } from "./po-intake-data";

export function validateBourseObstructionReason(
  vitality: BourseDeedVitality | null,
  reason: string,
): string | null {
  if (vitality !== "inactive") return null;
  if (!reason.trim()) return "يرجى توضيح سبب التعذر قبل الإرسال للمشرف.";
  return null;
}

export function submitBourseObstruction(input: {
  poNumber: string;
  propertyId: string;
  deedNumber: string;
  reason: string;
  specialist: string;
}): void {
  reportBourseObstructionToSupervisor(input);
}
