import type { PageId } from "@platform/types";
import {
  isBourseInquiryIdentifier,
  type PoIntakeRecord,
} from "@/lib/prototype/po-intake-data";
import { findPropertyForTask } from "@/lib/prototype/my-task-row";
import type { WorkflowTask } from "@/lib/prototype/tasks-storage";

/** عناصر الشريط الجانبي — المعاملات النشطة */
export type ActiveTransactionNavItem = {
  id: PageId;
  label: string;
  icon: string;
  available: boolean;
  /** Placeholder route — shown in red in the sidebar until implemented */
  placeholder?: boolean;
};

export const ACTIVE_TRANSACTIONS_NAV: ActiveTransactionNavItem[] = [
  {
    id: "active-primary-data",
    label: "البيانات الأولية",
    icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
    available: true,
  },
  {
    id: "bourse-inquiry",
    label: "استعلام بورصة",
    icon: "M3 3h18v18H3zM7 7h10v4H7zM7 13h6v4H7z",
    available: true,
  },
  {
    id: "active-distribution",
    label: "توزيع المعاملات",
    icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
    available: true,
    placeholder: true,
  },
  {
    id: "active-case-study",
    label: "دراسة حالة العقار",
    icon: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
    available: true,
    placeholder: true,
  },
];

export function isActiveTransactionPlaceholder(page: PageId): boolean {
  return ACTIVE_TRANSACTIONS_NAV.some((n) => n.id === page && n.placeholder);
}

export const ACTIVE_TRANSACTIONS_GROUP = "المعاملات النشطة";

/** أيقونة مجموعة المعاملات النشطة في الشريط الجانبي */
export const ACTIVE_TRANSACTIONS_GROUP_ICON =
  "M22 12h-4l-3 9L9 3l-3 9H2";

export function isInActiveTransactionsSection(
  page: PageId,
  onTaskWork: boolean,
): boolean {
  return onTaskWork || isActiveTransactionPage(page);
}

export function activeTransactionPages(): PageId[] {
  return ACTIVE_TRANSACTIONS_NAV.map((n) => n.id);
}

export function isActiveTransactionPage(page: PageId): boolean {
  return activeTransactionPages().includes(page);
}

export function taskMatchesPrimaryData(task: WorkflowTask): boolean {
  if (task.kind !== "case-study-property") return false;
  return task.phase === "enfath";
}

export function taskMatchesBourseInquiry(
  task: WorkflowTask,
  record: PoIntakeRecord | undefined,
): boolean {
  if (task.kind !== "case-study-property") return false;
  const property = findPropertyForTask(record, task);
  if (property && isBourseInquiryIdentifier(property.identifierType)) {
    return task.phase === "bourse" || task.phase === "enfath";
  }
  return task.phase === "bourse";
}

export function filterTasksForPrimaryData(
  tasks: WorkflowTask[],
  poByNumber: Map<string, PoIntakeRecord>,
): WorkflowTask[] {
  return tasks.filter((t) => taskMatchesPrimaryData(t));
}

export function filterTasksForBourseInquiry(
  tasks: WorkflowTask[],
  poByNumber: Map<string, PoIntakeRecord>,
): WorkflowTask[] {
  return tasks.filter((t) =>
    taskMatchesBourseInquiry(t, poByNumber.get(t.poNumber.trim())),
  );
}
