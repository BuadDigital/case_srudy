"use client";
import { ActiveTransactionQueueView, type ActiveTransactionQueueConfig } from "@case-study/mfe";
import { PartyActiveTaskWorkPanel } from "@/components/views/PartyActiveTaskWorkPanel";
import { buildAppraiserQueueRowMoreItems } from "@/lib/prototype/evaluator/appraiser-queue-row-menu";
import { appraiserTaskStatusBadge, canAppraiserOpenTask, filterAppraiserListedTasks, } from "@/lib/prototype/evaluator/evaluator-queue"
import { EVALUATOR_RECALL_CHANGED_EVENT } from "@/lib/prototype/evaluator/evaluator-recall-storage";
import { EVALUATOR_SUBMISSION_CHANGED_EVENT } from "@/lib/prototype/evaluator/evaluator-submission-storage";
import { filterTasksForPartyKind } from "@platform/app-shared/prototype/party-task-pages";
import { partyTaskPageDef,type PartyTaskPageDef, } from "@platform/app-shared/prototype/party-task-pages";
import { partyTaskPath, partyTaskTaskPath } from "@case-study/mfe";
import type { PageId } from "@platform/types";
import type { PoIntakeRecord } from "@case-study/mfe/lib/prototype/po-intake-data";
import type { WorkflowTask } from "@case-study/mfe/lib/prototype/tasks-storage";

function queueConfig(def: PartyTaskPageDef): ActiveTransactionQueueConfig {

  const baseFilter = (

    mine: WorkflowTask[],

    poByNumber: Map<string, PoIntakeRecord>,

  ) => filterTasksForPartyKind(mine, def.kind);



  if (def.kind !== "property-appraisal") {

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

      filterListed: baseFilter,

    };

  }



  return {

    pageTitle: def.pageTitle,

    emptyLine: def.emptyLine,

    emptyHint:

      "استعرض أمر العمل وعقاراته من قائمة ⋮ — للمعاملات المُرسَلة اختر «استدعاء المعاملة» (يحتاج موافقة الأخصائي).",

    panelId: `${def.pageId}-panel`,

    tableHint:

      "⋮ — عقارات أمر العمل · تفاصيل العقار · استدعاء المعاملة (للمُرسَلة للأخصائي).",

    partyAssignee: true,

    assigneeRole: def.roleId,

    statusColumnLabel: "الحالة",

    getBasePath: () => partyTaskPath(def.pageId),

    getTaskPath: (taskId) => partyTaskTaskPath(def.pageId, taskId),

    filterListed: (mine, poByNumber) =>

      filterAppraiserListedTasks(baseFilter(mine, poByNumber)),

    buildRowMoreItems: (ctx) => buildAppraiserQueueRowMoreItems(ctx),

    canOpenTask: (task) => canAppraiserOpenTask(task.id, task.status),

    getTaskStatusBadge: (task) => appraiserTaskStatusBadge(task.id),

    refreshOnWindowEvents: [
      EVALUATOR_RECALL_CHANGED_EVENT,
      EVALUATOR_SUBMISSION_CHANGED_EVENT,
    ],

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

        <PartyActiveTaskWorkPanel
          key={task.id}
          def={def}
          task={task}
          onRefreshAction={onRefresh}
          layout="panel"
          onCloseAction={onClose}
        />

      )}

    />

  );

}


