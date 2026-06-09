"use client";

import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type { PageId } from "@platform/types";
import {
  loadPendingBourseItems,
  loadPoListRows,
  loadPropertyListItems,
} from "@case-study/mfe";
import { loadCourtsCatalog } from "@/lib/prototype/courts-storage";
import { loadFailures } from "@case-study/mfe/lib/prototype/failures-storage";
import {
  CASE_STUDY_INFO_ROLES_CHANGED_EVENT,
  loadCaseStudyInfoRolesConfig,
  type CaseStudyInfoRolesConfig,
} from "@/lib/prototype/case-study-info-roles-storage";
import {
  loadPoRecordsWithTaskSync,
  loadWorkflowTasks,
  TASKS_CHANGED_EVENT,
  TASKS_STORAGE_KEY,
  WORK_ORDERS_CHANGED_EVENT,
} from "@case-study/mfe/query/case-study-queries";
import { fetchOrganization } from "@/lib/users-org-api";
import { fetchStaffUsers } from "@/lib/users-api";
import { prototypeKeys } from "@platform/app-shared/query/prototype-keys";
import { usePrototype } from "@platform/app-shared/contexts/PrototypeContext";
import { useEffect } from "react";

const STALE_MS = 60_000;
const GC_MS = 10 * 60_000;

const queryDefaults = { staleTime: STALE_MS, gcTime: GC_MS };

function prefetchOpts(queryClient: QueryClient) {
  return { staleTime: STALE_MS };
}

export function prefetchPrototypePage(
  queryClient: QueryClient,
  page: PageId,
): void {
  const opts = prefetchOpts(queryClient);

  const prefetchTasksAndPos = () => {
    void queryClient.prefetchQuery({
      queryKey: prototypeKeys.poRecords(),
      queryFn: loadPoRecordsWithTaskSync,
      ...opts,
    });
    void queryClient.prefetchQuery({
      queryKey: prototypeKeys.workflowTasks(),
      queryFn: loadWorkflowTasks,
      ...opts,
    });
  };

  const prefetchActiveTransactionsSituation = () => {
    prefetchTasksAndPos();
    void queryClient.prefetchQuery({
      queryKey: prototypeKeys.poListRows(),
      queryFn: loadPoListRows,
      ...opts,
    });
  };

  switch (page) {
    case "dashboard":
    case "po":
      void queryClient.prefetchQuery({
        queryKey: prototypeKeys.poListRows(),
        queryFn: loadPoListRows,
        ...opts,
      });
      void queryClient.prefetchQuery({
        queryKey: prototypeKeys.propertyListItems(),
        queryFn: loadPropertyListItems,
        ...opts,
      });
      prefetchTasksAndPos();
      break;
    case "failures":
      void queryClient.prefetchQuery({
        queryKey: prototypeKeys.failures(),
        queryFn: loadFailures,
        ...opts,
      });
      prefetchTasksAndPos();
      break;
    case "keys":
    case "survey":
    case "active-primary-data":
    case "active-distribution":
    case "active-case-study":
    case "property-inspection":
    case "government-review":
    case "valuation-coordination":
    case "property-appraisal":
    case "active-survey":
    case "field-form":
    case "valuation-requests":
      prefetchActiveTransactionsSituation();
      break;
    case "bourse-inquiry":
      prefetchActiveTransactionsSituation();
      void queryClient.prefetchQuery({
        queryKey: prototypeKeys.pendingBourseItems(),
        queryFn: loadPendingBourseItems,
        ...opts,
      });
      break;
    case "users":
      void queryClient.prefetchQuery({
        queryKey: prototypeKeys.staffUsers(),
        queryFn: fetchStaffUsers,
        ...opts,
      });
      void queryClient.prefetchQuery({
        queryKey: prototypeKeys.organization(),
        queryFn: fetchOrganization,
        ...opts,
      });
      break;
    case "courts":
      void queryClient.prefetchQuery({
        queryKey: prototypeKeys.courtsCatalog(),
        queryFn: loadCourtsCatalog,
        ...opts,
      });
      break;
    case "case-study-info-roles":
      void queryClient.prefetchQuery({
        queryKey: prototypeKeys.caseStudyInfoRoles(),
        queryFn: loadCaseStudyInfoRolesConfig,
        ...opts,
      });
      break;
    case "messages":
    case "financial":
    case "kpi":
    case "system-tools":
      break;
    default:
      break;
  }
}

