"use client";

import { useMemo } from "react";
import { filterTasksForPartyKind } from "@platform/app-shared/prototype/party-task-pages";
import { getAuthSession } from "@platform/auth-client";
import { usePrototype } from "@platform/app-shared/contexts/PrototypeContext";
import { isTaskOnSuspendedProperty } from "@case-study/mfe/lib/prototype/suspended-transactions-storage";
import {
  tasksForPartyAssignee,
  type WorkflowTask,
} from "@case-study/mfe/lib/prototype/tasks-storage";
import {
  usePoRecordsQuery,
  useWorkflowTasksQuery,
} from "@case-study/mfe/query/case-study-queries";
import { filterEngineeringSurveyListedTasks } from "../lib/engineering-survey-queue";

export function useEngineeringSurveyListedTasks(): {
  listed: WorkflowTask[];
  ready: boolean;
} {
  const { role, viewerEmail } = usePrototype();
  const { data: tasks, isFetched: tasksFetched } = useWorkflowTasksQuery();
  const { data: poRecords = [], isFetched: poRecordsFetched } =
    usePoRecordsQuery();

  const listed = useMemo(() => {
    if (!tasksFetched || !poRecordsFetched) return [];

    const mine = tasksForPartyAssignee(
      role,
      tasks ?? [],
      "engineering-office",
      viewerEmail ?? getAuthSession()?.user.email,
    );

    return filterEngineeringSurveyListedTasks(
      filterTasksForPartyKind(mine, "engineering-survey"),
    ).filter(
      (t) =>
        (t.status === "open" || t.status === "blocked") &&
        !isTaskOnSuspendedProperty(t),
    );
  }, [poRecordsFetched, role, tasks, tasksFetched, viewerEmail]);

  return {
    listed,
    ready: tasksFetched && poRecordsFetched,
  };
}
