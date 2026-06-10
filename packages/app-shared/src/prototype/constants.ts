import type { NavItem, PageId, RoleDef, RoleId } from "@platform/types";
import { ACTIVE_TRANSACTIONS_NAV } from "./active-transactions";
import { SETTINGS_NAV } from "@platform/app-shared/prototype/settings-nav";
import { SYSTEM_FIELDS_NAV } from "@platform/app-shared/prototype/system-fields-nav";

export type { NavItem, PageId, RoleDef, RoleId };

/** Prototype / screen mock data — replace with API clients when backend is ready. */
export const STORAGE_ROLE_KEY = "evalPrototypeRole";
export const STORAGE_PERSONA_KEY = "evalPrototypePersona";

export type RoleOption = {
  group: string;
  value: RoleId;
  label: string;
  /** Unique key for React + role switcher (email when available). */
  id: string;
  email?: string;
};

export function roleOptionById(id: string): RoleOption | undefined {
  return ROLE_OPTIONS.find((o) => o.id === id);
}

export function roleOptionForEmail(email: string): RoleOption | undefined {
  const key = email.trim().toLowerCase();
  return ROLE_OPTIONS.find((o) => o.email?.trim().toLowerCase() === key);
}

export function defaultPersonaIdForRole(role: RoleId): string {
  return ROLE_OPTIONS.find((o) => o.value === role)?.id ?? role;
}

export function personaLabelName(personaId: string): string | null {
  const opt = roleOptionById(personaId);
  if (!opt) return null;
  const parts = opt.label.split(" — ");
  return parts[0]?.trim() ?? null;
}

export const ROLES: Record<RoleId, RoleDef> = {
  cdo: {
    name: "سليمان",
    dept: "المسؤول",
    init: "سل",
    bg: "var(--purple-bg)",
    tc: "var(--purple)",
    pages: ["dashboard"],
  },
  "hr-admin": {
    name: "آلاء قمصاني",
    dept: "أخصائية موارد بشرية",
    init: "آق",
    bg: "var(--info-bg)",
    tc: "var(--info)",
    pages: ["dashboard", "users", "messages"],
  },
  "proc-admin": {
    name: "علي الأمين",
    dept: "مدير المالية والعقود",
    init: "عل",
    bg: "var(--warning-bg)",
    tc: "var(--warning)",
    pages: ["dashboard", "users", "messages"],
  },
  "crm-admin": {
    name: "شهد العماري",
    dept: "مدير علاقات العملاء",
    init: "شع",
    bg: "var(--success-bg)",
    tc: "var(--success)",
    pages: ["dashboard", "users", "messages"],
  },
  "general-manager": {
    name: "سالم الغريب",
    dept: "مدير إدارة التقييم العقاري",
    init: "سغ",
    bg: "var(--info-bg)",
    tc: "var(--info)",
    pages: [
      "dashboard",
      "po",
      "active-primary-data",
      "bourse-inquiry",
      "active-distribution",
      "active-case-study",
      "survey",
      "keys",
      "failures",
      "valuation-requests",
      "messages",
      "financial",
      "kpi",
      "users",
      "courts",
      "failure-types",
      "case-study-info-roles",
    ],
  },
  "section-supervisor": {
    name: "عبدالرحمن النفيعي",
    dept: "مشرف قسم دراسة الحالة",
    init: "عن",
    bg: "var(--warning-bg)",
    tc: "var(--warning)",
    pages: [
      "dashboard",
      "po",
      "active-primary-data",
      "bourse-inquiry",
      "active-distribution",
      "active-case-study",
      "keys",
      "failures",
      "failure-types",
      "messages",
    ],
  },
  "case-specialist": {
    name: "أسامة الصالحي",
    dept: "أخصائي دراسة الحالة",
    init: "أص",
    bg: "var(--success-bg)",
    tc: "var(--success)",
    pages: [
      "dashboard",
      "po",
      "active-primary-data",
      "bourse-inquiry",
      "active-distribution",
      "active-case-study",
      "failures",
      "messages",
    ],
  },
  "valuation-coordinator": {
    name: "محمد دياب",
    dept: "منسق عمليات التقييم",
    init: "مد",
    bg: "var(--purple-bg)",
    tc: "var(--purple)",
    pages: ["dashboard", "valuation-coordination", "messages"],
  },
  "real-estate-appraiser": {
    name: "عبدالله الكثيري",
    dept: "مقيم عقاري",
    init: "عك",
    bg: "var(--info-bg)",
    tc: "var(--info)",
    pages: ["dashboard", "po", "property-appraisal", "messages"],
  },
  "field-inspector": {
    name: "أحمد سعيد",
    dept: "معاين ميداني",
    init: "أس",
    bg: "var(--info-bg)",
    tc: "var(--info)",
    pages: ["dashboard", "property-inspection", "messages"],
  },
  "government-reviewer": {
    name: "فراس كمرين",
    dept: "مراجع حكومي",
    init: "فك",
    bg: "var(--orange-bg)",
    tc: "var(--orange)",
    pages: ["dashboard", "government-review", "keys", "messages"],
  },
  "engineering-office": {
    name: "مكتب جدة للمساحة",
    dept: "مكتب هندسي — رفع مساحي",
    init: "جد",
    bg: "var(--purple-bg)",
    tc: "var(--purple)",
    pages: ["dashboard", "active-survey", "messages"],
  },
  "financial-officer": {
    name: "إيمان النهدي",
    dept: "موظف مالي — المالية والعقود",
    init: "إن",
    bg: "var(--danger-bg)",
    tc: "var(--danger)",
    pages: ["dashboard", "financial", "messages"],
  },
};

