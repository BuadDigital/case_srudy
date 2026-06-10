"use client";

import { PartyActiveTaskView } from "@case-study/mfe";
import { partyAppraisalExtensions } from "@/lib/prototype/party-appraisal-extensions";
import type { PageId } from "@platform/types";

export function PartyActiveTaskViewHost({ pageId }: { pageId: PageId }) {
  return (
    <PartyActiveTaskView
      pageId={pageId}
      appraisalExtensions={partyAppraisalExtensions}
    />
  );
}
