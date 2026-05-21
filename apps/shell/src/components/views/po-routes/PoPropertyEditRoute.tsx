"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { PoPropertyEdit } from "@/components/prototype/po-intake/PoPropertyEdit";
import { poPropertiesPath } from "@/lib/po-routes";
import { prototypeKeys } from "@/lib/query/prototype-keys";

export function PoPropertyEditRoute({
  poNumber,
  propertyId,
}: {
  poNumber: string;
  propertyId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return (
    <PoPropertyEdit
      poNumber={poNumber}
      propertyId={propertyId}
      onBackAction={() => router.push(poPropertiesPath(poNumber))}
      onSavedAction={() => {
        void queryClient.invalidateQueries({ queryKey: prototypeKeys.all });
        router.push(poPropertiesPath(poNumber));
      }}
      onDeletedAction={() => {
        void queryClient.invalidateQueries({ queryKey: prototypeKeys.all });
        router.push(poPropertiesPath(poNumber));
      }}
    />
  );
}
