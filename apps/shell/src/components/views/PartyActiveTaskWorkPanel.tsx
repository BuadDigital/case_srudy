"use client";

import { useRef } from "react";
import { PartyActiveTaskWork } from "@/components/views/PartyActiveTaskWork";
import type { PartyActiveTaskWorkHostRef } from "@/lib/prototype/party-active-task-work-host";
import type { PartyTaskPageDef } from "@platform/app-shared/prototype/party-task-pages";
import type { WorkflowTask } from "@case-study/mfe";

/** غلاف رفيع عند حدود القائمة — أسماء *Action لتتوافق مع Next.js. */
export function PartyActiveTaskWorkPanel({
  def,
  task,
  layout = "panel",
  onRefreshAction,
  onCloseAction,
}: {
  def: PartyTaskPageDef;
  task: WorkflowTask;
  layout?: "page" | "panel";
  onRefreshAction: () => void;
  onCloseAction?: () => void;
}) {
  const hostRef = useRef<PartyActiveTaskWorkHostRef>({});
  hostRef.current.onRefresh = onRefreshAction;
  hostRef.current.onClose = onCloseAction;

  return (
    <PartyActiveTaskWork
      def={def}
      task={task}
      hostRef={hostRef}
      layout={layout}
    />
  );
}
