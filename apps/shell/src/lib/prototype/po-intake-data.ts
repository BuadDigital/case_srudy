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

export const PO_INTAKE_STEPS = [
  "بيانات أمر العمل",
  "تسجيل العقارات",
] as const;

export const PO_INTAKE_HINTS = [
  "انسخ رقم التعميد والتواريخ من منصة إنفاذ واختر نوع الإسناد",
  "سجّل كل عقار: بيانات الصك وضابط الاتصال في نفس الخطوة",
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

export const DEED_STATUS_OPTIONS = ["فعال", "موقوف"] as const;

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

export type PoContact = {
  name: string;
  phone: string;
};

export const RESTRICTIONS_OPTIONS = ["غير موقوف", "موقوف"] as const;

export const BOUNDARIES_MATCH_OPTIONS = [
  "مطابقة",
  "غير مطابقة",
  "غير متوفر",
] as const;

/** الرفع المساحي غير مطلوب لوحدة داخل مبنى. */
export function classificationRequiresSurvey(classification: string): boolean {
  return classification.trim() !== "وحدة داخل مبنى";
}

export type PoPropertyIntake = {
  id: string;
  identifierType: "deed" | "real_estate_reg";
  deedNumber: string;
  deedDate: string;
  ownerName: string;
  restrictions: string;
  boundariesMatch: string;
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
  realEstateRegFileName: string;
  contacts: PoContact[];
};

export type PoIntakeRecord = {
  id: string;
  poNumber: string;
  assignmentType: AssignmentType;
  receivedFromEnfathAt: string;
  /** وقت الاستلام (HH:mm) — اختياري؛ يُستخدم في حساب تاريخ الاستحقاق */
  receivedFromEnfathTime: string;
  internalAssignmentAt: string;
  assignmentSpecialist: string;
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
    deedDate: "",
    ownerName: "",
    restrictions: "",
    boundariesMatch: "",
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
    realEstateRegFileName: "",
    contacts: [{ name: "", phone: "" }],
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
