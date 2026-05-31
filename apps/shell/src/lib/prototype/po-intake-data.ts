/** PO intake wizard — steps and reference lists (from متطلبات النظام v1.2). */

export const PO_INTAKE_FLOW = {
  flowClass: "reg-flow-po",
  dept: "قسم دراسة الحالة",
  title: "استلام أمر عمل جديد",
} as const;

/** PO label without duplicating prefix (e.g. PO-2025-0001, not PO PO-2025-0001). */
export function formatPoDisplay(poNumber: string): string {
  const n = poNumber.trim();
  if (!n) return "";
  if (/^PO[-\s]/i.test(n)) return n;
  return `PO-${n}`;
}

export const PO_INTAKE_STEPS = ["بيانات أمر العمل"] as const;

export const PO_INTAKE_HINTS = [
  "انسخ رقم التعميد وتاريخ التعميد من منصة إنفاذ، وأدخل بيانات أخصائي الإسناد ونوع الإسناد",
] as const;

export const ASSIGNMENT_TYPE_OPTIONS = [
  "تنفيذ",
  "تركات",
  "قطاع خاص",
] as const;

export type AssignmentType = (typeof ASSIGNMENT_TYPE_OPTIONS)[number];

export function requiresAssignmentDecree(type: AssignmentType): boolean {
  return type === "تنفيذ";
}

/** مسار التنفيذ فقط — محكمة ودائرة. */
export function showsCourtFields(type: AssignmentType): boolean {
  return type === "تنفيذ";
}

export const DEED_STATUS_OPTIONS = ["فعال", "موقوف", "قيد التحقق"] as const;

export const RESTRICTIONS_PRESENT_OPTIONS = [
  { value: "yes", label: "توجد قيود" },
  { value: "no", label: "لا توجد قيود" },
] as const;

export const BOUNDARIES_AVAILABILITY_OPTIONS = [
  { value: "deed", label: "موضحة في الصك" },
  { value: "bourse", label: "موضحة في البورصة" },
  { value: "doc", label: "مستند خارجي" },
  { value: "no", label: "غير متوفرة" },
] as const;

/** محاكاة محاكم ودوائر — تُستبدل بقائمة يديرها المشرف. */
export const COURTS_BY_CITY: Record<
  string,
  { court: string; circuits: string[] }[]
> = {
  "مكة المكرمة": [
    {
      court: "محكمة التنفيذ بمكة المكرمة",
      circuits: ["الدائرة الأولى", "الدائرة الثانية"],
    },
    {
      court: "محكمة الاستئناف بمكة المكرمة",
      circuits: ["دائرة الأحوال"],
    },
  ],
  جدة: [
    {
      court: "محكمة التنفيذ بجدة",
      circuits: ["الدائرة الأولى", "الدائرة الثانية", "الدائرة الثالثة"],
    },
  ],
  الرياض: [
    {
      court: "محكمة التنفيذ بالرياض",
      circuits: ["الدائرة الأولى", "الدائرة الثانية"],
    },
  ],
  الطائف: [
    { court: "محكمة التنفيذ بالطائف", circuits: ["الدائرة الأولى"] },
  ],
};

/** 5 تصنيفات — 47 نوع (المتطلبات). */
export const PROPERTY_CLASSIFICATIONS: Record<string, string[]> = {
  أرض: ["سكنية", "تجارية", "صناعية", "زراعية", "مختلطة"],
  "مبنى مفرد": [
    "فيلا",
    "عمارة",
    "منزل",
    "بيت شعبي",
    "قصر",
    "برج",
    "مستودع",
    "مصنع",
    "ورشة",
    "فندق",
    "محطة بنزين",
    "مزرعة",
    "شاليه",
    "منتجع",
    "عيادة",
    "مواقف سيارات",
  ],
  مجمع: [
    "سكني",
    "تجاري",
    "فلل",
    "تعليمي",
    "حكومي",
    "عيادات",
    "ترفيهي",
    "رياضي",
    "متعدد الاستخدامات",
  ],
  "وحدة داخل مبنى": ["شقة سكنية", "محل تجاري", "معرض", "مكتب", "دور"],
  "مرفق عام": [
    "مستشفى",
    "مركز صحي",
    "مركز شرطة",
    "استراحة",
    "قاعة أفراح",
    "سوق",
    "مسجد",
    "مقبرة",
    "محطة تحلية",
    "محطة كهرباء",
    "برج اتصالات",
    "مطار",
  ],
};

