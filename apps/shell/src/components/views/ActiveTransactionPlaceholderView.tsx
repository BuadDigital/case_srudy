"use client";

import { ACTIVE_TRANSACTIONS_NAV } from "@/lib/prototype/active-transactions";
import type { PageId } from "@platform/types";

export function ActiveTransactionPlaceholderView({ pageId }: { pageId: PageId }) {
  const label =
    ACTIVE_TRANSACTIONS_NAV.find((n) => n.id === pageId)?.label ?? pageId;

  return (
    <div className="po-properties-page">
      <article className="po-properties-shell">
        <div className="po-properties-empty active-transactions-soon">
          <p>{label}</p>
          <p className="po-properties-hint" style={{ marginTop: 8 }}>
            هذا القسم قيد التطوير — سيتم تفعيله لاحقاً.
          </p>
        </div>
      </article>
    </div>
  );
}
