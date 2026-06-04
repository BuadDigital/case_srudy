/**
 * فهرس شاشات وحقل PO — مصدر الحقيقة لصفحة «ادوات النظام».
 */
import {
  ASSIGNMENT_TYPE_OPTIONS,
  BOUNDARIES_AVAILABILITY_OPTIONS,
  BOURSE_INQUIRY_IDENTIFIER_STATUS,
  CITY_OPTIONS,
  CLASSIFICATION_OPTIONS,
  CONTACT_ROLE_OPTIONS,
  COURTS_BY_CITY,
  DEED_STATUS_OPTIONS,
  PROPERTY_CLASSIFICATIONS,
  RESTRICTIONS_PRESENT_OPTIONS,
} from "@/lib/prototype/po-intake-data";

const COURT_CITY_CHOICES = Object.keys(COURTS_BY_CITY);

export type CatalogFieldKind =
  | "text"
  | "email"
  | "number"
  | "date"
  | "select"
  | "file"
  | "display"
  | "badge";

export type CatalogField = {
  key: string;
  label: string;
  kind: CatalogFieldKind;
  choices?: string[];
  required?: boolean;
  note?: string;
};

export type CatalogScreen = {
  id: string;
  title: string;
  summary: string;
  stats?: string[];
  tableColumns?: string[];
  actions?: string[];
  fields: CatalogField[];
};

export type CatalogModule = {
  id: string;
  title: string;
  summary: string;
  screens: CatalogScreen[];
};

const PROPERTY_TYPE_CHOICES = [
  ...new Set(Object.values(PROPERTY_CLASSIFICATIONS).flat()),
];

const BOUNDARY_LABELS = BOUNDARIES_AVAILABILITY_OPTIONS.map((o) => o.label);
const RESTRICTION_LABELS = RESTRICTIONS_PRESENT_OPTIONS.map((o) => o.label);

const ENFATH_FIELDS: CatalogField[] = [
  {
    key: "identifier_type",
    label: "مصدر البيانات",
    kind: "select",
    choices: ["صك ملكية", "تسجيل عيني", "البورصة العقاريه"],
    required: true,
  },
  {
    key: "deed_number",
    label: "رقم الصك / رقم التسجيل العيني",
    kind: "text",
    required: true,
  },
  { key: "task_number", label: "رقم المهمة", kind: "text", required: true },
  { key: "deed_date", label: "تاريخ الصك", kind: "date", required: true },
  { key: "owner_name", label: "اسم المالك", kind: "text", required: true },
  {
    key: "court",
    label: "المحكمة",
    kind: "select",
    choices: COURT_CITY_CHOICES,
    note: "تُختار من قوائم المحاكم حسب المدينة — مسار التنفيذ والبورصة",
  },
  {
    key: "circuit",
    label: "الدائرة",
    kind: "text",
    note: "تعتمد على المحكمة المختارة",
  },
  {
    key: "delegation_letter",
    label: "خطاب التفويض",
    kind: "file",
    required: true,
    note: "PDF / JPG / PNG — غير مطلوب لمسار البورصة",
  },
  {
    key: "real_estate_reg_file",
    label: "السجل العقاري (مرفق)",
    kind: "file",
    required: true,
    note: "مسار التسجيل العيني فقط",
  },
  {
    key: "assignment_doc",
    label: "قرار الإسناد",
    kind: "file",
    note: "إلزامي لنوع إسناد «تنفيذ»",
  },
  {
    key: "other_docs",
    label: "مستندات أخرى",
    kind: "file",
    note: "اختياري — متعدد",
  },
  {
    key: "contact_name",
    label: "ضابط الاتصال — الاسم",
    kind: "text",
    required: true,
  },
  {
    key: "contact_role",
    label: "ضابط الاتصال — الصفة",
    kind: "select",
    choices: [...CONTACT_ROLE_OPTIONS],
    required: true,
  },
  {
    key: "contact_phone",
    label: "ضابط الاتصال — الجوال",
    kind: "text",
    required: true,
  },
  {
    key: "contacts",
    label: "ضباط الاتصال (قائمة)",
    kind: "display",
    note: "متعدد: اسم · صفة · جوال — يُستورد من صك سابق عند التطابق",
  },
];

