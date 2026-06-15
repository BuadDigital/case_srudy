import {
  Badge,
  StatCard,
  StatGrid,
  StatLabel,
  StatValue,
  SubpageHeader,
  SubpagePanel,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@platform/design-system";

const REVENUE_ROWS = [
  { po: "PO-2024-014", billed: 8, excluded: 0, value: "18,400 ر", status: "done" as const },
  { po: "PO-2024-015", billed: 1, excluded: 0, value: "2,200 ر", status: "done" as const },
  { po: "PO-2024-017", billed: 3, excluded: 0, value: "6,600 ر", status: "done" as const },
  { po: "PO-2024-016", billed: 13, excluded: 2, value: "28,600 ر", status: "progress" as const },
];

const COST_ROWS = [
  { name: "مكتب الرياض الهندسي", type: "ext" as const, cost: "18,400 ر", cat: "رفع مساحي" },
  { name: "عبدالله الكثيري", type: "int" as const, cost: "12,000 ر", cat: "تقييم" },
  { name: "حسن عطية", type: "free" as const, cost: "3,200 ر", cat: "معاينة" },
];

function ContractBadge({ type }: { type: "ext" | "int" | "free" }) {
  const tone = type === "ext" ? "default" : type === "int" ? "info" : "warning";
  const label = type === "ext" ? "خارجي" : type === "int" ? "داخلي" : "متعاون";
  return (
    <Badge tone={tone} className="rounded-[20px] px-2.5 py-0.5 text-[11px] font-normal">
      {label}
    </Badge>
  );
}

export function FinancialView() {
  return (
    <>
      <StatGrid>
        <StatCard accent="blue">
          <StatLabel>إيرادات يناير</StatLabel>
          <StatValue value="312,400" className="text-xl" />
          <div className="mt-1 text-[10px] text-text-3">ريال سعودي</div>
        </StatCard>
        <StatCard accent="red">
          <StatLabel>تكاليف خارجية</StatLabel>
          <StatValue value="87,600" className="text-xl" />
          <div className="mt-1 text-[10px] text-text-3">مكاتب + متعاونون</div>
        </StatCard>
        <StatCard accent="green">
          <StatLabel>هامش الربح</StatLabel>
          <StatValue value="224,800" className="text-xl" />
          <div className="mt-1 text-[10px] text-text-3">72% من الإيرادات</div>
        </StatCard>
        <StatCard accent="warn">
          <StatLabel>مستحقات معلقة</StatLabel>
          <StatValue value="43,200" className="text-xl" />
          <div className="mt-1 text-[10px] text-text-3">ريال سعودي</div>
        </StatCard>
      </StatGrid>
      <div className="grid grid-cols-2 gap-3">
        <SubpagePanel>
          <SubpageHeader title="إيرادات إنفاذ" />
          <Table>
            <THead>
              <Tr hoverable={false}>
                <Th>PO</Th>
                <Th>مُفوتَرة</Th>
                <Th>مستثنيات</Th>
                <Th>القيمة</Th>
                <Th>الحالة</Th>
              </Tr>
            </THead>
            <TBody>
              {REVENUE_ROWS.map((r) => (
                <Tr key={r.po} hoverable={false}>
                  <Td className="text-[11px] font-semibold text-primary-light">{r.po}</Td>
                  <Td>{r.billed}</Td>
                  <Td>{r.excluded}</Td>
                  <Td>{r.value}</Td>
                  <Td>
                    {r.status === "done" ? (
                      <Badge tone="success" className="rounded-[20px] px-2.5 py-0.5 text-[11px] font-normal">
                        مُفوتَر
                      </Badge>
                    ) : (
                      <Badge tone="warning" className="rounded-[20px] px-2.5 py-0.5 text-[11px] font-normal">
                        جزئي
                      </Badge>
                    )}
                  </Td>
                </Tr>
              ))}
              <Tr hoverable={false} className="bg-surface-2 font-semibold">
                <Td colSpan={3}>الإجمالي</Td>
                <Td>55,800 ر</Td>
                <Td />
              </Tr>
            </TBody>
          </Table>
        </SubpagePanel>
        <SubpagePanel>
          <SubpageHeader title="تكاليف مزودي الخدمة" />
          <Table>
            <THead>
              <Tr hoverable={false}>
                <Th>المزود</Th>
                <Th>النوع</Th>
                <Th>التكلفة</Th>
                <Th>الفئة</Th>
              </Tr>
            </THead>
            <TBody>
              {COST_ROWS.map((r) => (
                <Tr key={r.name} hoverable={false}>
                  <Td className="font-medium">{r.name}</Td>
                  <Td>
                    <ContractBadge type={r.type} />
                  </Td>
                  <Td>{r.cost}</Td>
                  <Td>{r.cat}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </SubpagePanel>
      </div>
    </>
  );
}
