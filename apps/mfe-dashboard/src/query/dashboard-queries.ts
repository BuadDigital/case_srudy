"use client";

import { useQuery } from "@tanstack/react-query";
import { prototypeKeys } from "@platform/app-shared/query/prototype-keys";
import {
  loadPoListRows,
  loadPropertyListItems,
} from "@case-study/mfe/lib/prototype/po-intake-storage";

const STALE_MS = 60_000;
const GC_MS = 10 * 60_000;
const queryDefaults = { staleTime: STALE_MS, gcTime: GC_MS };

/** PO list rows for dashboard stats — shared prototype query keys. */
export function usePoListRowsQuery() {
  return useQuery({
    queryKey: prototypeKeys.poListRows(),
    queryFn: loadPoListRows,
    ...queryDefaults,
  });
}

/** Property list items for dashboard stats — shared prototype query keys. */
export function usePropertyListItemsQuery() {
  return useQuery({
    queryKey: prototypeKeys.propertyListItems(),
    queryFn: loadPropertyListItems,
    ...queryDefaults,
  });
}
