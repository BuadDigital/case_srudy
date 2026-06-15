import { Suspense } from "react";
import { PoListView } from "@case-study/mfe";

export default function PoPage() {
  return (
    <Suspense
      fallback={
        <p className="my-2 px-6 py-6 text-xs text-text-3">جاري تحميل أوامر العمل…</p>
      }
    >
      <PoListView />
    </Suspense>
  );
}
