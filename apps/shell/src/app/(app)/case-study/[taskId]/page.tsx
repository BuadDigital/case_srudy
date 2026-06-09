"use client";
import { CaseStudyWorkspaceView } from "@/components/views/CaseStudyWorkspaceView";
import { decodeTaskParam } from "@case-study/mfe";
import { use } from "react";

export default function CaseStudyWorkspacePage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = use(params);
  return <CaseStudyWorkspaceView taskId={decodeTaskParam(taskId)} />;
}
