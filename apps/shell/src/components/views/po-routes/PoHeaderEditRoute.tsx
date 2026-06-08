"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { PoHeaderEdit } from "@/components/prototype/po-intake/PoHeaderEdit";
import { poListPath } from "@/lib/po-routes";
import { prototypeKeys } from "@/lib/query/prototype-keys";
import { usePoRecordQuery } from "@/lib/query/prototype-queries";

export function PoHeaderEditRoute({ poNumber }: { poNumber: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: record, isPending } = usePoRecordQuery(poNumber);

  if (isPending && !record) {
    return (
      <p className="po-properties-loading" style={{ margin: 16 }}>
        جاري تحميل أمر العمل…
      </p>
    );
  }

  if (!record) {
    return (
      <div className="note note-warn" style={{ margin: 16 }}>
        لم يُعثر على أمر العمل.
      </div>
    );
  }

  return (
    <PoHeaderEdit
      record={record}
      onBackAction={() => router.push(poListPath())}
      onSavedAction={() => {
        void queryClient.invalidateQueries({ queryKey: prototypeKeys.all });
        router.push(poListPath());
      }}
    />
  );
}
