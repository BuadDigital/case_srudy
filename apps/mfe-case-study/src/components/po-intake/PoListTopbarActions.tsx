"use client";

import { useRouter } from "next/navigation";
import { usePrototype } from "@platform/app-shared/contexts/PrototypeContext";
import { canReceivePo } from "../../lib/prototype/po-roles";

function DownloadIcon() {
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
      <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
    </svg>
  );
}

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
    <div className="topbar-actions" aria-label="إجراءات أوامر العمل">
      <button type="button" className="btn btn-sm" disabled title="قريباً">
        <DownloadIcon />
        تصدير
      </button>
      {showIntake ? (
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() => router.push("/po?intake=1")}
        >
          <PlusIcon />
          أمر عمل جديد
        </button>
      ) : null}
    </div>
  );
}
