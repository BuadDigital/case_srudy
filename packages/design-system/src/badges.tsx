/** Mirrors `sb()` in system_prototype_4.html */
const STATUS_MAP: Record<
  string,
  readonly [string, "b-new" | "b-prog" | "b-done" | "b-fail" | "b-cancel"]
> = {
  new: ["جديد", "b-new"],
  progress: ["قيد التنفيذ", "b-prog"],
  done: ["مكتمل", "b-done"],
  fail: ["متعذر", "b-fail"],
  review: ["قيد المراجعة", "b-prog"],
  approved: ["معتمد", "b-done"],
  pending: ["معلّق", "b-new"],
};

export function StatusBadge({ status }: { status: string }) {
  const [label, cls] = STATUS_MAP[status] ?? ["—", "b-cancel"];
  return <span className={`badge ${cls}`}>{label}</span>;
}

/** Mirrors `tb()` in system_prototype_4.html — مراحل مسار العقار (رفع / تقييم / دراسة). */
const WORKFLOW_MAP: Record<
  string,
  readonly [string, "b-new" | "b-prog" | "b-done" | "b-fail" | "b-cancel"]
> = {
  new: ["لم يبدأ", "b-cancel"],
  progress: ["جارٍ", "b-prog"],
  done: ["مكتمل", "b-done"],
  fail: ["متعذر", "b-fail"],
};

export function WorkflowStageBadge({ stage }: { stage: string }) {
  const [label, cls] = WORKFLOW_MAP[stage] ?? ["—", "b-cancel"];
  return <span className={`badge ${cls}`}>{label}</span>;
}
