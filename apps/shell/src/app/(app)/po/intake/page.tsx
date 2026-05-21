"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { PoIntakeFlow } from "@/components/prototype/po-intake/PoIntakeFlow";
import { poListPath } from "@/lib/po-routes";
import { prototypeKeys } from "@/lib/query/prototype-keys";

export default function PoIntakePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return (
    <PoIntakeFlow
      onCompleteAction={() => {
        void queryClient.invalidateQueries({ queryKey: prototypeKeys.all });
        router.push(poListPath());
      }}
      onBackAction={() => router.push(poListPath())}
    />
  );
}
