import type { BadgeTone } from "@platform/design-system";

/** Badge tone for PO assignment type labels on the dashboard. */
export function assignmentTypeBadgeTone(type: string): BadgeTone {
  if (type === "تنفيذ") return "purple";
  if (type === "تركات") return "warning";
  if (type === "قطاع خاص") return "orange";
  return "default";
}
