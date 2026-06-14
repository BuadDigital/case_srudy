import type { WorkflowTask } from "@case-study/mfe";

export function findSurveyChildForParent(
  parentTaskId: string,
  propertyId: string,
  tasks: WorkflowTask[],
): WorkflowTask | null {
  return (
    tasks.find(
      (t) =>
        t.parentTaskId === parentTaskId &&
        t.propertyId === propertyId &&
        t.kind === "engineering-survey",
    ) ?? null
  );
}
