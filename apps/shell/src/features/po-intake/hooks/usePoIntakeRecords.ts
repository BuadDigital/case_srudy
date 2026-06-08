"use client";

import { usePoRecordsQuery, usePoRecordQuery } from "@/lib/query/prototype-queries";

/** Feature hook — UI should prefer this over calling storage/API directly. */
export function usePoIntakeRecords() {
  return usePoRecordsQuery();
}

export function usePoIntakeRecord(poNumber: string | null | undefined) {
  return usePoRecordQuery(poNumber ?? null);
}
