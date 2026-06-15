"use client";

import { useRouter } from "next/navigation";
import { Button } from "@platform/design-system";
import { usePrototype } from "@platform/app-shared/contexts/PrototypeContext";
import { canReceivePo } from "../../lib/prototype/po-roles";

function PlusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function PoListTopbarActions() {
  const router = useRouter();
  const { role } = usePrototype();
  const showIntake = canReceivePo(role);

  return (
    <div
      className="flex shrink-0 flex-wrap items-center justify-end gap-2"
      aria-label="إجراءات أوامر العمل"
    >
      {showIntake ? (
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => router.push("/po?intake=1")}
        >
          <PlusIcon />
          أمر عمل جديد
        </Button>
      ) : null}
    </div>
  );
}
