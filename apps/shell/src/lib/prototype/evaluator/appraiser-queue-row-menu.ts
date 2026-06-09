import type { RowMoreMenuItem } from "@case-study/mfe/components/ui/RowMoreMenu";
import {
  poPropertiesPath,
  poPropertyPath,
} from "@case-study/mfe/lib/po-routes";
import type { WorkflowTask } from "@case-study/mfe/lib/prototype/tasks-storage";
import { buildAppraiserRecallMenuItems } from "@/lib/prototype/evaluator/appraiser-recall-menu-items";
import { loadEvaluatorSubmission } from "@/lib/prototype/evaluator/evaluator-submission-storage";

export function buildAppraiserQueueRowMoreItems(options: {
  task: WorkflowTask;
  propertyId?: string;
  openTask: () => void;
  router: { push: (href: string) => void };
  refreshQueue: () => void;
}): RowMoreMenuItem[] {
  const po = options.task.poNumber.trim();
  const propertyId = options.propertyId?.trim();
  const submission = loadEvaluatorSubmission(options.task.id);
  const isSubmitted = submission?.status === "submitted";

  const items: RowMoreMenuItem[] = [];

  if (!isSubmitted) {
    items.push({
      id: "open",
      label: "فتح المعاملة",
      onClick: options.openTask,
    });
  }

  if (po) {
    items.push({
      id: "po-properties",
      label: "عقارات أمر العمل",
      onClick: () => options.router.push(poPropertiesPath(po)),
    });
  }

  if (po && propertyId) {
    items.push({
      id: "property-detail",
      label: "تفاصيل العقار",
      onClick: () => options.router.push(poPropertyPath(po, propertyId)),
    });
  }

  if (isSubmitted) {
    items.push(...buildAppraiserRecallMenuItems(options.task, options.refreshQueue));
  }

  return items;
}
