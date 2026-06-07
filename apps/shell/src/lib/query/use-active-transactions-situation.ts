"use client";

import { useMemo } from "react";
import { usePrototype } from "@/contexts/PrototypeContext";
import {
  computeActiveTransactionsSituation,
  situationVisibilityForRole,
  type ActiveTransactionsSituationStats,
} from "@/lib/prototype/active-transactions-situation";
import {
  usePoListRowsQuery,
  usePoRecordsQuery,
  useWorkflowTasksQuery,
} from "@/lib/query/prototype-queries";

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
