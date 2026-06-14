/** Badge class for PO assignment type labels on the dashboard. */
export function assignmentTypeBadgeClass(type: string): string {
  if (type === "تنفيذ") return "b-survey";
  if (type === "تركات") return "b-prog";
  if (type === "قطاع خاص") return "b-key";
  return "b-cancel";
}
