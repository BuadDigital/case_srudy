"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { PoIntakeFlow } from "@/components/prototype/po-intake/PoIntakeFlow";
import { usePrototype } from "@/contexts/PrototypeContext";
import { canReceivePo } from "@/lib/prototype/po-roles";
import { poListPath } from "@/lib/po-routes";
import { prototypeKeys } from "@/lib/query/prototype-keys";

export default function PoIntakePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { role } = usePrototype();

  useEffect(() => {
    if (!canReceivePo(role)) {
      router.replace(poListPath());
    }
  }, [role, router]);

  if (!canReceivePo(role)) {
    return null;
  }

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
