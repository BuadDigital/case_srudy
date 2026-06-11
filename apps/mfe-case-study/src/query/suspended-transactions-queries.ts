"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { prototypeKeys } from "@platform/app-shared/query/prototype-keys";
import {
  SUSPENDED_TRANSACTIONS_CHANGED_EVENT,
  loadSuspendedTransactions,
} from "../lib/prototype/suspended-transactions-storage";

const STALE_MS = 30_000;
const GC_MS = 10 * 60_000;

export function useSuspendedTransactionsQuery() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const onChange = () => {
      void queryClient.invalidateQueries({
        queryKey: prototypeKeys.suspendedTransactions(),
      });
    };
    window.addEventListener(SUSPENDED_TRANSACTIONS_CHANGED_EVENT, onChange);
    return () =>
      window.removeEventListener(SUSPENDED_TRANSACTIONS_CHANGED_EVENT, onChange);
  }, [queryClient]);

  return useQuery({
    queryKey: prototypeKeys.suspendedTransactions(),
    queryFn: loadSuspendedTransactions,
    staleTime: STALE_MS,
    gcTime: GC_MS,
  });
}
