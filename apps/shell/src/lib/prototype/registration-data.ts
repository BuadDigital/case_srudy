export type RegistrationSource = "hr" | "proc" | "crm";

export type OrgDeptDef = {
  subs: string[];
  execOnly?: boolean;
};

export const ORG: Record<string, OrgDeptDef> = {
  "الإدارة التنفيذية": { subs: [], execOnly: true },
  "إدارة التقييم العقاري": {
    subs: ["قسم تقييم الأفراد", "قسم تقييم المشاريع", "قسم دراسة الحالة"],
  },
  "الإدارة المالية": { subs: ["قسم المحاسبة"] },
  "إدارة الجودة": { subs: [] },
};

export const JOB_TITLES: Record<string, string[]> = {
  "قسم دراسة الحالة": [
    "مشرف قسم دراسة الحالة",
    "منسق العمليات",
    "مراجع حكومي",
    "أخصائي دراسة حالة",
    "مدخل بيانات",
  ],
  "قسم تقييم الأفراد": [
    "مقيم عقاري",
    "معاين ميداني",
    "منسق عمليات التقييم",
  ],
  "قسم تقييم المشاريع": [
    "مقيم مشاريع",
    "منسق تقييم المشاريع",
    "أخصائي تقييم",
  ],
  "قسم المحاسبة": ["محاسب", "مدير محاسبة"],
};

export const EMP_TYPES = [
  "دوام كامل",
  "دوام جزئي",
  "عن بعد",
  "متعاون",
  "مؤقت",
  "متدرب",
  "معار",
];

export const SERVICES = [
  "معاينة ميدانية",
  "مراجعة حكومية",
  "خدمة هندسية",
  "مسح ميداني",
  "استشارات",
  "أخرى",
];

export const REGIONS = [
  "الرياض",
  "مكة المكرمة",
  "المدينة المنورة",
  "القصيم",
  "المنطقة الشرقية",
  "عسير",
  "تبوك",
  "حائل",
  "جازان",
  "نجران",
  "الباحة",
  "الجوف",
];

export const SECTORS = [
  "عقاري",
  "صناعي",
  "تجاري",
  "خدمي",
  "حكومي",
  "مقاولات",
  "أخرى",
];

export const PERMS = ["مدير", "مشرف", "محرر", "قارئ"];

export const HR_STEPS = [
  "نوع التوظيف والهيكل",
  "البيانات الشخصية",
  "بيانات الحساب",
  "مراجعة وحفظ",
];

export const HR_HINTS = [
  "اختر نوع التوظيف والإدارة",
  "بيانات الموظف الشخصية",
  "إعداد حساب الدخول",
  "راجع ثم احفظ",
];

export const ENTITY_SUBTITLES: Record<RegistrationSource, string> = {
  hr: "entity_owner: HR · entity_type: employee",
  proc: "entity_owner: PROCUREMENT · entity_type: provider_ind / provider_org",
  crm: "entity_owner: CRM · entity_type: lead / client",
};

export const PROC_STEPS_IND = [
  "نوع مقدم الخدمة",
  "البيانات الأساسية",
  "الخدمة والفوترة",
  "مراجعة وحفظ",
];

export const PROC_STEPS_ORG = [
  "نوع مقدم الخدمة",
  "بيانات الجهة",
  "فريق الإدارة والفرق",
  "الفوترة",
  "مراجعة وحفظ",
];

export const CRM_STEPS = [
  "تصنيف العميل",
  "البيانات الأساسية",
  "بيانات إضافية",
  "مراجعة وحفظ",
];

export const CRM_HINTS = [
  "اختر حالة العميل ونوع الكيان",
  "البيانات الأساسية للعميل",
  "معلومات إضافية وجهة التواصل",
  "راجع ثم احفظ",
];

export type PortalCard = {
  source: RegistrationSource;
  icon: string;
  dept: string;
  title: string;
  desc: string;
  tags: string[];
};

export const PORTAL_CARDS: PortalCard[] = [
  {
    source: "hr",
    icon: "HR",
    dept: "الموارد البشرية · HR",
    title: "تسجيل موظف",
    desc: "لتسجيل جميع أنواع الموظفين الداخليين المرتبطين بالهيكل التنظيمي للشركة",
    tags: ["دوام كامل", "جزئي", "عن بعد", "متعاون", "متدرب", "معار"],
  },
  {
    source: "proc",
    icon: "PROC",
    dept: "العقود والمشتريات · PROC",
    title: "تسجيل مقدم خدمة",
    desc: "لتسجيل الأفراد المستقلين والجهات الخارجية المزودة للخدمات والعقود",
    tags: ["فرد مستقل", "جهة / مؤسسة", "فرق تشغيلية", "فوترة"],
  },
  {
    source: "crm",
    icon: "CRM",
    dept: "علاقات العملاء · CRM",
    title: "تسجيل عميل",
    desc: "لتسجيل العملاء المحتملين والفعليين — أفراد أو شركات — بعقد أو مباشرة",
    tags: ["عميل محتمل", "عميل فعلي", "فرد", "شركة"],
  },
];

export const FLOW_META: Record<
  RegistrationSource,
  {
    flowClass: string;
    dept: string;
    title: string;
    desc: string;
    sideTypes: string[];
  }
> = {
  hr: {
    flowClass: "reg-flow-hr",
    dept: "الموارد البشرية · HR",
    title: "تسجيل موظف داخلي",
    desc: "يتم تسجيل الموظف ومنحه حساباً في النظام وفق الإدارة والقسم المحددين في الهيكل التنظيمي.",
    sideTypes: [
      "دوام كامل / جزئي / عن بعد",
      "متعاون داخلي",
      "متدرب / مؤقت / معار",
    ],
  },
  proc: {
    flowClass: "reg-flow-proc",
    dept: "العقود والمشتريات · PROC",
    title: "تسجيل مقدم خدمة",
    desc: "يُسجَّل مقدم الخدمة ويُربط بعقد أو اتفاقية، والفوترة تكون على مستوى الفرد أو الجهة.",
    sideTypes: [
      "فرد مستقل (معاين، مراجع...)",
      "جهة / مكتب هندسي",
      "فرق تشغيلية تابعة للجهة",
    ],
  },
  crm: {
    flowClass: "reg-flow-crm",
    dept: "علاقات العملاء · CRM",
    title: "تسجيل عميل",
    desc: "يُسجَّل العميل ويُحدَّد تصنيفه — محتمل أو فعلي، مباشر أو بعقد — لمتابعة دورة حياته في النظام.",
    sideTypes: [
      "عميل محتمل (Lead)",
      "عميل فعلي — مباشر / بعقد",
      "فرد / شركة / مؤسسة",
    ],
  },
};
