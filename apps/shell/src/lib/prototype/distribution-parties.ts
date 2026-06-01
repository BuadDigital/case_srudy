/** Mock assignees for توزيع المعاملات (active system users). */

export type DistributionAssignee = {
  id: string;
  name: string;
  subtitle?: string;
};

export const GOVERNMENT_AUDITORS: DistributionAssignee[] = [
  {
    id: "gov-khalid",
    name: "خالد المرشدي",
    subtitle: "مراجع حكومي — زيارة المحكمة وجمع المفاتيح",
  },
  {
    id: "gov-saad",
    name: "سعد الحربي",
    subtitle: "مراجع حكومي",
  },
];

export const VALUATION_COORDINATORS: DistributionAssignee[] = [
  {
    id: "vc-fahd",
    name: "فهد العتيبي",
    subtitle: "منسق عمليات التقييم",
  },
  {
    id: "vc-nora",
    name: "نورة الشهري",
    subtitle: "منسق عمليات التقييم",
  },
];

export const FIELD_INSPECTORS: DistributionAssignee[] = [
  { id: "fi-ahmed", name: "أحمد سعيد", subtitle: "معاين ميداني" },
  { id: "fi-yousef", name: "يوسف القحطاني", subtitle: "معاين ميداني" },
];

export const VALUATORS: DistributionAssignee[] = [
  { id: "val-abdullah", name: "عبدالله الكثيري", subtitle: "مقيم عقاري" },
  { id: "val-maha", name: "مها السبيعي", subtitle: "مقيم عقاري" },
];

export const ENGINEERING_OFFICES: DistributionAssignee[] = [
  {
    id: "eo-riyadh",
    name: "مكتب الرياض الهندسي",
    subtitle: "رفع مساحي — cadastral",
  },
  {
    id: "eo-jeddah",
    name: "مكتب جدة للمساحة",
    subtitle: "رفع مساحي",
  },
  {
    id: "eo-makkah",
    name: "مكتب مكة المكرمة المساحي",
    subtitle: "رفع مساحي",
  },
];

export function assigneeLabel(
  list: DistributionAssignee[],
  id: string,
): string {
  if (!id.trim()) return "";
  return list.find((a) => a.id === id)?.name ?? "";
}
