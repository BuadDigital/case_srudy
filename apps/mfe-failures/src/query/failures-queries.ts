"use client";

import { useQuery } from "@tanstack/react-query";
import { prototypeKeys } from "@platform/app-shared/query/prototype-keys";
import { loadFailures } from "../lib/failures-repository";

const STALE_MS = 60_000;
const GC_MS = 10 * 60_000;
const queryDefaults = { staleTime: STALE_MS, gcTime: GC_MS };

export { loadFailures };

export function useFailuresQuery() {
  return useQuery({
    queryKey: prototypeKeys.failures(),
    queryFn: loadFailures,
    ...queryDefaults,
  });
}
