"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { PoPropertyCreate } from "@case-study/mfe/components/po-intake/PoPropertyCreate";
import { poPropertiesPath } from "../../lib/po-routes";
import { prototypeKeys } from "@platform/app-shared/query/prototype-keys";

export function PoPropertyCreateRoute({ poNumber }: { poNumber: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return (
    <PoPropertyCreate
      poNumber={poNumber}
      onBackAction={() => router.push(poPropertiesPath(poNumber))}
      onSavedAction={() => {
        void queryClient.invalidateQueries({ queryKey: prototypeKeys.all });
        router.push(poPropertiesPath(poNumber));
      }}
    />
  );
}
