"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ROLES } from "@platform/app-shared/prototype/constants";
import { poPropertiesPath } from "../../lib/po-routes";
import { prototypeKeys } from "@platform/app-shared/query/prototype-keys";
import { usePrototype } from "@platform/app-shared/contexts/PrototypeContext";
import { FailureReportForm } from "@case-study/mfe/components/failures/FailureReportForm";

export function PoPropertyFailureRoute({
  poNumber,
  propertyId,
}: {
  poNumber: string;
  propertyId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { role } = usePrototype();

  return (
    <FailureReportForm
      poNumber={poNumber}
      propertyId={propertyId}
      deedNumber=""
      specialist={ROLES[role]?.name ?? "أخصائي"}
      onDone={() => {
        void queryClient.invalidateQueries({ queryKey: prototypeKeys.all });
        router.push(poPropertiesPath(poNumber));
      }}
      onCancel={() => router.push(poPropertiesPath(poNumber))}
    />
  );
}
