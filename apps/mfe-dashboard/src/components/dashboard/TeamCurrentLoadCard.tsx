import {
  CardBody,
  KpiRowLabel,
  ProgressBar,
  SubpageHeader,
  SubpagePanel,
} from "@platform/design-system";

const TEAM_LOAD_SPECIALISTS: [string, string, number, number, "warning" | "success"][] = [
  ["أسامة الصالحي", "أخصائي", 14, 20, "warning"],
  ["عمر الحمراني", "أخصائي", 10, 20, "success"],
  ["أيمن مجرشي", "أخصائي", 11, 20, "warning"],
  ["وليد باشماخ", "أخصائي", 8, 20, "success"],
];

function LoadRow({
  name,
  roleLabel,
  value,
  max,
  tone,
}: {
  name: string;
  roleLabel: string;
  value: number;
  max: number;
  tone: "warning" | "success";
}) {
  return (
    <div className="mb-3 last:mb-0">
      <KpiRowLabel>
        <span>
          {name} <span className="text-text-3">({roleLabel})</span>
        </span>
        <span className="font-semibold">
          {value}/{max}
        </span>
      </KpiRowLabel>
      <ProgressBar value={value} max={max} tone={tone} />
    </div>
  );
}

export function TeamCurrentLoadCard() {
  return (
    <SubpagePanel className="mb-4">
      <SubpageHeader title="حمل الفريق الحالي" />
      <CardBody>
        {TEAM_LOAD_SPECIALISTS.map(([n, r, v, m, c]) => (
          <LoadRow key={n} name={n} roleLabel={r} value={v} max={m} tone={c} />
        ))}
      </CardBody>
    </SubpagePanel>
  );
}