const PROPERTY_FILE_FIELDS: CatalogField[] = [
  {
    key: "assignment_doc_file_name",
    label: "قرار الإسناد (اسم الملف)",
    kind: "file",
  },
  {
    key: "delegation_letter_file_name",
    label: "خطاب التفويض (اسم الملف)",
    kind: "file",
  },
  {
    key: "real_estate_reg_file_name",
    label: "السجل العقاري (اسم الملف)",
    kind: "file",
  },
  {
    key: "other_document_file_names",
    label: "مستندات أخرى (أسماء)",
    kind: "file",
    note: "قائمة متعددة",
  },
  {
    key: "bourse_data_completed",
    label: "اكتمال بيانات البورصة",
    kind: "badge",
    choices: ["مكتملة", "بانتظار الإكمال"],
  },
];

const BOURSE_FIELDS: CatalogField[] = [
  {
    key: "city",
    label: "المدينة",
    kind: "select",
    choices: [...CITY_OPTIONS],
    required: true,
  },
  { key: "district", label: "الحي", kind: "text", required: true },
  {
    key: "classification",
    label: "التصنيف",
    kind: "select",
    choices: CLASSIFICATION_OPTIONS,
    required: true,
  },
  {
    key: "property_type",
    label: "نوع العقار",
    kind: "select",
    choices: PROPERTY_TYPE_CHOICES,
    required: true,
    note: "5 تصنيفات / 47 نوعاً",
  },
  { key: "area", label: "المساحة", kind: "text" },
  {
    key: "deed_status",
    label: "حالة الصك",
    kind: "select",
    choices: [...DEED_STATUS_OPTIONS],
  },
  {
    key: "restrictions_present",
    label: "القيود على العقار",
    kind: "select",
    choices: RESTRICTION_LABELS,
  },
  {
    key: "boundaries_availability",
    label: "توفر الحدود",
    kind: "select",
    choices: BOUNDARY_LABELS,
  },
  {
    key: "boundaries_external_doc_name",
    label: "المستند الخارجي للحدود",
    kind: "text",
    note: "عند «مستند خارجي»",
  },
];

