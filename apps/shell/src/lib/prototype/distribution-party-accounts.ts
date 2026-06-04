import type { RoleId } from "@platform/types";

export type DistributionAssignee = {
  id: string;
  name: string;
  subtitle?: string;
};

/** Users selectable in توزيع المعاملات — login + role switcher + task routing. */
export type DistributionPartyAccount = {
  assigneeId: string;
  name: string;
  subtitle: string;
  roleId: RoleId;
  email: string;
  password: string;
  roleOptionGroup: string;
  roleOptionLabel: string;
};

export const DISTRIBUTION_PARTY_ACCOUNTS: DistributionPartyAccount[] = [
  {
    assigneeId: "gov-firas",
    name: "فراس كمرين",
    subtitle: "مراجع حكومي — زيارة المحكمة وجمع المفاتيح",
    roleId: "government-reviewer",
    email: "feras@ejadah.dev",
    password: "EjadaCD2025!",
    roleOptionGroup: "قسم دراسة الحالة",
    roleOptionLabel: "فراس كمرين — مراجع حكومي",
  },
  {
    assigneeId: "vc-mohammed-diab",
    name: "محمد دياب",
    subtitle: "منسق عمليات التقييم",
    roleId: "valuation-coordinator",
    email: "valuation@ejadah.dev",
    password: "EjadaVC2025!",
    roleOptionGroup: "قسم التقييم العقاري",
    roleOptionLabel: "محمد دياب — منسق عمليات التقييم",
  },
  {
    assigneeId: "fi-ahmed",
    name: "أحمد سعيد",
    subtitle: "معاين ميداني",
    roleId: "field-inspector",
    email: "ahmed@ejadah.dev",
    password: "EjadaFI2025!",
    roleOptionGroup: "قسم التقييم العقاري",
    roleOptionLabel: "أحمد سعيد — معاين ميداني",
  },
  {
    assigneeId: "val-abdullah",
    name: "عبدالله الكثيري",
    subtitle: "مقيم عقاري",
    roleId: "real-estate-appraiser",
    email: "abdullah.kathiri@ejadah.dev",
    password: "EjadaRA2025!",
    roleOptionGroup: "قسم التقييم العقاري",
    roleOptionLabel: "عبدالله الكثيري — مقيم عقاري",
  },
  {
    assigneeId: "eo-jeddah",
    name: "مكتب جدة للمساحة",
    subtitle: "رفع مساحي",
    roleId: "engineering-office",
    email: "survey.jeddah@ejadah.dev",
    password: "EjadaEO2025!",
    roleOptionGroup: "الرفع المساحي",
    roleOptionLabel: "مكتب جدة للمساحة — مكتب هندسي",
  },
];

export const PROTOTYPE_ROLE_ASSIGNEE_ID: Partial<Record<RoleId, string>> =
  Object.fromEntries(
    DISTRIBUTION_PARTY_ACCOUNTS.map((a) => [a.roleId, a.assigneeId]),
  ) as Partial<Record<RoleId, string>>;

export function partyAccountByAssigneeId(
  assigneeId: string,
): DistributionPartyAccount | undefined {
  return DISTRIBUTION_PARTY_ACCOUNTS.find((a) => a.assigneeId === assigneeId);
}

export function partyAccountForRole(
  roleId: RoleId,
): DistributionPartyAccount | undefined {
  const expectedId = PROTOTYPE_ROLE_ASSIGNEE_ID[roleId];
  if (!expectedId) return undefined;
  return partyAccountByAssigneeId(expectedId);
}

function toAssignee(account: DistributionPartyAccount): DistributionAssignee {
  return {
    id: account.assigneeId,
    name: account.name,
    subtitle: account.subtitle,
  };
}

export const GOVERNMENT_AUDITORS: DistributionAssignee[] =
  DISTRIBUTION_PARTY_ACCOUNTS.filter((a) => a.roleId === "government-reviewer").map(
    toAssignee,
  );

export const VALUATION_COORDINATORS: DistributionAssignee[] =
  DISTRIBUTION_PARTY_ACCOUNTS.filter(
    (a) => a.roleId === "valuation-coordinator",
  ).map(toAssignee);

export const FIELD_INSPECTORS: DistributionAssignee[] =
  DISTRIBUTION_PARTY_ACCOUNTS.filter((a) => a.roleId === "field-inspector").map(
    toAssignee,
  );

export const VALUATORS: DistributionAssignee[] =
  DISTRIBUTION_PARTY_ACCOUNTS.filter(
    (a) => a.roleId === "real-estate-appraiser",
  ).map(toAssignee);

export const ENGINEERING_OFFICES: DistributionAssignee[] =
  DISTRIBUTION_PARTY_ACCOUNTS.filter(
    (a) => a.roleId === "engineering-office",
  ).map(toAssignee);