/** Warm cache on app boot — covers most sidebar routes. */
export function prefetchCorePrototypeData(queryClient: QueryClient): void {
  const opts = prefetchOpts(queryClient);
  void queryClient.prefetchQuery({
    queryKey: prototypeKeys.poListRows(),
    queryFn: loadPoListRows,
    ...opts,
  });
  void queryClient.prefetchQuery({
    queryKey: prototypeKeys.propertyListItems(),
    queryFn: loadPropertyListItems,
    ...opts,
  });
  void queryClient.prefetchQuery({
    queryKey: prototypeKeys.poRecords(),
    queryFn: loadPoRecordsWithTaskSync,
    ...opts,
  });
  void queryClient.prefetchQuery({
    queryKey: prototypeKeys.workflowTasks(),
    queryFn: loadWorkflowTasks,
    ...opts,
  });
  void queryClient.prefetchQuery({
    queryKey: prototypeKeys.pendingBourseItems(),
    queryFn: loadPendingBourseItems,
    ...opts,
  });
  void queryClient.prefetchQuery({
    queryKey: prototypeKeys.failures(),
    queryFn: loadFailures,
    ...opts,
  });
}

export function usePrototypeDataSync(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidateWorkOrders = () => {
      void queryClient.invalidateQueries({ queryKey: prototypeKeys.all });
    };
    const onFocus = () => {
      void queryClient.invalidateQueries({
        queryKey: prototypeKeys.all,
        refetchType: "active",
      });
    };

    const invalidateTasks = () => {
      void queryClient.invalidateQueries({
        queryKey: prototypeKeys.workflowTasks(),
      });
    };

    const invalidateFailures = () => {
      void queryClient.invalidateQueries({
        queryKey: prototypeKeys.failures(),
      });
    };

    const invalidateCourts = () => {
      void queryClient.invalidateQueries({
        queryKey: prototypeKeys.courtsCatalog(),
      });
    };

    const invalidateInfoRoles = () => {
      void queryClient.invalidateQueries({
        queryKey: prototypeKeys.caseStudyInfoRoles(),
      });
    };

    window.addEventListener(WORK_ORDERS_CHANGED_EVENT, invalidateWorkOrders);
    window.addEventListener(TASKS_CHANGED_EVENT, invalidateTasks);
    window.addEventListener("focus", onFocus);
    const onInfoRolesChanged = () => invalidateInfoRoles();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "evalFailureRecords") invalidateFailures();
      if (e.key === TASKS_STORAGE_KEY) invalidateTasks();
      if (
        e.key?.startsWith("evalPo") ||
        e.key === "evalPoIntakeDraft"
      ) {
        invalidateWorkOrders();
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(CASE_STUDY_INFO_ROLES_CHANGED_EVENT, onInfoRolesChanged);

    return () => {
      window.removeEventListener(WORK_ORDERS_CHANGED_EVENT, invalidateWorkOrders);
      window.removeEventListener(TASKS_CHANGED_EVENT, invalidateTasks);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(
        CASE_STUDY_INFO_ROLES_CHANGED_EVENT,
        onInfoRolesChanged,
      );
    };
  }, [queryClient]);
}

export {
  loadPoRecordsWithTaskSync,
  prefetchPoRecord,
  TASKS_CHANGED_EVENT,
  TASKS_STORAGE_KEY,
  WORK_ORDERS_CHANGED_EVENT,
  useFailuresQuery,
  usePendingBourseItemsQuery,
  usePoListRowsQuery,
  usePoRecordQuery,
  usePoRecordsQuery,
  usePropertyListItemsQuery,
  useWorkflowTasksQuery,
} from "@case-study/mfe/query/case-study-queries";

export function useCourtsCatalogQuery() {
  return useQuery({
    queryKey: prototypeKeys.courtsCatalog(),
    queryFn: loadCourtsCatalog,
    ...queryDefaults,
  });
}

export function useCaseStudyInfoRolesQuery() {
  return useQuery({
    queryKey: prototypeKeys.caseStudyInfoRoles(),
    queryFn: loadCaseStudyInfoRolesConfig,
    ...queryDefaults,
  });
}

export function useStaffUsersQuery() {
  const { personaId, authReady } = usePrototype();
  return useQuery({
    queryKey: [...prototypeKeys.staffUsers(), personaId],
    queryFn: fetchStaffUsers,
    enabled: authReady,
    ...queryDefaults,
  });
}

export function useOrganizationQuery() {
  return useQuery({
    queryKey: prototypeKeys.organization(),
    queryFn: fetchOrganization,
    ...queryDefaults,
  });
}

export function setCaseStudyInfoRolesCache(
  queryClient: QueryClient,
  config: CaseStudyInfoRolesConfig,
) {
  queryClient.setQueryData(prototypeKeys.caseStudyInfoRoles(), config);
}

