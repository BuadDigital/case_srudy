"use client";

import { useMemo } from "react";
import { usePrototype } from "@platform/app-shared/contexts/PrototypeContext";
import {
  computeActiveTransactionsSituation,
  situationVisibilityForRole,
  type ActiveTransactionsSituationStats,
} from "@case-study/mfe";
import {
  usePoListRowsQuery,
  usePoRecordsQuery,
  useWorkflowTasksQuery,
} from "./case-study-queries";

export function useActiveTransactionsSituation(): ActiveTransactionsSituationStats {
  const { role } = usePrototype();
  const statsFlags = useMemo(() => situationVisibilityForRole(role), [role]);

  const { data: poRows, isFetched: poRowsFetched } = usePoListRowsQuery();
  const { data: poRecords, isFetched: poRecordsFetched } = usePoRecordsQuery();
  const { data: tasks, isFetched: tasksFetched } = useWorkflowTasksQuery();

  return useMemo(
    () =>
      computeActiveTransactionsSituation({
        role,
        poRows,
        poRecords,
        tasks,
        poRowsReady: !statsFlags.showPoMetrics || poRowsFetched,
        poRecordsReady: !statsFlags.showPoMetrics || poRecordsFetched,
        tasksReady: !statsFlags.showTransactionMetrics || tasksFetched,
      }),
    [
      role,
      poRows,
      poRecords,
      tasks,
      poRowsFetched,
      poRecordsFetched,
      tasksFetched,
      statsFlags.showPoMetrics,
      statsFlags.showTransactionMetrics,
    ],
  );
}
