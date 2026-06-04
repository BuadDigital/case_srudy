"use client";

import {
  ActiveTransactionQueueView,
  type ActiveTransactionQueueConfig,
} from "@/components/views/ActiveTransactionQueueView";
import { PartyActiveTaskWork } from "@/components/views/PartyActiveTaskWork";
import { filterTasksForPartyKind } from "@/lib/prototype/party-task-pages";
import {
  partyTaskPageDef,
  type PartyTaskPageDef,
} from "@/lib/prototype/party-task-pages";
import { partyTaskPath, partyTaskTaskPath } from "@/lib/my-task-routes";
import type { PageId } from "@platform/types";

function queueConfig(def: PartyTaskPageDef): ActiveTransactionQueueConfig {
  return {
    pageTitle: def.pageTitle,
    emptyLine: def.emptyLine,
    emptyHint: def.emptyHint,
    panelId: `${def.pageId}-panel`,
    tableHint: def.tableHint,
    partyAssignee: true,
    assigneeRole: def.roleId,
    getBasePath: () => partyTaskPath(def.pageId),
    getTaskPath: (taskId) => partyTaskTaskPath(def.pageId, taskId),
    filterListed: (mine) => filterTasksForPartyKind(mine, def.kind),
  };
}

export function PartyActiveTaskView({ pageId }: { pageId: PageId }) {
  const def = partyTaskPageDef(pageId);
  if (!def) {
    return (
      <p className="po-properties-loading">صفحة المهمة غير معرّفة.</p>
    );
  }

  const config = queueConfig(def);

  return (
    <ActiveTransactionQueueView
      config={config}
      renderPanel={({ task, onRefresh, onClose }) => (
        <PartyActiveTaskWork
          key={task.id}
          def={def}
          task={task}
          onRefresh={onRefresh}
          layout="panel"
          onClose={onClose}
        />
      )}
    />
  );
}
