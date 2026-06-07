"use client";

import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type { PageId } from "@platform/types";
import {
  getPoRecord,
  loadPendingBourseItems,
  loadPoListRows,
  loadPoRecords,
  loadPropertyListItems,
} from "@/lib/prototype/po-intake-storage";
import { loadCourtsCatalog } from "@/lib/prototype/courts-storage";
import { loadFailures } from "@/lib/prototype/failures-storage";
import {
  loadCaseStudyInfoRolesConfig,
  type CaseStudyInfoRolesConfig,
} from "@/lib/prototype/case-study-info-roles-storage";
import {
  loadWorkflowTasks,
  syncTasksFromPoRecords,
  TASKS_CHANGED_EVENT,
  TASKS_STORAGE_KEY,
} from "@/lib/prototype/tasks-storage";
import { fetchOrganization } from "@/lib/users-org-api";
import { fetchStaffUsers } from "@/lib/users-api";
import { WORK_ORDERS_CHANGED_EVENT } from "@/lib/work-orders-api-config";
import { prototypeKeys } from "@/lib/query/prototype-keys";
import { useEffect } from "react";

const STALE_MS = 60_000;
const GC_MS = 10 * 60_000;

const queryDefaults = { staleTime: STALE_MS, gcTime: GC_MS };

/** Loads POs from API and keeps workflow task slots in sync. */
export async function loadPoRecordsWithTaskSync() {
  const records = await loadPoRecords();
  await syncTasksFromPoRecords();
  return records;
}

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

export function prefetchPoRecord(
  queryClient: QueryClient,
  poNumber: string,
): void {
  const n = poNumber.trim();
  if (!n) return;
  void queryClient.prefetchQuery({
    queryKey: prototypeKeys.poRecord(n),
    queryFn: () => getPoRecord(n),
    ...prefetchOpts(queryClient),
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
    const onStorage = (e: StorageEvent) => {
      if (e.key === "evalFailureRecords") invalidateFailures();
      if (e.key === TASKS_STORAGE_KEY) invalidateTasks();
      if (e.key === "evalCaseStudyInfoRoles") invalidateInfoRoles();
      if (
        e.key?.startsWith("evalPo") ||
        e.key === "evalPoIntakeDraft"
      ) {
        invalidateWorkOrders();
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(WORK_ORDERS_CHANGED_EVENT, invalidateWorkOrders);
      window.removeEventListener(TASKS_CHANGED_EVENT, invalidateTasks);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, [queryClient]);
}

export function useWorkflowTasksQuery() {
  return useQuery({
    queryKey: prototypeKeys.workflowTasks(),
    queryFn: loadWorkflowTasks,
    ...queryDefaults,
  });
}

export function usePoRecordsQuery() {
  return useQuery({
    queryKey: prototypeKeys.poRecords(),
    queryFn: loadPoRecordsWithTaskSync,
    ...queryDefaults,
  });
}

export function usePendingBourseItemsQuery() {
  return useQuery({
    queryKey: prototypeKeys.pendingBourseItems(),
    queryFn: loadPendingBourseItems,
    ...queryDefaults,
  });
}

export function usePoListRowsQuery() {
  return useQuery({
    queryKey: prototypeKeys.poListRows(),
    queryFn: loadPoListRows,
    ...queryDefaults,
  });
}

export function usePropertyListItemsQuery() {
  return useQuery({
    queryKey: prototypeKeys.propertyListItems(),
    queryFn: loadPropertyListItems,
    ...queryDefaults,
  });
}

export function usePoRecordQuery(poNumber: string | null) {
  return useQuery({
    queryKey: prototypeKeys.poRecord(poNumber ?? ""),
    queryFn: () => getPoRecord(poNumber!),
    enabled: Boolean(poNumber),
    ...queryDefaults,
  });
}

export function useFailuresQuery() {
  return useQuery({
    queryKey: prototypeKeys.failures(),
    queryFn: loadFailures,
    ...queryDefaults,
  });
}

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
  return useQuery({
    queryKey: prototypeKeys.staffUsers(),
    queryFn: fetchStaffUsers,
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
