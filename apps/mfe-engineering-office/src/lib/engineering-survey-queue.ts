import type { WorkflowTask } from "@case-study/mfe";
import {
  isVisibleInEngineeringSurveyQueue,
  loadEngineeringSurveySubmission,
} from "./engineering-survey-submission-storage";

export type EngineeringSurveyQueueStats = {
  total: number;
  inProgress: number;
  submitted: number;
  returned: number;
};

export function computeEngineeringSurveyStats(
  tasks: WorkflowTask[],
): EngineeringSurveyQueueStats {
  let inProgress = 0;
  let submitted = 0;
  let returned = 0;

  for (const task of tasks) {
    const sub = loadEngineeringSurveySubmission(task.id);
    if (sub?.status === "submitted") submitted += 1;
    else if (sub?.status === "reopened") returned += 1;
    else if (task.status !== "completed") inProgress += 1;
  }

  return {
    total: tasks.length,
    inProgress,
    submitted,
    returned,
  };
}

export function filterEngineeringSurveyListedTasks(
  tasks: WorkflowTask[],
): WorkflowTask[] {
  return tasks.filter(
    (t) =>
      t.kind === "engineering-survey" &&
      isVisibleInEngineeringSurveyQueue(t.id, t.status),
  );
}

export function engineeringSurveyTaskStatusBadge(
  taskId: string,
): { label: string; className: string } | null {
  const sub = loadEngineeringSurveySubmission(taskId);
  if (sub?.status === "submitted") {
    return { label: "مُرسَل للأخصائي", className: "b-new" };
  }
  if (sub?.status === "reopened") {
    return { label: "مُعاد للتصحيح", className: "b-returned" };
  }
  if (sub && sub.latitude && sub.surveyReportFileName) {
    return { label: "قيد التنفيذ", className: "b-prog" };
  }
  return { label: "جديدة", className: "b-new" };
}
