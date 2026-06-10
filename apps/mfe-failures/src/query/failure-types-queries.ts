"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { prototypeKeys } from "@platform/app-shared/query/prototype-keys";
import { FAILURE_TYPES_CHANGED_EVENT } from "../lib/failure-types-events";
import { loadFailureTypesCatalog } from "../lib/failure-types-storage";

const STALE_MS = 60_000;
const GC_MS = 10 * 60_000;
const queryDefaults = { staleTime: STALE_MS, gcTime: GC_MS };

export function useFailureTypesQuery() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const onChange = () => {
      void queryClient.invalidateQueries({
        queryKey: prototypeKeys.failureTypes(),
      });
    };
    window.addEventListener(FAILURE_TYPES_CHANGED_EVENT, onChange);
    return () =>
      window.removeEventListener(FAILURE_TYPES_CHANGED_EVENT, onChange);
  }, [queryClient]);

  return useQuery({
    queryKey: prototypeKeys.failureTypes(),
    queryFn: loadFailureTypesCatalog,
    ...queryDefaults,
  });
}
