"use client";

import { useMemo } from "react";
import type { PageId } from "@platform/types";
import { usePrototype } from "@/contexts/PrototypeContext";
import {
  filterTasksForCaseStudy,
  filterTasksForDistribution,
  filterTasksForPrimaryData,
} from "@/lib/prototype/active-transactions";
import {
  PARTY_TASK_PAGES,
  filterTasksForPartyKind,
} from "@/lib/prototype/party-task-pages";
import {
  tasksForPartyAssignee,
  tasksForRole,
} from "@/lib/prototype/tasks-storage";
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
    const partyMine = tasksForPartyAssignee(role, tasks ?? []);

    const primaryOpen = filterTasksForPrimaryData(mine, poByNumber).filter(
      (t) => t.status === "open" || t.status === "blocked",
    ).length;

    const bourseOpen = pendingBourse?.length ?? 0;

    const distributionOpen = filterTasksForDistribution(mine).filter(
      (t) => t.status === "open" || t.status === "blocked",
    ).length;

    const caseStudyOpen = filterTasksForCaseStudy(mine).filter(
      (t) => t.status === "open" || t.status === "blocked",
    ).length;

    const badges: Partial<Record<PageId, number>> = {};
    if (primaryOpen > 0) badges["active-primary-data"] = primaryOpen;
    if (bourseOpen > 0) badges["bourse-inquiry"] = bourseOpen;
    if (distributionOpen > 0) badges["active-distribution"] = distributionOpen;
    if (caseStudyOpen > 0) badges["active-case-study"] = caseStudyOpen;

    for (const def of Object.values(PARTY_TASK_PAGES)) {
      if (def.roleId !== role) continue;
      const open = filterTasksForPartyKind(partyMine, def.kind).filter(
        (t) => t.status === "open",
      ).length;
      if (open > 0) badges[def.pageId] = open;
    }

    return badges;
  }, [role, tasks, poRecords, pendingBourse]);
}
