import { CaseStudyProgressDonut } from "./CaseStudyProgressDonut";
import type { PartyCaseStudyProgress } from "../../lib/prototype/case-study-party-progress";

export function CaseStudyPartyProgressRings({
  items,
}: {
  items: PartyCaseStudyProgress[];
}) {
  if (items.length === 0) return null;

  return (
    <div
      className="mb-4 flex w-full flex-wrap items-start justify-end gap-x-5 gap-y-3.5 border-b border-border pb-4"
      aria-label="تقدم الأطراف في نموذج الدراسة"
    >
      {items.map((item) => (
        <CaseStudyProgressDonut
          key={item.partyId}
          pct={item.pct}
          color={item.color}
          label={item.name}
          sub={`${item.answered} / ${item.total}`}
        />
      ))}
    </div>
  );
}
