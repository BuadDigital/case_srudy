"use client";

import { useMemo } from "react";
import { usePrototype } from "@platform/app-shared/contexts/PrototypeContext";
import { ROLES } from "@platform/app-shared/prototype/constants";
import { countOpenFailures } from "@failures/mfe";
import { useFailuresQuery } from "@/lib/query/prototype-queries";

/** Live red badge count for إدارة التعذرات in the sidebar. */
export function useFailuresNavBadge(): number {
  const { role } = usePrototype();
  const { data: failures = [] } = useFailuresQuery();

  return useMemo(() => {
    if (!ROLES[role]?.pages.includes("failures")) return 0;
    return countOpenFailures(failures);
  }, [role, failures]);
}