export const PO_MODULE: CatalogModule = {
  id: "po",
  title: "PO — أوامر العمل",
  summary:
    "استلام وتتبع أوامر العمل من إنفاذ وعقارات كل أمر — من القائمة حتى التفاصيل والتعذر.",
  screens: [
    {
      id: "po-list",
      title: "أوامر العمل الواردة من إنفاذ",
      summary: "القائمة الرئيسية مع إحصائيات وإجراءات الاستلام والتعديل.",
      stats: [
        "PO نشطة",
        "مكتملة هذا الشهر",
        "عقارات نشطة",
        "متوسط العقارات/PO",
      ],
      tableColumns: [
        "رقم PO",
        "نوع الإسناد",
        "العقارات",
        "المكتملة",
        "التقدم",
        "الحالة",
        "تاريخ الاستلام",
        "تاريخ الاستحقاق",
        "الأخصائي",
      ],
      actions: [
        "+ تسجيل PO جديد (مشرف)",
        "عرض العقارات (عين)",
        "تعديل رأس PO (مشرف)",
        "حذف PO (مشرف)",
      ],
      fields: [
        {
          key: "assignment_type",
          label: "نوع الإسناد",
          kind: "badge",
          choices: [...ASSIGNMENT_TYPE_OPTIONS],
        },
        {
          key: "status",
          label: "حالة أمر العمل (StatusBadge)",
          kind: "badge",
          choices: ["قيد التنفيذ", "مكتمل", "قيد الدراسة"],
          note: "progress · done · under_study",
        },
      ],
    },
    {
      id: "po-intake",
      title: "تسجيل أمر عمل (PO) جديد",
      summary:
        "استلام أمر عمل جديد — بعد الحفظ ينتقل مباشرة إلى عقارات الأمر.",
      actions: ["بعد الحفظ: عقارات أمر العمل"],
      fields: [
        { key: "po_number", label: "رقم التعميد (PO)", kind: "text", required: true },
        { key: "promulgation_date", label: "تاريخ التعميد", kind: "date", required: true },
        {
          key: "assignment_specialist",
          label: "اسم أخصائي الإسناد",
          kind: "text",
          required: true,
        },
        {
          key: "assignment_specialist_email",
          label: "إيميل أخصائي الإسناد",
          kind: "email",
          required: true,
        },
        {
          key: "assignment_type",
          label: "نوع الإسناد",
          kind: "select",
          choices: [...ASSIGNMENT_TYPE_OPTIONS],
          required: true,
        },
        {
          key: "expected_property_count",
          label: "عدد العقارات",
          kind: "number",
          required: true,
        },
        {
          key: "received_from_enfath_at",
          label: "تاريخ/وقت الاستلام",
          kind: "display",
          note: "يُحسب عند الحفظ الأول (receivedFromEnfathAt + Time)",
        },
        {
          key: "due_date_at",
          label: "تاريخ الاستحقاق",
          kind: "display",
          note: "4 أيام عمل من الاستلام",
        },
      ],
    },
    {
      id: "po-properties",
      title: "عقارات أمر العمل",
      summary: "قائمة عقارات أمر واحد مع الاستحقاق وإضافة عقار.",
      stats: ["الأخصائي", "تاريخ الاستحقاق", "استلام إنفاذ"],
      tableColumns: [
        "رقم الصك",
        "الموقع",
        "التصنيف / النوع",
        "حالة الصك",
        "الحالة (مسار / بانتظار البورصة)",
        "عرض (عين)",
        "تعديل / تعذر (أخصائي)",
      ],
      actions: [
        "+ إضافة عقار",
        "عرض التفاصيل",
        "تعديل",
        "تسجيل تعذر",
      ],
      fields: [
        {
          key: "assignment_type",
          label: "نوع إسناد الأمر",
          kind: "badge",
          choices: [...ASSIGNMENT_TYPE_OPTIONS],
        },
        {
          key: "property_row_status",
          label: "حالة العقار في الجدول",
          kind: "badge",
          choices: [
            "جديد",
            "قيد التنفيذ",
            "متعذر",
            "ناقص",
            "بانتظار البورصة",
          ],
          note: "new · progress · fail · incomplete — أو شارة بورصة",
        },
        {
          key: "deed_status",
          label: "حالة الصك في الصف",
          kind: "badge",
          choices: [...DEED_STATUS_OPTIONS],
        },
      ],
    },
    {
      id: "po-header-edit",
      title: "تعديل رأس أمر العمل",
      summary: "تعديل بيانات PO دون تعديل العقارات.",
      fields: [
        { key: "po_number", label: "رقم PO", kind: "display", note: "غير قابل للتعديل" },
        { key: "promulgation_date", label: "تاريخ التعميد", kind: "date", required: true },
        {
          key: "assignment_type",
          label: "نوع الإسناد",
          kind: "select",
          choices: [...ASSIGNMENT_TYPE_OPTIONS],
          required: true,
        },
        {
          key: "assignment_specialist",
          label: "اسم أخصائي الإسناد",
          kind: "text",
          required: true,
        },
        {
          key: "assignment_specialist_email",
          label: "إيميل أخصائي الإسناد",
          kind: "email",
          required: true,
        },
        {
          key: "expected_property_count",
          label: "عدد العقارات المتوقع",
          kind: "number",
          required: true,
        },
        { key: "received_from_enfath_at", label: "تاريخ الاستلام", kind: "display" },
        { key: "due_date_at", label: "تاريخ الاستحقاق", kind: "display" },
        {
          key: "properties_registered_count",
          label: "عقارات مسجّلة فعلياً",
          kind: "display",
          note: "properties.length مقابل المتوقع",
        },
      ],
    },
    {
      id: "po-property-new",
      title: "إضافة عقار",
      summary:
        "خطوة «تسجيل العقارات» — إنفاذ ثم بورصة (أو تخطيها للتسجيل العيني).",
      fields: [
        ...ENFATH_FIELDS,
        ...BOURSE_FIELDS,
        ...PROPERTY_FILE_FIELDS,
        {
          key: "identifier_bourse_status",
          label: "حالة مسار البورصة العقارية",
          kind: "badge",
          choices: [BOURSE_INQUIRY_IDENTIFIER_STATUS],
        },
      ],
    },
    {
      id: "po-property-edit",
      title: "تعديل عقار",
      summary: "تعديل عقار مسجّل (أخصائي).",
      fields: [...ENFATH_FIELDS, ...BOURSE_FIELDS, ...PROPERTY_FILE_FIELDS],
    },
    {
      id: "po-property-detail",
      title: "تفاصيل العقار",
      summary: "عرض: صك ومالك · بورصة · ضباط اتصال · مرفقات.",
      fields: [
        ...ENFATH_FIELDS.map((f) => ({ ...f, kind: "display" as const })),
        ...BOURSE_FIELDS.map((f) => ({ ...f, kind: "display" as const })),
        ...PROPERTY_FILE_FIELDS.map((f) => ({ ...f, kind: "display" as const })),
        {
          key: "workflow_survey",
          label: "مرحلة الرفع المساحي",
          kind: "badge",
          choices: ["لم يبدأ", "جارٍ", "مكتمل", "متعذر"],
        },
        {
          key: "workflow_valuation",
          label: "مرحلة التقييم",
          kind: "badge",
          choices: ["لم يبدأ", "جارٍ", "مكتمل", "متعذر"],
        },
        {
          key: "workflow_study",
          label: "مرحلة دراسة الحالة",
          kind: "badge",
          choices: ["لم يبدأ", "جارٍ", "مكتمل", "متعذر"],
        },
      ],
    },
    {
      id: "po-property-failure",
      title: "تسجيل تعذر",
      summary: "رفع تعذر على عقار — مسودة داخلية حتى اعتماد المشرف.",
      fields: [
        { key: "failure_title", label: "عنوان التعذر", kind: "text", required: true },
        {
          key: "failure_internal_note",
          label: "وصف داخلي",
          kind: "text",
          required: true,
          note: "يُضبط حالة الصك إلى «قيد التحقق»",
        },
      ],
    },
    {
      id: "bourse-inquiry",
      title: "استعلام بورصة (قائمة الانتظار)",
      summary: "إكمال بيانات البورصة للصكوك المسجّلة من إنفاذ دون إكمال البورصة.",
      stats: [
        "بانتظار البورصة",
        "المرحلة: استعلام البورصة",
        "الحقول: مدينة · تصنيف · حدود",
      ],
      tableColumns: ["رقم الصك", "أمر العمل", "رقم المهمة", "المالك", "الاستحقاق"],
      actions: ["اختيار صك من القائمة", "حفظ وإكمال بيانات البورصة", "تحديث القائمة"],
      fields: [...BOURSE_FIELDS],
    },
  ],
};

/** صلاحيات PO في النموذج الأولي (من po-roles.ts) */
export const PO_ROLE_RULES: { action: string; roles: string }[] = [
  { action: "استلام PO جديد", roles: "مشرف قسم (section-supervisor)" },
  { action: "تعديل رأس PO / حذف PO", roles: "مشرف قسم" },
  { action: "إضافة/تعديل عقار", roles: "أخصائي دراسة الحالة" },
  { action: "زر العين في قائمة PO", roles: "غير الأخصائي" },
  { action: "عرض PO فقط", roles: "مدير الإدارة (general-manager)" },
];

export const SYSTEM_MODULES: CatalogModule[] = [PO_MODULE];
