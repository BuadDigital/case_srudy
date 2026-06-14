"use client";

import { use } from "react";
import { PartyActiveTaskWorkPage, decodeTaskParam } from "@case-study/mfe";

export default function ValuationCoordinationWorkPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = use(params);
  return (
    <PartyActiveTaskWorkPage
      pageId="valuation-coordination"
      taskId={decodeTaskParam(taskId)}
    />
  );
}
