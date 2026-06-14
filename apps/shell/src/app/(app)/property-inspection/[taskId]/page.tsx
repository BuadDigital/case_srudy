"use client";

import { use } from "react";
import { PartyActiveTaskWorkPage, decodeTaskParam } from "@case-study/mfe";

export default function PropertyInspectionWorkPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = use(params);
  return (
    <PartyActiveTaskWorkPage
      pageId="property-inspection"
      taskId={decodeTaskParam(taskId)}
    />
  );
}
