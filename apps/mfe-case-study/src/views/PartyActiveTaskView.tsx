"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ActiveTransactionQueueView, type ActiveTransactionQueueConfig } from "./ActiveTransactionQueueView";
import { PartyActiveTaskWorkPanel } from "./PartyActiveTaskWorkPanel";
import { filterTasksForPartyKind } from "@platform/app-shared/prototype/party-task-pages";
import {
  partyTaskPageDef,
  type PartyTaskPageDef,
} from "@platform/app-shared/prototype/party-task-pages";
import {
  activeSurveyWorkspacePath,
  decodeTaskParam,
  partyTaskPath,
  partyTaskTaskPath,
} from "../lib/my-task-routes";
import type { PageId } from "@platform/types";
import type { PoIntakeRecord } from "../lib/prototype/po-intake-data";
import type { WorkflowTask } from "../lib/prototype/tasks-storage";
import type { PartyAppraisalExtensions } from "../lib/party-appraisal-extensions";
import type { PartyEngineeringSurveyExtensions } from "../lib/party-engineering-survey-extensions";

function queueConfig(
  def: PartyTaskPageDef,
  appraisalExtensions?: PartyAppraisalExtensions,
  engineeringSurveyExtensions?: PartyEngineeringSurveyExtensions,
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

  if (def.kind === "property-appraisal" && appraisalExtensions) {
    return appraisalExtensions.patchQueueConfig(base, def);
  }

  if (def.kind === "engineering-survey" && engineeringSurveyExtensions) {
    return engineeringSurveyExtensions.patchQueueConfig(base, def);
  }

  return base;
}

export function PartyActiveTaskView({
  pageId,
  appraisalExtensions,
  engineeringSurveyExtensions,
}: {
  pageId: PageId;
  appraisalExtensions?: PartyAppraisalExtensions;
  engineeringSurveyExtensions?: PartyEngineeringSurveyExtensions;
}) {
  const def = partyTaskPageDef(pageId);
  const router = useRouter();
  const searchParams = useSearchParams();
  const legacyTask = searchParams.get("task");

  useEffect(() => {
    if (def?.kind !== "engineering-survey" || !legacyTask) return;
    router.replace(activeSurveyWorkspacePath(decodeTaskParam(legacyTask)));
  }, [def?.kind, legacyTask, router]);

  if (def?.kind === "engineering-survey" && legacyTask) {
    return (
      <p className="po-properties-loading">جاري فتح مهمة الرفع المساحي…</p>
    );
  }

  if (!def) {
    return (
      <p className="po-properties-loading">صفحة المهمة غير معرّفة.</p>
    );
  }

  const config = queueConfig(
    def,
    appraisalExtensions,
    engineeringSurveyExtensions,
  );

  const useFullPage = Boolean(config.fullPageTaskPath);

  return (
    <ActiveTransactionQueueView
      config={config}
      renderPanel={
        useFullPage
          ? undefined
          : ({ task, onRefresh, onClose }) => (
              <PartyActiveTaskWorkPanel
                key={task.id}
                def={def}
                task={task}
                onRefreshAction={onRefresh}
                layout="panel"
                onCloseAction={onClose}
                appraisalExtensions={appraisalExtensions}
                engineeringSurveyExtensions={engineeringSurveyExtensions}
              />
            )
      }
    />
  );
}
