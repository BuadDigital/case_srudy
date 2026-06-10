"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ROLES } from "@platform/app-shared/prototype/constants";
import { poPropertiesPath } from "../../lib/po-routes";
import { prototypeKeys } from "@platform/app-shared/query/prototype-keys";
import { usePrototype } from "@platform/app-shared/contexts/PrototypeContext";
import {
  FAILURE_RAISER_SPECIALIST,
  FAILURE_RAISER_SUPERVISOR,
  FailureReportForm,
} from "@failures/mfe";
import { usePoRecordQuery } from "../../query/case-study-queries";

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
  const { data: record } = usePoRecordQuery(poNumber);
  const property = record?.properties.find((p) => p.id === propertyId);
  const raisedByRole =
    role === "section-supervisor"
      ? FAILURE_RAISER_SUPERVISOR
      : FAILURE_RAISER_SPECIALIST;

  return (
    <FailureReportForm
      poNumber={poNumber}
      propertyId={propertyId}
      deedNumber={property?.deedNumber?.trim() ?? ""}
      specialist={ROLES[role]?.name ?? "أخصائي"}
      raisedByRole={raisedByRole}
      onDone={() => {
        void queryClient.invalidateQueries({ queryKey: prototypeKeys.all });
        router.push(poPropertiesPath(poNumber));
      }}
      onCancel={() => router.push(poPropertiesPath(poNumber))}
    />
  );
}
