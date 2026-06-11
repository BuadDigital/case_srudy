"use client";

import type { PartyAppraisalExtensions } from "@case-study/mfe";
import type { PoIntakeRecord } from "@case-study/mfe";
import type { WorkflowTask } from "@case-study/mfe";
import { AppraiserUploadTab } from "../components/evaluator/AppraiserUploadTab";
import { buildAppraiserQueueRowMoreItems } from "../lib/evaluator/appraiser-queue-row-menu";
import {
  appraiserTaskStatusBadge,
  canAppraiserOpenTask,
  filterAppraiserListedTasks,
} from "../lib/evaluator/evaluator-queue";
import { EVALUATOR_RECALL_CHANGED_EVENT } from "../lib/evaluator/evaluator-recall-storage";
import {
  EVALUATOR_SUBMISSION_CHANGED_EVENT,
  isEvaluatorFormLocked,
  loadEvaluatorSubmission,
} from "../lib/evaluator/evaluator-submission-storage";
import type { EvaluatorWindowHostRefObject } from "../lib/evaluator/evaluator-window-host";

export const partyAppraisalExtensions: PartyAppraisalExtensions = {
  patchQueueConfig(base, _def) {
    const baseFilter = base.filterListed!;

    return {
      ...base,
      emptyHint:
        "بعد الإرسال للأخصائي تختفي المعاملة من هنا — لاستدعائها افتح «عقارات أمر العمل» ثم ⋮ على الصك.",
      tableHint:
        "⋮ — فتح المعاملة · عقارات أمر العمل · تفاصيل العقار.",
      statusColumnLabel: "الحالة",
      filterListed: (mine: WorkflowTask[], poByNumber: Map<string, PoIntakeRecord>) =>
        filterAppraiserListedTasks(baseFilter(mine, poByNumber)),
      buildRowMoreItems: (ctx) => buildAppraiserQueueRowMoreItems(ctx),
      canOpenTask: (task) => canAppraiserOpenTask(task.id, task.status),
      getTaskStatusBadge: (task) => appraiserTaskStatusBadge(task.id),
      refreshOnWindowEvents: [
        EVALUATOR_RECALL_CHANGED_EVENT,
        EVALUATOR_SUBMISSION_CHANGED_EVENT,
      ],
    };
  },

  renderAppraisalWork({ def, childTask, hostRef }) {
    return (
      <AppraiserUploadTab
        def={def}
        childTask={childTask}
        hostRef={hostRef as EvaluatorWindowHostRefObject}
      />
    );
  },

  isEvaluatorLocked(taskId, saving) {
    void saving;
    const sub = loadEvaluatorSubmission(taskId);
    return sub ? isEvaluatorFormLocked(sub.status) : false;
  },
};