export const CLASSIFICATION_OPTIONS = Object.keys(PROPERTY_CLASSIFICATIONS);

export const CITY_OPTIONS = [
  "مكة المكرمة",
  "جدة",
  "الرياض",
  "الطائف",
  "المدينة المنورة",
  "الدمام",
  "أخرى",
] as const;

/** رقم تجريبي — يعرض حالة «ناقص» في قائمة العقارات. */
export const INCOMPLETE_CONTACT_MARKER_PHONE = "0500000000";

export const CONTACT_ROLE_OPTIONS = [
  "مالك",
  "وكيل",
  "ممثل قانوني",
  "مورث",
  "ولي",
  "وصي",
  "شاهد",
  "أخرى",
] as const;

export type PoContact = {
  name: string;
  /** صفة الضابط — مطلوب */
  role: string;
  phone: string;
};

/** الرفع المساحي غير مطلوب لوحدة داخل مبنى. */
export function classificationRequiresSurvey(classification: string): boolean {
  return classification.trim() !== "وحدة داخل مبنى";
}

export type PropertyIdentifierType = "deed" | "real_estate_reg" | "bourse_inquiry";

export const BOURSE_INQUIRY_IDENTIFIER_STATUS = "قيد الدراسة";

export function isBourseInquiryIdentifier(
  type: PropertyIdentifierType,
): boolean {
  return type === "bourse_inquiry";
}

export function parsePropertyIdentifierType(
  value: string | undefined,
): PropertyIdentifierType {
  if (value === "real_estate_reg") return "real_estate_reg";
  if (value === "bourse_inquiry") return "bourse_inquiry";
  return "deed";
}

export function identifierTypeLabel(type: PropertyIdentifierType): string {
  if (type === "real_estate_reg") return "تسجيل عيني";
  if (type === "bourse_inquiry") return "استعلام بورصة";
  return "صك ملكية";
}

/** Display label for deed column — hides internal INQ- placeholders. */
export function formatPropertyDeedDisplay(
  property: Pick<PoPropertyIntake, "identifierType" | "deedNumber">,
): string {
  if (isBourseInquiryIdentifier(property.identifierType)) {
    return BOURSE_INQUIRY_IDENTIFIER_STATUS;
  }
  const deed = property.deedNumber.trim();
  if (deed.startsWith("INQ-")) return BOURSE_INQUIRY_IDENTIFIER_STATUS;
  return deed || "—";
}

export function formatPendingBourseDeedDisplay(item: {
  identifierType?: string;
  deedNumber: string;
}): string {
  return formatPropertyDeedDisplay({
    identifierType: parsePropertyIdentifierType(item.identifierType),
    deedNumber: item.deedNumber,
  });
}

export type PoPropertyIntake = {
  id: string;
  identifierType: PropertyIdentifierType;
  deedNumber: string;
  taskNumber: string;
  deedDate: string;
  ownerName: string;
  restrictionsPresent: string;
  restrictions: string;
  boundariesMatch: string;
  boundariesAvailability: string;
  boundariesExternalDocName: string;
  city: string;
  district: string;
  deedStatus: string;
  area: string;
  boundaries: string;
  court: string;
  circuit: string;
  classification: string;
  propertyType: string;
  assignmentDocFileName: string;
  delegationLetterFileName: string;
  otherDocumentFileNames: string[];
  realEstateRegFileName: string;
  bourseDataCompleted: boolean;
  contacts: PoContact[];
};

