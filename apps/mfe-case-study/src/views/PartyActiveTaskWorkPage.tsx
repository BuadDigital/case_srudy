"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { partyTaskPageDef } from "@platform/app-shared/prototype/party-task-pages";
import type { PageId } from "@platform/types";
import type { PartyAppraisalExtensions } from "../lib/party-appraisal-extensions";
import type { PartyEngineeringSurveyExtensions } from "../lib/party-engineering-survey-extensions";
import type { PartyActiveTaskWorkHostRef } from "../lib/party-active-task-work-host";
import { partyTaskPath } from "../lib/my-task-routes";
import { useWorkflowTasksQuery } from "../query/case-study-queries";
import { PartyActiveTaskWork } from "./PartyActiveTaskWork";

export function PartyActiveTaskWorkPage({
  pageId,
  taskId,
  appraisalExtensions,
  engineeringSurveyExtensions,
}: {
  pageId: PageId;
  taskId: string;
  appraisalExtensions?: PartyAppraisalExtensions;
  engineeringSurveyExtensions?: PartyEngineeringSurveyExtensions;
}) {
  const router = useRouter();
  const hostRef = useRef<PartyActiveTaskWorkHostRef>({});
  hostRef.current.onClose = () => router.push(partyTaskPath(pageId));

  const def = partyTaskPageDef(pageId);
  const { data: tasks, isFetched } = useWorkflowTasksQuery();
  const task = tasks?.find((t) => t.id === taskId);

  if (!def) {
    return (
      <p className="po-properties-loading">صفحة المهمة غير معرّفة.</p>
    );
  }

  if (!isFetched) {
    return <p className="po-properties-loading">جاري تحميل المهمة…</p>;
  }

  if (!task) {
    return (
      <div className="po-properties-page pd-page">
        <div className="po-properties-empty">
          <p>لم تُعثر على المهمة أو لم تعد في قائمتك.</p>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            style={{ marginTop: 12 }}
            onClick={() => router.push(partyTaskPath(pageId))}
          >
            العودة للقائمة
          </button>
        </div>
      </div>
    );
  }

  return (
    <PartyActiveTaskWork
      def={def}
      task={task}
      hostRef={hostRef}
      layout="page"
      appraisalExtensions={appraisalExtensions}
      engineeringSurveyExtensions={engineeringSurveyExtensions}
    />
  );
}
