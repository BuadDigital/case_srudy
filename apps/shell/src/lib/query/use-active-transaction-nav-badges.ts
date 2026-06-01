"use client";

import { useMemo } from "react";
import type { PageId } from "@platform/types";
import { usePrototype } from "@/contexts/PrototypeContext";
import {
  filterTasksForDistribution,
  filterTasksForPrimaryData,
} from "@/lib/prototype/active-transactions";
import { tasksForRole } from "@/lib/prototype/tasks-storage";
import type { PoIntakeRecord } from "@/lib/prototype/po-intake-data";
import {
  usePendingBourseItemsQuery,
  usePoRecordsQuery,
  useWorkflowTasksQuery,
} from "@/lib/query/prototype-queries";

function poRecordsMap(records: PoIntakeRecord[] | undefined) {
  const map = new Map<string, PoIntakeRecord>();
  for (const r of records ?? []) map.set(r.poNumber.trim(), r);
  return map;
}

/** Red sidebar counts for المعاملات النشطة (open work only). */
export function useActiveTransactionNavBadges(): Partial<Record<PageId, number>> {
  const { role } = usePrototype();
  const { data: tasks } = useWorkflowTasksQuery();
  const { data: poRecords } = usePoRecordsQuery();
  const { data: pendingBourse } = usePendingBourseItemsQuery();

  return useMemo(() => {
    const poByNumber = poRecordsMap(poRecords);
    const mine = tasksForRole(role, tasks ?? []);

    const primaryOpen = filterTasksForPrimaryData(mine, poByNumber).filter(
      (t) => t.status === "open" || t.status === "blocked",
    ).length;

    const bourseOpen = pendingBourse?.length ?? 0;

    const distributionOpen = filterTasksForDistribution(mine).filter(
      (t) => t.status === "open" || t.status === "blocked",
    ).length;

    const badges: Partial<Record<PageId, number>> = {};
    if (primaryOpen > 0) badges["active-primary-data"] = primaryOpen;
    if (bourseOpen > 0) badges["bourse-inquiry"] = bourseOpen;
    if (distributionOpen > 0) badges["active-distribution"] = distributionOpen;
    return badges;
  }, [role, tasks, poRecords, pendingBourse]);
}
