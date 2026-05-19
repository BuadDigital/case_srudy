import type { NavItem, PageId, RoleDef, RoleId } from "@platform/types";

export type { NavItem, PageId, RoleDef, RoleId };

/** Prototype / screen mock data — replace with API clients when backend is ready. */
export const STORAGE_ROLE_KEY = "evalPrototypeRole";

export const ROLES: Record<RoleId, RoleDef> = {
  "general-manager": {
    name: "سالم الغريب",
    dept: "مدير الإدارة العام",
    init: "سغ",
    bg: "var(--info-bg)",
    tc: "var(--info)",
    pages: [
      "dashboard",
      "po",
      "properties",
      "assignment",
      "survey",
      "keys",
      "failures",
      "valuation-requests",
      "field-form",
      "messages",
      "financial",
      "kpi",
      "users",
      "courts",
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
      "properties",
      "assignment",
      "survey",
      "keys",
      "failures",
      "valuation-requests",
      "messages",
      "financial",
      "kpi",
      "users",
      "courts",
    ],
  },
  "operations-coordinator": {
    name: "منسق العمليات",
    dept: "قسم دراسة الحالة",
    init: "من",
    bg: "var(--purple-bg)",
    tc: "var(--purple)",
    pages: ["dashboard", "po", "properties", "assignment", "survey", "messages"],
  },
  "case-specialist": {
    name: "أسامة الصالحي",
    dept: "أخصائي دراسة الحالة",
    init: "أص",
    bg: "var(--success-bg)",
    tc: "var(--success)",
    pages: ["dashboard", "po", "properties", "failures", "messages"],
  },
  "report-preparer": {
    name: "صالح الحبشي",
    dept: "معد التقرير",
    init: "صح",
    bg: "var(--success-bg)",
    tc: "var(--success)",
    pages: ["dashboard", "properties", "messages"],
  },
  "court-delegate": {
    name: "فراس كمرين",
    dept: "مندوب المحكمة",
    init: "فك",
    bg: "var(--orange-bg)",
    tc: "var(--orange)",
    pages: ["dashboard", "keys", "messages"],
  },
  "valuation-coordinator": {
    name: "منسق التقييم",
    dept: "قسم التقييم العقاري",
    init: "قت",
    bg: "var(--purple-bg)",
    tc: "var(--purple)",
    pages: ["dashboard", "valuation-requests", "messages"],
  },
  "real-estate-appraiser": {
    name: "عبدالله الكثيري",
    dept: "مقيم عقاري",
    init: "عك",
    bg: "var(--info-bg)",
    tc: "var(--info)",
    pages: ["dashboard", "valuation-requests", "messages"],
  },
  "field-inspector": {
    name: "أحمد سعيد",
    dept: "معاين ميداني",
    init: "أس",
    bg: "var(--info-bg)",
    tc: "var(--info)",
    pages: ["dashboard", "field-form", "messages"],
  },
  "financial-officer": {
    name: "إيمان النهدي",
    dept: "موظف الشؤون المالية",
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
  { id: "properties", label: "العقارات", icon: "M3 3h18v18H3z", grp: null },
  {
    id: "assignment",
    label: "الإسناد والتوزيع",
    icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
    grp: null,
  },
  { id: "survey", label: "الرفع المساحي", icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z", grp: null },
  {
    id: "keys",
    label: "إدارة المفاتيح",
    icon: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
    grp: null,
  },
  {
    id: "failures",
    label: "إدارة التعذرات",
    icon: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
    grp: null,
    badge: "5",
  },
  {
    id: "valuation-requests",
    label: "طلبات التقييم",
    icon: "M9 11l3 3L22 4",
    grp: "قسم التقييم العقاري",
  },
  {
    id: "field-form",
    label: "نموذج المعاين",
    icon: "M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 0 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    grp: null,
  },
  {
    id: "messages",
    label: "المراسلة الداخلية",
    icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
    grp: "عام",
    badge: "3",
  },
  {
    id: "financial",
    label: "التقارير المالية",
    icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    grp: null,
  },
  { id: "kpi", label: "مؤشرات الأداء", icon: "M18 20V10M12 20V4M6 20v-6", grp: null },
  {
    id: "users",
    label: "إدارة المستخدمين",
    icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    grp: null,
  },
  {
    id: "courts",
    label: "المحاكم والدوائر",
    icon: "M3 21h18M5 21V7l8-4 8 4v14M9 21v-6h6v6",
    grp: "الإدارة",
  },
];

export const PAGE_TITLES: Record<PageId, string> = {
  dashboard: "لوحة التحكم",
  po: "أوامر العمل",
  properties: "العقارات",
  assignment: "الإسناد والتوزيع",
  survey: "الرفع المساحي",
  keys: "إدارة المفاتيح",
  failures: "إدارة التعذرات",
  "valuation-requests": "طلبات التقييم",
  "field-form": "نموذج المعاين",
  messages: "المراسلة",
  financial: "التقارير المالية",
  kpi: "مؤشرات الأداء",
  users: "إدارة المستخدمين",
  courts: "المحاكم والدوائر",
};

export const PAGE_BREADCRUMB: Record<PageId, string> = {
  dashboard: "الرئيسية",
  po: "دراسة الحالة",
  properties: "دراسة الحالة",
  assignment: "دراسة الحالة",
  survey: "دراسة الحالة",
  keys: "دراسة الحالة",
  failures: "دراسة الحالة",
  "valuation-requests": "التقييم العقاري",
  "field-form": "التقييم العقاري",
  messages: "عام",
  financial: "المالية",
  kpi: "الإدارة",
  users: "الإدارة",
  courts: "الإدارة",
};

/** Mock rows aligned with `requirment/system_prototype_4.html` (PO / VR / عقارات). */
export type PoRow = {
  id: string;
  type: string;
  count: number;
  done: number;
  status: "progress" | "done";
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

export type PropertyWorkflowStage = "new" | "progress" | "done" | "fail";

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
  preparer: string;
};

export const MOCK_PO: PoRow[] = [
  { id: "PO-2024-018", type: "قضائي", count: 12, done: 8, status: "progress", date: "2025-01-14", dueDate: "2025-01-20", specialist: "أسامة الصالحي" },
  { id: "PO-2024-017", type: "خاص", count: 3, done: 3, status: "done", date: "2025-01-13", dueDate: "2025-01-19", specialist: "عمر الحمراني" },
  { id: "PO-2024-016", type: "قضائي", count: 27, done: 14, status: "progress", date: "2025-01-12", dueDate: "2025-01-18", specialist: "أيمن مجرشي" },
  { id: "PO-2024-015", type: "خاص", count: 1, done: 1, status: "done", date: "2025-01-11", dueDate: "2025-01-17", specialist: "وليد باشماخ" },
];

export const MOCK_VR: VrRow[] = [
  { id: "VR-441", propId: "E-4401", area: "مكة المكرمة", type: "أرض", appraiser: "عبدالله الكثيري", status: "done", date: "2025-01-13" },
  { id: "VR-442", propId: "E-4402", area: "مكة المكرمة", type: "شقة", appraiser: "محمد العساف", status: "progress", date: "2025-01-14" },
  { id: "VR-443", propId: "E-4403", area: "جدة", type: "فيلا", appraiser: "عبدالله الكثيري", status: "done", date: "2025-01-12" },
  { id: "VR-444", propId: "E-4405", area: "الطائف", type: "عمارة", appraiser: "محمد العساف", status: "progress", date: "2025-01-14" },
];

export const MOCK_PROPERTIES: PropertyRow[] = [
  { id: "E-4401", po: "PO-2024-018", area: "مكة المكرمة", type: "أرض", key: false, survey: "done", val: "done", study: "progress", status: "progress", specialist: "أسامة الصالحي", preparer: "صالح الحبشي" },
  { id: "E-4402", po: "PO-2024-018", area: "مكة المكرمة", type: "شقة", key: true, survey: "progress", val: "progress", study: "new", status: "progress", specialist: "أسامة الصالحي", preparer: "أيمن بن محفوظ" },
  { id: "E-4403", po: "PO-2024-016", area: "جدة", type: "فيلا", key: true, survey: "done", val: "done", study: "done", status: "done", specialist: "أيمن مجرشي", preparer: "صالح الحبشي" },
  { id: "E-4404", po: "PO-2024-016", area: "جدة", type: "أرض", key: false, survey: "new", val: "new", study: "new", status: "new", specialist: "أيمن مجرشي", preparer: "أيمن بن محفوظ" },
  { id: "E-4405", po: "PO-2024-016", area: "الطائف", type: "عمارة", key: false, survey: "progress", val: "progress", study: "new", status: "progress", specialist: "وليد باشماخ", preparer: "صالح الحبشي" },
  { id: "E-4406", po: "PO-2024-018", area: "مكة المكرمة", type: "محل", key: false, survey: "done", val: "new", study: "new", status: "progress", specialist: "عمر الحمراني", preparer: "أيمن بن محفوظ" },
  { id: "E-4407", po: "PO-2024-016", area: "جدة", type: "أرض", key: true, survey: "new", val: "new", study: "fail", status: "fail", specialist: "أيمن مجرشي", preparer: "صالح الحبشي" },
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

export type FailureItem = {
  id: string;
  po: string;
  title: string;
  status: "review" | "pending" | "approved";
  body: string;
  specialist: string;
  date: string;
};

export const MOCK_FAILURES: FailureItem[] = [
  {
    id: "E-4407",
    po: "PO-2024-016",
    title: "تعارض في بيانات الصك والمخطط",
    status: "review",
    body: "تعارض بين مساحة الصك (800م²) والمخطط الهندسي (650م²). يحتاج مراجعة من المكتب الهندسي.",
    specialist: "أيمن مجرشي",
    date: "2025-01-14",
  },
  {
    id: "E-3901",
    po: "PO-2024-011",
    title: "عدم استجابة العميل لتسليم الوثائق",
    status: "pending",
    body: "طُلب تقديم وثيقة السكن منذ 5 أيام دون استجابة. ثلاث محاولات تواصل فاشلة.",
    specialist: "أسامة الصالحي",
    date: "2025-01-12",
  },
  {
    id: "E-3756",
    po: "PO-2024-009",
    title: "ندرة البيانات السوقية في المنطقة",
    status: "approved",
    body: "لا توجد معاملات عقارية في المنطقة خلال 24 شهراً مما يتعذر معه التقييم السوقي.",
    specialist: "وليد باشماخ",
    date: "2025-01-10",
  },
];

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
  { from: "عبدالله البسيوني", dept: "دراسة الحالة", preview: "تم استلام PO-2024-018 — 12 عقاراً يرجى المتابعة", time: "18 د", unread: true },
  { from: "عبدالله الكثيري", dept: "التقييم العقاري", preview: "اكتمل تقييم E-4401 وتم رفع التقرير على النظام", time: "45 د", unread: true },
  { from: "مكتب الرياض الهندسي", dept: "مزود خارجي", preview: "استلمنا طلبات PO-2024-016 وسنبدأ غداً", time: "2 س", unread: false },
  { from: "إيمان النهدي", dept: "الشؤون المالية", preview: "التقرير المالي لشهر يناير جاهز للمراجعة", time: "3 س", unread: false },
  { from: "أحمد سعيد", dept: "التقييم العقاري", preview: "نموذج معاينة E-4402 مكتمل ومرسل", time: "أمس", unread: false },
];

export const VALID_PAGE_IDS = new Set<PageId>(NAV.map((n) => n.id));

export const ROLE_OPTIONS: { group: string; value: RoleId; label: string }[] = [
  { group: "الإدارة", value: "general-manager", label: "سالم الغريب — مدير الإدارة" },
  { group: "الإدارة", value: "section-supervisor", label: "عبدالرحمن النفيعي — مشرف دراسة الحالة" },
  { group: "قسم دراسة الحالة", value: "operations-coordinator", label: "منسق العمليات" },
  { group: "قسم دراسة الحالة", value: "case-specialist", label: "أخصائي دراسة الحالة" },
  { group: "قسم دراسة الحالة", value: "report-preparer", label: "معد التقرير" },
  { group: "قسم دراسة الحالة", value: "court-delegate", label: "مندوب المحكمة" },
  { group: "قسم التقييم العقاري", value: "valuation-coordinator", label: "منسق عمليات التقييم" },
  { group: "قسم التقييم العقاري", value: "real-estate-appraiser", label: "مقيم عقاري" },
  { group: "قسم التقييم العقاري", value: "field-inspector", label: "معاين ميداني" },
  { group: "المالية", value: "financial-officer", label: "إيمان النهدي — موظف مالي" },
];