export const NAV: NavItem[] = [
  { id: "dashboard", label: "لوحة التحكم", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", grp: null },
  {
    id: "po",
    label: "أوامر العمل (PO)",
    icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
    grp: "قسم دراسة الحالة",
  },
  {
    id: "survey",
    label: "الرفع المساحي",
    icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z",
    grp: null,
    placeholder: true,
  },
  {
    id: "keys",
    label: "إدارة المفاتيح",
    icon: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
    grp: null,
    placeholder: true,
  },
  {
    id: "failures",
    label: "إدارة التعذرات",
    icon: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
    grp: null,
  },
  {
    id: "valuation-requests",
    label: "طلبات التقييم",
    icon: "M9 11l3 3L22 4",
    grp: "قسم التقييم العقاري",
    placeholder: true,
  },
  {
    id: "messages",
    label: "المراسلة الداخلية",
    icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
    grp: "عام",
    badge: "3",
    placeholder: true,
  },
  {
    id: "financial",
    label: "التقارير المالية",
    icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    grp: null,
    placeholder: true,
  },
  {
    id: "kpi",
    label: "مؤشرات الأداء",
    icon: "M18 20V10M12 20V4M6 20v-6",
    grp: null,
    placeholder: true,
  },
];

/** CDO (super admin) — union of every prototype route. Filled after NAV is defined. */
export const ALL_PROTOTYPE_PAGES: PageId[] = [
  ...new Set<PageId>([
    ...NAV.map((n) => n.id),
    ...ACTIVE_TRANSACTIONS_NAV.map((n) => n.id),
    ...SETTINGS_NAV.map((n) => n.id),
    ...SYSTEM_FIELDS_NAV.map((n) => n.id),
    "my-tasks",
    "properties",
  ]),
];

ROLES.cdo.pages = ALL_PROTOTYPE_PAGES;

export const PAGE_TITLES: Record<PageId, string> = {
  dashboard: "لوحة التحكم",
  "my-tasks": "تنفيذ المعاملة",
  "active-primary-data": "البيانات الأولية",
  "active-distribution": "توزيع المعاملات",
  "active-case-study": "",
  po: "أوامر العمل",
  "bourse-inquiry": "استعلام بورصة",
  properties: "العقارات",
  survey: "الرفع المساحي",
  keys: "إدارة المفاتيح",
  failures: "إدارة التعذرات",
  "valuation-requests": "طلبات التقييم",
  "field-form": "نموذج المعاين",
  "property-inspection": "معاينة العقار",
  "government-review": "المراجعة الحكومية",
  "valuation-coordination": "استلام التقييم",
  "property-appraisal": "تقييم العقار",
  "active-survey": "الرفع المساحي",
  messages: "المراسلة",
  financial: "التقارير المالية",
  kpi: "مؤشرات الأداء",
  users: "إدارة المستخدمين",
  courts: "المحاكم و الدوائر",
  "failure-types": "أنواع التعذرات",
  "system-tools": "ادوات النظام",
  "case-study-info-roles": "علاقة المستخدم بالمعلومة",
};

export const PAGE_BREADCRUMB: Record<PageId, string> = {
  dashboard: "الرئيسية",
  "my-tasks": "دراسة الحالة / المعاملات النشطة",
  "active-primary-data": "دراسة الحالة / المعاملات النشطة / البيانات الأولية",
  "active-distribution": "دراسة الحالة / المعاملات النشطة / توزيع المعاملات",
  "active-case-study": "دراسة الحالة / المعاملات النشطة / دراسة حالة العقارات",
  po: "دراسة الحالة",
  "bourse-inquiry": "دراسة الحالة / المعاملات النشطة / استعلام بورصة",
  properties: "دراسة الحالة",
  survey: "دراسة الحالة",
  keys: "دراسة الحالة",
  failures: "دراسة الحالة",
  "valuation-requests": "التقييم العقاري",
  "field-form": "التقييم العقاري",
  "property-inspection": "المعاملات النشطة / معاينة العقار",
  "government-review": "المعاملات النشطة / المراجعة الحكومية",
  "valuation-coordination": "المعاملات النشطة / استلام التقييم",
  "property-appraisal": "المعاملات النشطة / تقييم العقار",
  "active-survey": "المعاملات النشطة / الرفع المساحي",
  messages: "عام",
  financial: "المالية",
  kpi: "الإدارة",
  users: "الإدارة",
  courts: "جميع حقول النظام / المحاكم و الدوائر",
  "failure-types": "جميع حقول النظام / أنواع التعذرات",
  "system-tools": "جميع حقول النظام / ادوات النظام",
  "case-study-info-roles": "جميع حقول النظام / علاقة المستخدم بالمعلومة",
};

/** Mock rows aligned with `requirment/system_prototype_4.html` (PO / VR / عقارات). */
export type PoRow = {
  id: string;
  type: string;
  count: number;
  done: number;
  status: "progress" | "done" | "under_study";
  date: string;
  dueDate: string;
  specialist: string;
};

export type VrRow = {
  id: string;
  propId: string;
  area: string;
  type: string;
  appraiser: string;
  status: "done" | "progress";
  date: string;
};

export type PropertyWorkflowStage =
  | "new"
  | "progress"
  | "done"
  | "fail"
  | "incomplete";

export type PropertyRow = {
  id: string;
  po: string;
  area: string;
  type: string;
  key: boolean;
  survey: PropertyWorkflowStage;
  val: PropertyWorkflowStage;
  study: PropertyWorkflowStage;
  status: PropertyWorkflowStage;
  specialist: string;
};

export const MOCK_VR: VrRow[] = [
  { id: "VR-441", propId: "E-4401", area: "مكة المكرمة", type: "أرض", appraiser: "عبدالله الكثيري", status: "done", date: "2025-01-13" },
  { id: "VR-442", propId: "E-4402", area: "مكة المكرمة", type: "شقة", appraiser: "محمد العساف", status: "progress", date: "2025-01-14" },
  { id: "VR-443", propId: "E-4403", area: "جدة", type: "فيلا", appraiser: "عبدالله الكثيري", status: "done", date: "2025-01-12" },
  { id: "VR-444", propId: "E-4405", area: "الطائف", type: "عمارة", appraiser: "محمد العساف", status: "progress", date: "2025-01-14" },
];

export const MOCK_PROPERTIES: PropertyRow[] = [
  { id: "E-4401", po: "PO-2024-018", area: "مكة المكرمة", type: "أرض", key: false, survey: "done", val: "done", study: "progress", status: "progress", specialist: "أسامة الصالحي" },
  { id: "E-4402", po: "PO-2024-018", area: "مكة المكرمة", type: "شقة", key: true, survey: "progress", val: "progress", study: "new", status: "progress", specialist: "أسامة الصالحي" },
  { id: "E-4403", po: "PO-2024-016", area: "جدة", type: "فيلا", key: true, survey: "done", val: "done", study: "done", status: "done", specialist: "أيمن مجرشي" },
  { id: "E-4404", po: "PO-2024-016", area: "جدة", type: "أرض", key: false, survey: "new", val: "new", study: "new", status: "new", specialist: "أيمن مجرشي" },
  { id: "E-4405", po: "PO-2024-016", area: "الطائف", type: "عمارة", key: false, survey: "progress", val: "progress", study: "new", status: "progress", specialist: "وليد باشماخ" },
  { id: "E-4406", po: "PO-2024-018", area: "مكة المكرمة", type: "محل", key: false, survey: "done", val: "new", study: "new", status: "progress", specialist: "عمر الحمراني" },
  { id: "E-4407", po: "PO-2024-016", area: "جدة", type: "أرض", key: true, survey: "new", val: "new", study: "fail", status: "fail", specialist: "أيمن مجرشي" },
];

export type TeamKind = "internal" | "freelance" | "external";

export type TeamCardRow = [string, string, string, TeamKind, number];

export const DASHBOARD_TEAM_ROWS: TeamCardRow[] = [
  ["أس", "أحمد سعيد", "معاين — مكة المكرمة", "internal", 9],
  ["عم", "عبدالله عبدالمانع", "معاين — جدة", "internal", 11],
  ["حع", "حسن عطية", "معاين — الطائف (متعاون)", "freelance", 7],
  ["عك", "عبدالله الكثيري", "مقيم عقاري", "internal", 8],
  ["مع", "محمد العساف", "مقيم عقاري", "internal", 6],
  ["هـ", "مكاتب هندسية", "4 مكاتب معتمدة", "external", 16],
];

export type StaffUserDetail = {
  section: string;
  label: string;
  value: string;
};

export type StaffUser = {
  id: string;
  name: string;
  role: string;
  email: string;
  userName?: string;
  password?: string;
  type: "internal" | "freelance" | "external";
  source?: "hr" | "proc" | "crm";
  phone?: string | null;
  createdAt?: string;
  systemRoles?: string[];
  details?: StaffUserDetail[];
  registration?: Record<string, string>;
};

export type SurveyOfficeRow = {
  name: string;
  active: number;
  doneMonth: number;
  avgDays: string;
  contract: string;
  statusBusy: boolean;
};

export const MOCK_SURVEY_OFFICES: SurveyOfficeRow[] = [
  { name: "مكتب الرياض الهندسي", active: 12, doneMonth: 34, avgDays: "3.2 يوم", contract: "اتفاقية سنوية", statusBusy: false },
  { name: "مكتب جدة للمساحة", active: 8, doneMonth: 28, avgDays: "2.8 يوم", contract: "اتفاقية سنوية", statusBusy: false },
  { name: "مكتب مكة الهندسي", active: 7, doneMonth: 22, avgDays: "3.5 يوم", contract: "اتفاقية سنوية", statusBusy: false },
  { name: "مكتب الطائف التقني", active: 4, doneMonth: 14, avgDays: "4.1 يوم", contract: "اتفاقية سنوية", statusBusy: true },
];

export type MessagePreview = {
  from: string;
  dept: string;
  preview: string;
  time: string;
  unread: boolean;
};

export const MOCK_MESSAGES: MessagePreview[] = [
  { from: "عبدالرحمن النفيعي", dept: "دراسة الحالة", preview: "تم استلام PO-2024-018 — 12 عقاراً يرجى المتابعة", time: "18 د", unread: true },
  { from: "عبدالله الكثيري", dept: "التقييم العقاري", preview: "اكتمل تقييم E-4401 وتم رفع التقرير على النظام", time: "45 د", unread: true },
  { from: "مكتب الرياض الهندسي", dept: "مزود خارجي", preview: "استلمنا طلبات PO-2024-016 وسنبدأ غداً", time: "2 س", unread: false },
  { from: "إيمان النهدي", dept: "الشؤون المالية", preview: "التقرير المالي لشهر يناير جاهز للمراجعة", time: "3 س", unread: false },
  { from: "أحمد سعيد", dept: "التقييم العقاري", preview: "نموذج معاينة E-4402 مكتمل ومرسل", time: "أمس", unread: false },
];

export const VALID_PAGE_IDS = new Set<PageId>([
  ...NAV.map((n) => n.id),
  ...ACTIVE_TRANSACTIONS_NAV.map((n) => n.id),
  ...SETTINGS_NAV.map((n) => n.id),
  ...SYSTEM_FIELDS_NAV.map((n) => n.id),
  "my-tasks",
]);

export const ROLE_OPTIONS: RoleOption[] = [
  {
    group: "التحول الرقمي",
    value: "cdo",
    id: "s.salhy@gmail.com",
    email: "s.salhy@gmail.com",
    label: "سليمان — المسؤول",
  },
  {
    group: "إدارة المنظمة",
    value: "hr-admin",
    id: "a.alamin@gmail.com",
    email: "a.alamin@gmail.com",
    label: "آلاء قمصاني — الموارد البشرية",
  },
  {
    group: "إدارة المنظمة",
    value: "proc-admin",
    id: "a.alqadri@gmail.com",
    email: "a.alqadri@gmail.com",
    label: "علي الأمين — المالية والعقود",
  },
  {
    group: "إدارة المنظمة",
    value: "crm-admin",
    id: "g.abdo@gmail.com",
    email: "g.abdo@gmail.com",
    label: "شهد العماري — علاقات العملاء",
  },
  {
    group: "إدارة التقييم العقاري",
    value: "general-manager",
    id: "salam@ejadah.dev",
    email: "salam@ejadah.dev",
    label: "سالم الغريب — مدير إدارة التقييم العقاري",
  },
  {
    group: "قسم دراسة الحالة",
    value: "section-supervisor",
    id: "abdulrahman@ejadah.dev",
    email: "abdulrahman@ejadah.dev",
    label: "عبدالرحمن النفيعي — مشرف دراسة الحالة",
  },
  {
    group: "قسم دراسة الحالة",
    value: "case-specialist",
    id: "osama@ejadah.dev",
    email: "osama@ejadah.dev",
    label: "أسامة الصالحي — أخصائي دراسة الحالة",
  },
  {
    group: "قسم دراسة الحالة",
    value: "government-reviewer",
    id: "feras@ejadah.dev",
    email: "feras@ejadah.dev",
    label: "فراس كمرين — مراجع حكومي",
  },
  {
    group: "قسم التقييم العقاري",
    value: "valuation-coordinator",
    id: "valuation@ejadah.dev",
    email: "valuation@ejadah.dev",
    label: "محمد دياب — منسق عمليات التقييم",
  },
  {
    group: "قسم التقييم العقاري",
    value: "real-estate-appraiser",
    id: "abdullah.kathiri@ejadah.dev",
    email: "abdullah.kathiri@ejadah.dev",
    label: "عبدالله الكثيري — مقيم عقاري",
  },
  {
    group: "قسم التقييم العقاري",
    value: "field-inspector",
    id: "ahmed@ejadah.dev",
    email: "ahmed@ejadah.dev",
    label: "أحمد سعيد — معاين ميداني (متعاون)",
  },
  {
    group: "قسم التقييم العقاري",
    value: "field-inspector",
    id: "abdullah.abdulmane@ejadah.dev",
    email: "abdullah.abdulmane@ejadah.dev",
    label: "عبدالله عبدالمانع — معاين ميداني",
  },
  {
    group: "المالية والعقود",
    value: "financial-officer",
    id: "eman@ejadah.dev",
    email: "eman@ejadah.dev",
    label: "إيمان النهدي — موظف مالي",
  },
  {
    group: "مزود خارجي",
    value: "engineering-office",
    id: "survey.jeddah@ejadah.dev",
    email: "survey.jeddah@ejadah.dev",
    label: "مكتب جدة للمساحة — رفع مساحي",
  },
];
