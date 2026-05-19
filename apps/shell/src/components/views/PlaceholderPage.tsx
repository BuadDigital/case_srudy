import type { PageId } from "@platform/types";
import { PAGE_TITLES } from "@/lib/prototype/constants";

export function PlaceholderPage({ page }: { page: PageId }) {
  const title = PAGE_TITLES[page] ?? page;
  return (
    <div className="note note-info" style={{ marginBottom: 0 }}>
      صفحة «{title}» ستُنفَّذ لاحقاً لتطابق النموذج الأصلي.
    </div>
  );
}
