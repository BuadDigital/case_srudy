import type { RowMoreMenuItem } from "@case-study/mfe/components/ui/RowMoreMenu";
import { openInternalDelegationLetterPlaceholder } from "@case-study/mfe/lib/prototype/internal-delegation-letter-placeholder";
import {
  poPropertiesPath,
  poPropertyEditPath,
  poPropertyPath,
} from "../po-routes";
import type { WorkflowTask } from "./tasks-storage";

export function buildActiveQueueRowMoreItems(options: {
  task: WorkflowTask;
  propertyId?: string;
  openTask: () => void;
  router: { push: (href: string) => void };
}): RowMoreMenuItem[] {
  const po = options.task.poNumber.trim();
  const propertyId = options.propertyId?.trim();

  const items: RowMoreMenuItem[] = [
    {
      id: "open",
      label: "فتح المعاملة",
      onClick: options.openTask,
    },
    {
      id: "po-properties",
      label: "عقارات أمر العمل",
      onClick: () => options.router.push(poPropertiesPath(po)),
    },
    {
      id: "delegation-letter",
      label: "خطاب التفويض الداخلي",
      onClick: () =>
        openInternalDelegationLetterPlaceholder({
          poNumber: po,
          propertyId,
        }),
    },
  ];

  if (propertyId) {
    items.push(
      {
        id: "property-detail",
        label: "تفاصيل العقار",
        onClick: () => options.router.push(poPropertyPath(po, propertyId)),
      },
      {
        id: "property-edit",
        label: "تعديل العقار",
        onClick: () => options.router.push(poPropertyEditPath(po, propertyId)),
      },
    );
  }

  return items;
}
