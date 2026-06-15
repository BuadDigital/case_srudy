import {
  KpiRowLabel,
  ProgressBar,
  StatCard,
  StatGrid,
  StatLabel,
  StatSub,
  StatValue,
  SubpageHeader,
  SubpagePanel,
} from "@platform/design-system";

const SPECIALIST_KPI: [string, number][] = [
  ["أسامة الصالحي", 82],
  ["عمر الحمراني", 76],
  ["أيمن مجرشي", 69],
  ["وليد باشماخ", 91],
];

const PROVIDER_KPI: [string, number][] = [
  ["أحمد سعيد — معاين", 88],
  ["عبدالله عبدالمانع — معاين", 94],
  ["حسن عطية — معاين (متعاون)", 79],
  ["عبدالله الكثيري — مقيم", 85],
  ["محمد العساف — مقيم", 82],
];

function barTone(v: number): "success" | "primary" | "danger" {
  if (v >= 85) return "success";
  if (v >= 70) return "primary";
  return "danger";
}

function KpiList({ rows }: { rows: [string, number][] }) {
  return (
  <>
    {rows.map(([n, v]) => (
      <div key={n} className="mb-3.5 last:mb-0">
        <KpiRowLabel>
          <span>{n}</span>
          <span className="font-semibold">{v}%</span>
        </KpiRowLabel>
        <ProgressBar value={v} tone={barTone(v)} />
      </div>
    ))}
  </>
  );
}

export function KpiView() {
  return (
    <>
      <StatGrid>
        <StatCard accent="green">
          <StatLabel>معدل الإنجاز في الموعد</StatLabel>
          <StatValue value="89%" />
          <StatSub>هدف: 90%</StatSub>
        </StatCard>
        <StatCard accent="blue">
          <StatLabel>متوسط إنجاز العقار</StatLabel>
          <StatValue value="3.6 يوم" />
          <StatSub>هدف: أقل من 4</StatSub>
        </StatCard>
        <StatCard accent="warn">
          <StatLabel>معدل التعذرات</StatLabel>
          <StatValue value="3.8%" />
          <StatSub>هدف: أقل من 5%</StatSub>
        </StatCard>
        <StatCard>
          <StatLabel>عقارات مُنجزة اليوم</StatLabel>
          <StatValue value={43} />
          <StatSub>هدف: 40-50</StatSub>
        </StatCard>
      </StatGrid>
      <div className="grid grid-cols-2 gap-3">
        <SubpagePanel>
          <SubpageHeader title="أداء أخصائيي دراسة الحالة" />
          <div className="p-4">
            <KpiList rows={SPECIALIST_KPI} />
          </div>
        </SubpagePanel>
        <SubpagePanel>
          <SubpageHeader title="أداء مزودي الخدمة" />
          <div className="p-4">
            <KpiList rows={PROVIDER_KPI} />
          </div>
        </SubpagePanel>
      </div>
    </>
  );
}
