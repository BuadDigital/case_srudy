"use client";

import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type { PageId } from "@platform/types";
import {
  getPoRecord,
  loadPoListRows,
  loadPoRecords,
  loadPropertyListItems,
} from "@/lib/prototype/po-intake-storage";
import { fetchOrganization } from "@/lib/users-org-api";
import { fetchStaffUsers } from "@/lib/users-api";
import { WORK_ORDERS_CHANGED_EVENT } from "@/lib/work-orders-api-config";
import { prototypeKeys } from "@/lib/query/prototype-keys";
import { useEffect } from "react";

const STALE_MS = 60_000;
const GC_MS = 10 * 60_000;

export function prefetchPrototypePage(
  queryClient: QueryClient,
  page: PageId,
): void {
  const opts = { staleTime: STALE_MS };
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
      break;
    case "properties":
    case "assignment":
    case "failures":
    case "keys":
      void queryClient.prefetchQuery({
        queryKey: prototypeKeys.propertyListItems(),
        queryFn: loadPropertyListItems,
        ...opts,
      });
      void queryClient.prefetchQuery({
        queryKey: prototypeKeys.poRecords(),
        queryFn: loadPoRecords,
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
    default:
      break;
  }
}

export function prefetchCorePrototypeData(queryClient: QueryClient): void {
  const opts = { staleTime: STALE_MS };
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

    window.addEventListener(WORK_ORDERS_CHANGED_EVENT, invalidateWorkOrders);
    window.addEventListener("focus", onFocus);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "evalFailureRecords") invalidateWorkOrders();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(WORK_ORDERS_CHANGED_EVENT, invalidateWorkOrders);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, [queryClient]);
}

export function usePoListRowsQuery() {
  return useQuery({
    queryKey: prototypeKeys.poListRows(),
    queryFn: loadPoListRows,
    staleTime: STALE_MS,
    gcTime: GC_MS,
  });
}

export function usePoRecordsQuery() {
  return useQuery({
    queryKey: prototypeKeys.poRecords(),
    queryFn: loadPoRecords,
    staleTime: STALE_MS,
    gcTime: GC_MS,
  });
}

export function usePropertyListItemsQuery() {
  return useQuery({
    queryKey: prototypeKeys.propertyListItems(),
    queryFn: loadPropertyListItems,
    staleTime: STALE_MS,
    gcTime: GC_MS,
  });
}

export function usePoRecordQuery(poNumber: string | null) {
  return useQuery({
    queryKey: prototypeKeys.poRecord(poNumber ?? ""),
    queryFn: () => getPoRecord(poNumber!),
    enabled: Boolean(poNumber),
    staleTime: STALE_MS,
    gcTime: GC_MS,
  });
}

export function useStaffUsersQuery() {
  return useQuery({
    queryKey: prototypeKeys.staffUsers(),
    queryFn: fetchStaffUsers,
    staleTime: STALE_MS,
    gcTime: GC_MS,
  });
}

export function useOrganizationQuery() {
  return useQuery({
    queryKey: prototypeKeys.organization(),
    queryFn: fetchOrganization,
    staleTime: STALE_MS,
    gcTime: GC_MS,
  });
}