export type PoIntakeRecord = {
  id: string;
  poNumber: string;
  assignmentType: AssignmentType;
  promulgationDate: string;
  receivedFromEnfathAt: string;
  /** وقت الاستلام (HH:mm) — اختياري؛ يُستخدم في حساب تاريخ الاستحقاق */
  receivedFromEnfathTime: string;
  internalAssignmentAt?: string;
  assignmentSpecialist: string;
  assignmentSpecialistEmail: string;
  expectedPropertyCount: number;
  dueDateAt: string;
  properties: PoPropertyIntake[];
  createdAtUtc: string;
};

function newPropertyId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyProperty(): PoPropertyIntake {
  return {
    id: newPropertyId(),
    identifierType: "deed",
    deedNumber: "",
    taskNumber: "",
    deedDate: "",
    ownerName: "",
    restrictionsPresent: "",
    restrictions: "",
    boundariesMatch: "",
    boundariesAvailability: "",
    boundariesExternalDocName: "",
    city: "",
    district: "",
    deedStatus: "",
    area: "",
    boundaries: "",
    court: "",
    circuit: "",
    classification: "",
    propertyType: "",
    assignmentDocFileName: "",
    delegationLetterFileName: "",
    otherDocumentFileNames: [],
    realEstateRegFileName: "",
    bourseDataCompleted: false,
    contacts: [{ name: "", role: "", phone: "" }],
  };
}

const WORKDAY_START_HOUR = 8;
const WORKDAY_END_HOUR = 17;
const BUSINESS_DAYS_REQUIRED = 4;

export function isBusinessDay(d: Date): boolean {
  const day = d.getDay();
  return day >= 0 && day <= 4;
}

function isWithinBusinessHours(d: Date): boolean {
  const h = d.getHours();
  return h >= WORKDAY_START_HOUR && h < WORKDAY_END_HOUR;
}

function parseReceivedDateTime(receivedIso: string, time?: string): Date | null {
  if (!receivedIso) return null;
  const parts = receivedIso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, day] = parts;
  const t = time?.trim() || "10:00";
  const [hh, mm] = t.split(":").map(Number);
  const d = new Date(y, m - 1, day, hh || 10, mm || 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatLocalIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** نقطة البداية: استلام خارج الدوام/عطلة → أول يوم عمل (لاحقاً). */
export function getEffectiveStartDate(received: Date): Date {
  if (isBusinessDay(received) && isWithinBusinessHours(received)) {
    const start = new Date(received);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  const cursor = new Date(received);
  if (!isBusinessDay(cursor) || received.getHours() >= WORKDAY_END_HOUR) {
    cursor.setDate(cursor.getDate() + 1);
  }
  while (!isBusinessDay(cursor)) {
    cursor.setDate(cursor.getDate() + 1);
  }
  cursor.setHours(0, 0, 0, 0);
  return cursor;
}

/** 4 أيام عمل (أحد–خميس) بعد يوم الاستلام — يوم الاستلام لا يُحسب ضمن الأربعة. */
function addBusinessDaysAfterReceipt(start: Date, count: number): Date {
  const d = new Date(start);
  let added = 0;
  while (added < count) {
    d.setDate(d.getDate() + 1);
    if (isBusinessDay(d)) added += 1;
  }
  return d;
}

/** 4 أيام عمل (أحد–خميس) من تاريخ/وقت الاستلام من إنفاذ. */
export function computeBusinessDueDate(
  receivedIso: string,
  receivedTime?: string,
): string {
  const received = parseReceivedDateTime(receivedIso, receivedTime);
  if (!received) return "";
  const effective = getEffectiveStartDate(received);
  const due = addBusinessDaysAfterReceipt(effective, BUSINESS_DAYS_REQUIRED);
  return formatLocalIsoDate(due);
}

export function isPastDue(dueIso: string): boolean {
  if (!dueIso) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueIso}T12:00:00`);
  return due < today;
}

export function formatDateAr(iso: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    calendar: "gregory",
  });
}

export function assignmentTypeBadgeClass(type: string): string {
  if (type === "تنفيذ") return "b-survey";
  if (type === "تركات") return "b-prog";
  if (type === "قطاع خاص") return "b-key";
  return "b-cancel";
}

export function poListStatusForAssignmentType(
  _assignmentType: string,
  workflowStatus: "progress" | "done",
): "progress" | "done" {
  return workflowStatus;
}
