"use client";

import { ActiveTransactionQueueView, type ActiveTransactionQueueConfig } from "./ActiveTransactionQueueView";
import { PartyActiveTaskWorkPanel } from "./PartyActiveTaskWorkPanel";
import { filterTasksForPartyKind } from "@platform/app-shared/prototype/party-task-pages";
import {
  partyTaskPageDef,
  type PartyTaskPageDef,
} from "@platform/app-shared/prototype/party-task-pages";
import { partyTaskPath, partyTaskTaskPath } from "../lib/my-task-routes";
import type { PageId } from "@platform/types";
import type { PoIntakeRecord } from "../lib/prototype/po-intake-data";
import type { WorkflowTask } from "../lib/prototype/tasks-storage";
import type { PartyAppraisalExtensions } from "../lib/party-appraisal-extensions";

function queueConfig(
  def: PartyTaskPageDef,
  appraisalExtensions?: PartyAppraisalExtensions,
): ActiveTransactionQueueConfig {
  const baseFilter = (
    mine: WorkflowTask[],
    poByNumber: Map<string, PoIntakeRecord>,
  ) => filterTasksForPartyKind(mine, def.kind);

  const base: ActiveTransactionQueueConfig = {
    pageTitle: def.pageTitle,
    emptyLine: def.emptyLine,
    emptyHint: def.emptyHint,
    panelId: `${def.pageId}-panel`,
    tableHint: def.tableHint,
    partyAssignee: true,
    assigneeRole: def.roleId,
    getBasePath: () => partyTaskPath(def.pageId),
    getTaskPath: (taskId) => partyTaskTaskPath(def.pageId, taskId),
    filterListed: baseFilter,
  };

  if (def.kind !== "property-appraisal" || !appraisalExtensions) {
    return base;
  }

  return appraisalExtensions.patchQueueConfig(base, def);
}

export function PartyActiveTaskView({
  pageId,
  appraisalExtensions,
}: {
  pageId: PageId;
  appraisalExtensions?: PartyAppraisalExtensions;
}) {
  const def = partyTaskPageDef(pageId);

  if (!def) {
    return (
      <p className="po-properties-loading">صفحة المهمة غير معرّفة.</p>
    );
  }

  const config = queueConfig(def, appraisalExtensions);

  return (
    <ActiveTransactionQueueView
      config={config}
      renderPanel={({ task, onRefresh, onClose }) => (
        <PartyActiveTaskWorkPanel
          key={task.id}
          def={def}
          task={task}
          onRefreshAction={onRefresh}
          layout="panel"
          onCloseAction={onClose}
          appraisalExtensions={appraisalExtensions}
        />
      )}
    />
  );
}
