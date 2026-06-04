"use client";

import {
  ActiveTransactionQueueView,
  type ActiveTransactionQueueConfig,
} from "@/components/views/ActiveTransactionQueueView";
import { CaseStudyTaskWork } from "@/components/views/MyTaskWorkView";
import {
  activeDistributionPath,
  distributionTaskPath,
} from "@/lib/my-task-routes";
import { filterTasksForDistribution } from "@/lib/prototype/active-transactions";

const DISTRIBUTION_QUEUE: ActiveTransactionQueueConfig = {
  pageTitle: "توزيع المعاملات",
  tableLayout: "distribution",
  emptyLine: "لا توجد معاملات بانتظار التوزيع.",
  emptyHint:
    "تظهر هنا بعد إكمال استعلام البورصة — المدينة والحي ونوع العقار من بيانات الصك.",
  panelId: "distribution-panel",
  getBasePath: activeDistributionPath,
  getTaskPath: distributionTaskPath,
  filterListed: (mine) => filterTasksForDistribution(mine),
};

export function ActiveDistributionView() {
  return (
    <ActiveTransactionQueueView
      config={DISTRIBUTION_QUEUE}
      renderPanel={({ task, onRefresh, onClose }) => (
        <CaseStudyTaskWork
          key={task.id}
          task={task}
          onRefresh={onRefresh}
          layout="panel"
          onClose={onClose}
        />
      )}
    />
  );
}
