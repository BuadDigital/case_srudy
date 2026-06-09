"use client";

import { useCallback, useEffect } from "react";
import { PoPropertiesPage } from "@case-study/mfe";
import type { PoPropertyRowMoreContext } from "@case-study/mfe/lib/prototype/po-properties-row-menu";
import type { RowMoreMenuItem } from "@case-study/mfe/components/ui/RowMoreMenu";
import { usePrototype } from "@platform/app-shared/contexts/PrototypeContext";
import { buildAppraiserRecallMenuItems } from "@/lib/prototype/evaluator/appraiser-recall-menu-items";
import { EVALUATOR_RECALL_CHANGED_EVENT } from "@/lib/prototype/evaluator/evaluator-recall-storage";
import { useWorkflowTasksQuery } from "@/lib/query/prototype-queries";

export function PoPropertiesPageClient({ poNumber }: { poNumber: string }) {
  const { role } = usePrototype();
  const { data: tasks, refetch } = useWorkflowTasksQuery();

  useEffect(() => {
    if (role !== "real-estate-appraiser") return;
    const handler = () => void refetch();
    window.addEventListener(EVALUATOR_RECALL_CHANGED_EVENT, handler);
    return () =>
      window.removeEventListener(EVALUATOR_RECALL_CHANGED_EVENT, handler);
  }, [role, refetch]);

  const buildPropertyRowMoreItems = useCallback(
    (ctx: PoPropertyRowMoreContext): RowMoreMenuItem[] => {
      if (role !== "real-estate-appraiser") return [];
      const task = (tasks ?? []).find(
        (t) =>
          t.kind === "property-appraisal" &&
          t.poNumber.trim() === ctx.poNumber.trim() &&
          t.propertyId === ctx.property.id,
      );
      if (!task) return [];
      return buildAppraiserRecallMenuItems(task, ctx.refresh);
    },
    [role, tasks],
  );

  return (
    <PoPropertiesPage
      poNumber={poNumber}
      buildPropertyRowMoreItems={
        role === "real-estate-appraiser" ? buildPropertyRowMoreItems : undefined
      }
    />
  );
}
