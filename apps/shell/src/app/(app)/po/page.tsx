import { Suspense } from "react";
import { PoListView } from "@case-study/mfe";

export default function PoPage() {
  return (
    <Suspense
      fallback={
        <p className="po-properties-loading" style={{ padding: 24 }}>
          جاري تحميل أوامر العمل…
        </p>
      }
    >
      <PoListView />
    </Suspense>
  );
}
