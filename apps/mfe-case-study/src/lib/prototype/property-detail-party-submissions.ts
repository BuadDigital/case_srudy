import {
  CASE_STUDY_FORM_STEPS,
  CASE_STUDY_SECTION_QUESTIONS,
  CASE_STUDY_TABLE_HEADERS,
  caseStudyFormSummary,
  type CaseStudyFormAnswer,
  type CaseStudyQuestionSection,
} from "./case-study-form-data";
import {
  loadCaseStudyFormDraft,
  loadPartyCaseStudyFormDraft,
  type CaseStudyFormDraft,
  type CaseStudyFormStatus,
} from "./case-study-form-storage";
import { childTasksForCaseStudyParent } from "./case-study-party-answers";
import type { PropertyDetailPartyRoleKey } from "./property-detail-parties";
import {
  migrateDistribution,
  type WorkflowTask,
  type WorkflowTaskKind,
  type WorkflowTaskStatus,
} from "./tasks-storage";
import { formatDateAr } from "./po-intake-data";

/** Must match `evaluator-submission-storage` in @evaluator/mfe (no circular import). */
const EVALUATOR_STORAGE_PREFIX = "evalEvaluatorSubmission:";

/** Must match `engineering-survey-submission-storage` in @engineering-office/mfe (no circular import). */
const ENGINEERING_SURVEY_STORAGE_PREFIX = "evalEngineeringSurveySubmission:";

/** Must match `government-review-work-storage` (no circular import). */
const GOVERNMENT_REVIEW_STORAGE_PREFIX = "evalGovernmentReviewSubmission:";

/** Must match `valuation-coordination-work-storage` (no circular import). */
const VALUATION_COORDINATION_STORAGE_PREFIX =
  "evalValuationCoordinationSubmission:";

/** Must match `ENGINEERING_SURVEY_CHECKLIST_ITEMS` in engineering-survey-data (no circular import). */
const ENGINEERING_SURVEY_CHECKLIST_LABELS = [
  "هل الصك مطابق للرفع المساحي (الأطوال والمساحة)",
  "هل تم الوقوف على الموقع من قِبل طالب التنفيذ وتوقيع إقرار صحة الاستدلال على الموقع",
  "هل يوجد اختلاف في رقم القطعة / المخطط / البلوك / اسم الحي / اسم المدينة للمستكشف",
  "هل يوجد اختلاف في مساحة / أطوال الصك عن الطبيعة",
  "هل يوجد شوارع محتزلة / شطفات على الأصل في المخطط ولم يذكر في الصك",
  "هل يوجد تداخل في الصك أو أجزاء مشتركة ظاهرياً",
  "هل ذُكر الاستخدام حسب الصك",
  "هل الموقع أرض فضاء",
  "هل يوجد غرفة كهرباء داخل / خارج حدود الموقع",
  "هل يوجد صناديق خدمات كهربائية / اتصالات / أخرى داخل أو خارج حدود العقار",
  "هل تم تطبيق جميع التعليمات الصادرة في الرفع المساحي",
  "هل يوجد أسوار داخلية وخارجية بمحيط المبنى القائم بالموقع",
  "هل يوجد اختلاف في الحدود / الصك أو الأفادة من المستكشف",
] as const;

const ROLE_CHILD_KIND: Partial<
  Record<PropertyDetailPartyRoleKey, WorkflowTaskKind>
> = {
  inspection: "field-inspection",
  survey: "engineering-survey",
  appraisal: "property-appraisal",
  government: "government-review",
  coordinator: "valuation-coordination",
};

export type PartyAnswerRow = {
  question: string;
  answer: string;
};

export type PropertyDetailPartySubmission = {
  roleKey: PropertyDetailPartyRoleKey;
  hasData: boolean;
  emptyReason?: string;
  statusLabel?: string;
  taskStatusLabel?: string;
  fields: { label: string; value: string; ltr?: boolean }[];
  answers: PartyAnswerRow[];
  remarks: { label: string; value: string }[];
};

type EvaluatorChecklist = Record<string, boolean | null | string>;

type EvaluatorSubmissionSnapshot = {
  status: string;
  evaluatorPrice: string;
  evaluatorNotes: string;
  reportFileName: string | null;
  submittedAtUtc: string | null;
  checklist: EvaluatorChecklist;
};

type EngineeringSurveyChecklistAnswer = "yes" | "no" | null;

type EngineeringSurveyChecklistRow = {
  answer: EngineeringSurveyChecklistAnswer;
  note: string;
};

type EngineeringSurveySubmissionSnapshot = {
  status: "draft" | "submitted" | "reopened";
  latitude: string;
  longitude: string;
  surveyReportFileName: string;
  siteLetterFileName: string;
  siteConfirmed: boolean;
  checklist: EngineeringSurveyChecklistRow[];
  returnNote?: string;
  updatedAtUtc: string;
  submittedAtUtc?: string;
};

type GovernmentReviewSubmissionSnapshot = {
  status: "draft" | "submitted";
  visitStatus: "completed" | "scheduled" | "blocked" | "";
  visitDate: string;
  courtName: string;
  keysStatus: "received" | "pending" | "not_required" | "";
  keysDescription: string;
  accessBlockReason: string;
  reviewNotes: string;
  submittedAtUtc: string | null;
  updatedAtUtc: string;
};

type ValuationCoordinationSubmissionSnapshot = {
  status: "draft" | "submitted";
  receiptConfirmed: boolean;
  receiptDate: string;
  inspectorName: string;
  appraiserName: string;
  priority: "normal" | "urgent";
  coordinationNotes: string;
  inspectorInstructions: string;
  appraiserInstructions: string;
  submittedAtUtc: string | null;
  updatedAtUtc: string;
};

function formStatusLabel(status: CaseStudyFormStatus): string {
  if (status === "submitted") return "مُقدَّم";
  if (status === "draft") return "مسودة";
  return "جديد";
}

function workflowStatusLabel(status: WorkflowTaskStatus): string {
  if (status === "completed") return "مكتمل";
  if (status === "blocked") return "معلّق";
  return "قيد التنفيذ";
}

function answerDisplay(
  section: CaseStudyQuestionSection,
  value: CaseStudyFormAnswer,
): string {
  const headers = CASE_STUDY_TABLE_HEADERS[section];
  return value === "A" ? headers.colA : headers.colB;
}

function questionLabelFromKey(key: string): string | null {
  const match = /^([a-z]+)_(\d+)$/.exec(key);
  if (!match) return null;
  const section = match[1] as CaseStudyQuestionSection;
  const index = Number.parseInt(match[2] ?? "", 10);
  const questions = CASE_STUDY_SECTION_QUESTIONS[section];
  if (!questions || !Number.isFinite(index)) return null;
  return questions[index] ?? null;
}

function answeredRows(
  answers: Record<string, CaseStudyFormAnswer | null | undefined>,
): PartyAnswerRow[] {
  const rows: PartyAnswerRow[] = [];
  for (const [key, value] of Object.entries(answers)) {
    if (value !== "A" && value !== "B") continue;
    const match = /^([a-z]+)_(\d+)$/.exec(key);
    if (!match) continue;
    const section = match[1] as CaseStudyQuestionSection;
    const label = questionLabelFromKey(key);
    if (!label) continue;
    rows.push({
      question: label,
      answer: answerDisplay(section, value),
    });
  }
  return rows;
}

function nonEmptyRemarks(draft: CaseStudyFormDraft): { label: string; value: string }[] {
  const defs = [
    { label: "ملاحظات الصك", value: draft.deedRemarks },
    { label: "ملاحظات الرفع المساحي", value: draft.surveyRemarks },
    { label: "ملاحظات المكونات", value: draft.componentsRemarks },
    { label: "ملاحظات الإشغال", value: draft.occupancyRemarks },
  ];
  return defs
    .map((d) => ({ ...d, value: d.value.trim() }))
    .filter((d) => d.value);
}

function childForRole(
  parentTask: WorkflowTask | null,
  allTasks: WorkflowTask[],
  roleKey: PropertyDetailPartyRoleKey,
): WorkflowTask | null {
  if (!parentTask) return null;
  const kind = ROLE_CHILD_KIND[roleKey];
  if (!kind) return null;
  return (
    childTasksForCaseStudyParent(parentTask.id, allTasks).find(
      (t) => t.kind === kind,
    ) ?? null
  );
}

function loadEvaluatorSubmissionSnapshot(
  taskId: string,
): EvaluatorSubmissionSnapshot | null {
  if (typeof window === "undefined" || !taskId) return null;
  try {
    const raw = localStorage.getItem(`${EVALUATOR_STORAGE_PREFIX}${taskId}`);
    if (!raw) return null;
    return JSON.parse(raw) as EvaluatorSubmissionSnapshot;
  } catch {
    return null;
  }
}

function loadEngineeringSurveySubmissionSnapshot(
  taskId: string,
): EngineeringSurveySubmissionSnapshot | null {
  if (typeof window === "undefined" || !taskId) return null;
  try {
    const raw = localStorage.getItem(`${ENGINEERING_SURVEY_STORAGE_PREFIX}${taskId}`);
    if (!raw) return null;
    return JSON.parse(raw) as EngineeringSurveySubmissionSnapshot;
  } catch {
    return null;
  }
}

function loadGovernmentReviewSubmissionSnapshot(
  taskId: string,
): GovernmentReviewSubmissionSnapshot | null {
  if (typeof window === "undefined" || !taskId) return null;
  try {
    const raw = localStorage.getItem(`${GOVERNMENT_REVIEW_STORAGE_PREFIX}${taskId}`);
    if (!raw) return null;
    return JSON.parse(raw) as GovernmentReviewSubmissionSnapshot;
  } catch {
    return null;
  }
}

function loadValuationCoordinationSubmissionSnapshot(
  taskId: string,
): ValuationCoordinationSubmissionSnapshot | null {
  if (typeof window === "undefined" || !taskId) return null;
  try {
    const raw = localStorage.getItem(
      `${VALUATION_COORDINATION_STORAGE_PREFIX}${taskId}`,
    );
    if (!raw) return null;
    return JSON.parse(raw) as ValuationCoordinationSubmissionSnapshot;
  } catch {
    return null;
  }
}

function evaluatorStatusLabel(status: string): string {
  if (status === "draft") return "مسودة";
  if (status === "submitted") return "مُرسَل للأخصائي";
  if (status === "reopened") return "مُعاد للتعديل";
  if (status === "completed") return "مكتمل";
  return status;
}

function engineeringSurveyStatusLabel(
  status: EngineeringSurveySubmissionSnapshot["status"],
): string {
  if (status === "submitted") return "مُرسَل";
  if (status === "reopened") return "مُعاد للتصحيح";
  return "قيد العمل";
}

function engineeringSurveyAnswerLabel(
  value: EngineeringSurveyChecklistAnswer,
): string {
  if (value === "yes") return "نعم";
  if (value === "no") return "لا";
  return "—";
}

function checklistAnswerLabel(value: boolean | null): string {
  if (value === true) return "نعم";
  if (value === false) return "لا";
  return "—";
}

function evaluatorChecklistRows(
  checklist: EvaluatorChecklist,
): PartyAnswerRow[] {
  const labels: Record<string, string> = {
    q_plan_match: "هل رقم المخطط مطابق للصك؟",
    q_excess_zoning: "هل القطعة زائدة تنظيمية؟",
    q_land_waqf: "هل الأرض موقوفة؟",
    q_property_waqf: "هل العقار موقوف؟",
    q_expropriation: "هل يوجد نزع على منطقة العقار؟",
    q_agriculture_inquiry:
      "هل تم الاستعلام من وزارة الزراعة حيال الأرض الزراعية؟",
    q_overlap: "هل يوجد تداخل في الأصل؟",
    q_shared_building: "هل يوجد على الأصل مبنى مشترك؟",
    q_environmental_factors:
      "هل هناك أي عوامل بيئية أو تنظيمية قد تؤثر على العقار؟",
    q_unregistered_additions:
      "هل العقار يحتوي على أي إضافات غير مسجلة في الصك؟",
    q_shared_deed: "هل الصك مشاع؟",
    q_lease_exists: "هل يوجد عقد إيجار؟",
    q_lease_active: "هل عقد الإيجار ساري؟",
    q_technical_notes_exists:
      "هل يوجد ملاحظات فنية قد تؤثر على قيمة العقار؟",
  };

  const rows: PartyAnswerRow[] = [];
  for (const [id, label] of Object.entries(labels)) {
    const value = checklist[id];
    if (typeof value !== "boolean") continue;
    rows.push({ question: label, answer: checklistAnswerLabel(value) });
  }

  if (checklist.q_shared_deed === true) {
    const scope =
      checklist.shared_deed_scope === "full"
        ? "كامل العقار"
        : checklist.shared_deed_scope === "part"
          ? "جزء محدد"
          : "—";
    rows.push({ question: "نطاق الصك المشاع", answer: scope });
    const pct = String(checklist.shared_deed_percentage ?? "").trim();
    if (pct) {
      rows.push({ question: "نسبة الملكية", answer: `${pct}%` });
    }
  }

  const techNotes = String(checklist.technical_notes_text ?? "").trim();
  if (techNotes) {
    rows.push({ question: "الملاحظات الفنية", answer: techNotes });
  }

  return rows;
}

function engineeringSurveyChecklistRows(
  checklist: EngineeringSurveyChecklistRow[],
): PartyAnswerRow[] {
  const rows: PartyAnswerRow[] = [];
  checklist.forEach((row, index) => {
    const label =
      ENGINEERING_SURVEY_CHECKLIST_LABELS[index] ?? `بند ${index + 1}`;
    if (row.answer === "yes" || row.answer === "no") {
      rows.push({
        question: label,
        answer: engineeringSurveyAnswerLabel(row.answer),
      });
    }
  });
  return rows;
}

function engineeringSurveyChecklistRemarks(
  checklist: EngineeringSurveyChecklistRow[],
): { label: string; value: string }[] {
  const remarks: { label: string; value: string }[] = [];
  checklist.forEach((row, index) => {
    const note = row.note.trim();
    if (!note) return;
    const label =
      ENGINEERING_SURVEY_CHECKLIST_LABELS[index] ?? `بند ${index + 1}`;
    remarks.push({ label, value: note });
  });
  return remarks;
}

function formatCoordsDisplay(lat: string, lng: string): string {
  const latTrim = lat.trim();
  const lngTrim = lng.trim();
  if (!latTrim && !lngTrim) return "";
  if (latTrim && lngTrim) return `${latTrim}، ${lngTrim}`;
  return latTrim || lngTrim;
}

function buildFromEngineeringSurvey(
  submission: EngineeringSurveySubmissionSnapshot,
  childTask?: WorkflowTask | null,
): PropertyDetailPartySubmission {
  const answers = engineeringSurveyChecklistRows(submission.checklist);
  const checklistRemarks = engineeringSurveyChecklistRemarks(submission.checklist);
  const coords = formatCoordsDisplay(submission.latitude, submission.longitude);

  const fields: PropertyDetailPartySubmission["fields"] = [
    {
      label: "حالة الرفع المساحي",
      value: engineeringSurveyStatusLabel(submission.status),
    },
  ];

  if (coords) {
    fields.push({ label: "الإحداثيات", value: coords, ltr: true });
  }
  if (submission.surveyReportFileName.trim()) {
    fields.push({
      label: "تقرير الرفع المساحي",
      value: submission.surveyReportFileName.trim(),
    });
  }
  if (submission.siteLetterFileName.trim()) {
    fields.push({
      label: "خطاب الموقع",
      value: submission.siteLetterFileName.trim(),
    });
  }
  if (submission.siteConfirmed) {
    fields.push({ label: "إقرار الموقع", value: "مُوقَّع" });
  }
  if (submission.submittedAtUtc) {
    fields.push({
      label: "تاريخ الإرسال",
      value: formatDateAr(submission.submittedAtUtc.slice(0, 10)),
      ltr: true,
    });
  }
  if (submission.updatedAtUtc) {
    fields.push({
      label: "آخر تحديث",
      value: formatDateAr(submission.updatedAtUtc.slice(0, 10)),
      ltr: true,
    });
  }
  if (childTask) {
    fields.push({
      label: "حالة المهمة",
      value: workflowStatusLabel(childTask.status),
    });
  }

  const answeredCount = submission.checklist.filter(
    (row) => row.answer === "yes" || row.answer === "no",
  ).length;
  if (answeredCount > 0) {
    fields.splice(1, 0, {
      label: "البنود المكتملة",
      value: `${answeredCount} / ${ENGINEERING_SURVEY_CHECKLIST_LABELS.length}`,
    });
  }

  const returnNote = submission.returnNote?.trim() ?? "";
  const remarks = returnNote
    ? [{ label: "ملاحظة الإرجاع", value: returnNote }, ...checklistRemarks]
    : checklistRemarks;

  const hasData =
    submission.status !== "draft" ||
    Boolean(coords) ||
    Boolean(submission.surveyReportFileName.trim()) ||
    Boolean(submission.siteLetterFileName.trim()) ||
    answers.length > 0 ||
    remarks.length > 0;

  return {
    roleKey: "survey",
    hasData,
    emptyReason: hasData ? undefined : "لم يُقدَّم بعد",
    statusLabel: engineeringSurveyStatusLabel(submission.status),
    taskStatusLabel: childTask
      ? workflowStatusLabel(childTask.status)
      : undefined,
    fields,
    answers,
    remarks,
  };
}

function formatPriceDisplay(raw: string): string {
  const n = Number.parseFloat(raw.replace(/,/g, ""));
  if (!Number.isFinite(n) || n <= 0) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(n);
}

function buildFromFormDraft(
  roleKey: PropertyDetailPartyRoleKey,
  draft: CaseStudyFormDraft,
  childTask?: WorkflowTask | null,
): PropertyDetailPartySubmission {
  const summary = caseStudyFormSummary(draft.answers);
  const answers = answeredRows(draft.answers);
  const remarks = nonEmptyRemarks(draft);
  const step =
    CASE_STUDY_FORM_STEPS[draft.currentStep]?.label ??
    CASE_STUDY_FORM_STEPS[0]?.label ??
    "";

  const fields: PropertyDetailPartySubmission["fields"] = [
    { label: "حالة النموذج", value: formStatusLabel(draft.status) },
    { label: "الإجابات المكتملة", value: `${summary.answered} / ${summary.total}` },
  ];

  if (roleKey === "specialist") {
    fields.unshift({ label: "الخطوة الحالية", value: step });
    if (draft.requestNumber.trim()) {
      fields.push({ label: "رقم الطلب", value: draft.requestNumber, ltr: true });
    }
    if (draft.requestDate.trim()) {
      fields.push({
        label: "تاريخ الطلب",
        value: formatDateAr(draft.requestDate),
        ltr: true,
      });
    }
  }

  if (childTask) {
    fields.push({
      label: "حالة المهمة",
      value: workflowStatusLabel(childTask.status),
    });
  }

  const hasData =
    answers.length > 0 ||
    remarks.length > 0 ||
    draft.status !== "new" ||
    summary.answered > 0;

  return {
    roleKey,
    hasData,
    emptyReason: hasData ? undefined : "لم يُقدَّم بعد",
    statusLabel: formStatusLabel(draft.status),
    taskStatusLabel: childTask
      ? workflowStatusLabel(childTask.status)
      : undefined,
    fields,
    answers,
    remarks,
  };
}

function buildFromEvaluator(
  submission: EvaluatorSubmissionSnapshot,
): PropertyDetailPartySubmission {
  const answers = evaluatorChecklistRows(submission.checklist);
  const price = formatPriceDisplay(submission.evaluatorPrice);
  const notes = submission.evaluatorNotes.trim();

  const fields: PropertyDetailPartySubmission["fields"] = [
    { label: "حالة التقييم", value: evaluatorStatusLabel(submission.status) },
  ];
  if (price) fields.push({ label: "سعر التقييم", value: price, ltr: true });
  if (submission.reportFileName?.trim()) {
    fields.push({
      label: "تقرير التقييم",
      value: submission.reportFileName.trim(),
    });
  }
  if (submission.submittedAtUtc) {
    fields.push({
      label: "تاريخ الإرسال",
      value: formatDateAr(submission.submittedAtUtc.slice(0, 10)),
      ltr: true,
    });
  }

  const remarks = notes
    ? [{ label: "ملاحظات المقيّم", value: notes }]
    : [];

  const hasData =
    submission.status !== "draft" ||
    Boolean(price) ||
    Boolean(notes) ||
    Boolean(submission.reportFileName?.trim()) ||
    answers.length > 0;

  return {
    roleKey: "appraisal",
    hasData,
    emptyReason: hasData ? undefined : "لم يُقدَّم بعد",
    statusLabel: evaluatorStatusLabel(submission.status),
    fields,
    answers,
    remarks,
  };
}

function buildFromGovernmentReview(
  submission: GovernmentReviewSubmissionSnapshot,
  childTask?: WorkflowTask | null,
): PropertyDetailPartySubmission {
  const visitLabels: Record<string, string> = {
    completed: "تمت الزيارة",
    scheduled: "بانتظار الموعد",
    blocked: "تعذر الوصول",
  };
  const keysLabels: Record<string, string> = {
    received: "تم استلام المفاتيح",
    pending: "لم تُسلَّم بعد",
    not_required: "غير مطلوبة",
  };

  const fields: PropertyDetailPartySubmission["fields"] = [
    {
      label: "حالة المراجعة",
      value: submission.status === "submitted" ? "مُرسَل" : "قيد العمل",
    },
  ];

  if (submission.visitStatus) {
    fields.push({
      label: "حالة الزيارة",
      value: visitLabels[submission.visitStatus] ?? submission.visitStatus,
    });
  }
  if (submission.visitDate.trim()) {
    fields.push({
      label: "تاريخ الزيارة",
      value: formatDateAr(submission.visitDate),
      ltr: true,
    });
  }
  if (submission.courtName.trim()) {
    fields.push({ label: "المحكمة", value: submission.courtName.trim() });
  }
  if (submission.keysStatus) {
    fields.push({
      label: "حالة المفاتيح",
      value: keysLabels[submission.keysStatus] ?? submission.keysStatus,
    });
  }
  if (submission.submittedAtUtc) {
    fields.push({
      label: "تاريخ الإرسال",
      value: formatDateAr(submission.submittedAtUtc.slice(0, 10)),
      ltr: true,
    });
  }
  if (childTask) {
    fields.push({
      label: "حالة المهمة",
      value: workflowStatusLabel(childTask.status),
    });
  }

  const remarks: PropertyDetailPartySubmission["remarks"] = [];
  if (submission.keysDescription.trim()) {
    remarks.push({
      label: "المفاتيح / موقع الحفظ",
      value: submission.keysDescription.trim(),
    });
  }
  if (submission.accessBlockReason.trim()) {
    remarks.push({
      label: "سبب التعذر / المتابعة",
      value: submission.accessBlockReason.trim(),
    });
  }
  if (submission.reviewNotes.trim()) {
    remarks.push({
      label: "ملاحظات المراجعة",
      value: submission.reviewNotes.trim(),
    });
  }

  const hasData =
    submission.status !== "draft" ||
    Boolean(submission.visitStatus) ||
    Boolean(submission.keysStatus) ||
    remarks.length > 0;

  return {
    roleKey: "government",
    hasData,
    emptyReason: hasData ? undefined : "لم يُقدَّم بعد",
    statusLabel: submission.status === "submitted" ? "مُرسَل" : "مسودة",
    taskStatusLabel: childTask
      ? workflowStatusLabel(childTask.status)
      : undefined,
    fields,
    answers: [],
    remarks,
  };
}

function buildFromValuationCoordination(
  submission: ValuationCoordinationSubmissionSnapshot,
  childTask?: WorkflowTask | null,
): PropertyDetailPartySubmission {
  const fields: PropertyDetailPartySubmission["fields"] = [
    {
      label: "حالة الاستلام",
      value: submission.status === "submitted" ? "مُستلَم" : "قيد التنسيق",
    },
  ];

  if (submission.receiptDate.trim()) {
    fields.push({
      label: "تاريخ الاستلام",
      value: formatDateAr(submission.receiptDate),
      ltr: true,
    });
  }
  if (submission.inspectorName.trim()) {
    fields.push({
      label: "المعاين الميداني",
      value: submission.inspectorName.trim(),
    });
  }
  if (submission.appraiserName.trim()) {
    fields.push({
      label: "المقيم العقاري",
      value: submission.appraiserName.trim(),
    });
  }
  fields.push({
    label: "الأولوية",
    value: submission.priority === "urgent" ? "عاجلة" : "عادية",
  });
  if (submission.submittedAtUtc) {
    fields.push({
      label: "تاريخ التأكيد",
      value: formatDateAr(submission.submittedAtUtc.slice(0, 10)),
      ltr: true,
    });
  }
  if (childTask) {
    fields.push({
      label: "حالة المهمة",
      value: workflowStatusLabel(childTask.status),
    });
  }

  const remarks: PropertyDetailPartySubmission["remarks"] = [];
  if (submission.coordinationNotes.trim()) {
    remarks.push({
      label: "ملاحظات التنسيق",
      value: submission.coordinationNotes.trim(),
    });
  }
  if (submission.inspectorInstructions.trim()) {
    remarks.push({
      label: "تعليمات للمعاين",
      value: submission.inspectorInstructions.trim(),
    });
  }
  if (submission.appraiserInstructions.trim()) {
    remarks.push({
      label: "تعليمات للمقيم",
      value: submission.appraiserInstructions.trim(),
    });
  }

  const hasData =
    submission.status !== "draft" ||
    submission.receiptConfirmed ||
    remarks.length > 0;

  return {
    roleKey: "coordinator",
    hasData,
    emptyReason: hasData ? undefined : "لم يُقدَّم بعد",
    statusLabel: submission.status === "submitted" ? "مُستلَم" : "مسودة",
    taskStatusLabel: childTask
      ? workflowStatusLabel(childTask.status)
      : undefined,
    fields,
    answers: [],
    remarks,
  };
}

function buildCoordinatorSubmission(
  parentTask: WorkflowTask | null,
  allTasks: WorkflowTask[],
  coordinatorName: string,
): PropertyDetailPartySubmission {
  const distribution = migrateDistribution(parentTask?.distribution);
  const child = childForRole(parentTask, allTasks, "coordinator");

  const fields: PropertyDetailPartySubmission["fields"] = [
    {
      label: "قسم التقييم",
      value: distribution.valuationDepartment ? "مفعّل" : "غير مفعّل",
    },
  ];

  if (coordinatorName.trim()) {
    fields.push({ label: "المنسق المعيّن", value: coordinatorName.trim() });
  }
  if (child) {
    fields.push({
      label: "حالة الاستلام",
      value: workflowStatusLabel(child.status),
    });
    fields.push({
      label: "تاريخ التحديث",
      value: formatDateAr(child.updatedAt.slice(0, 10)),
      ltr: true,
    });
  }

  const hasData =
    distribution.valuationDepartment && Boolean(coordinatorName.trim());

  return {
    roleKey: "coordinator",
    hasData,
    emptyReason: hasData ? undefined : "لم يُقدَّم بعد",
    taskStatusLabel: child ? workflowStatusLabel(child.status) : undefined,
    fields,
    answers: [],
    remarks: [],
  };
}

function emptySubmission(
  roleKey: PropertyDetailPartyRoleKey,
  reason: string,
): PropertyDetailPartySubmission {
  return {
    roleKey,
    hasData: false,
    emptyReason: reason,
    fields: [],
    answers: [],
    remarks: [],
  };
}

export const PROPERTY_DETAIL_PARTY_ROLE_KEYS = [
  "specialist",
  "inspection",
  "survey",
  "appraisal",
  "government",
  "coordinator",
] as const satisfies readonly PropertyDetailPartyRoleKey[];

export type PropertyDetailPartySubmissionsMap = Record<
  PropertyDetailPartyRoleKey,
  PropertyDetailPartySubmission
>;

/** Load all party-role submissions in parallel (forms via API, appraiser via localStorage). */
export async function loadPropertyDetailPartySubmissions(input: {
  parentTask: WorkflowTask | null;
  allTasks: WorkflowTask[];
  coordinatorName?: string;
}): Promise<PropertyDetailPartySubmissionsMap> {
  const entries = await Promise.all(
    PROPERTY_DETAIL_PARTY_ROLE_KEYS.map(async (roleKey) => {
      const submission = await loadPropertyDetailPartySubmission({
        roleKey,
        ...input,
      });
      return [roleKey, submission] as const;
    }),
  );
  return Object.fromEntries(entries) as PropertyDetailPartySubmissionsMap;
}

/** Load submission snapshot for one party role on the property detail page. */
export async function loadPropertyDetailPartySubmission(input: {
  roleKey: PropertyDetailPartyRoleKey;
  parentTask: WorkflowTask | null;
  allTasks: WorkflowTask[];
  coordinatorName?: string;
}): Promise<PropertyDetailPartySubmission> {
  const { roleKey, parentTask, allTasks, coordinatorName = "" } = input;

  if (roleKey === "coordinator") {
    const child = childForRole(parentTask, allTasks, "coordinator");
    if (child) {
      const submission = loadValuationCoordinationSubmissionSnapshot(child.id);
      if (submission) {
        return buildFromValuationCoordination(submission, child);
      }
    }
    return buildCoordinatorSubmission(parentTask, allTasks, coordinatorName);
  }

  if (!parentTask) {
    return emptySubmission(roleKey, "لم تُبدأ دراسة الحالة بعد");
  }

  if (roleKey === "specialist") {
    const draft = await loadCaseStudyFormDraft(parentTask.id);
    if (!draft) {
      return emptySubmission(roleKey, "لم يُقدَّم بعد");
    }
    return buildFromFormDraft(roleKey, draft);
  }

  const child = childForRole(parentTask, allTasks, roleKey);
  if (!child) {
    return emptySubmission(roleKey, "لم يُعيَّن بعد");
  }

  if (roleKey === "appraisal") {
    const submission = loadEvaluatorSubmissionSnapshot(child.id);
    if (!submission) {
      return emptySubmission(roleKey, "لم يُقدَّم بعد");
    }
    return buildFromEvaluator(submission);
  }

  if (roleKey === "survey") {
    const submission = loadEngineeringSurveySubmissionSnapshot(child.id);
    if (!submission) {
      return emptySubmission(roleKey, "لم يُقدَّم بعد");
    }
    return buildFromEngineeringSurvey(submission, child);
  }

  if (roleKey === "government") {
    const submission = loadGovernmentReviewSubmissionSnapshot(child.id);
    if (!submission) {
      return emptySubmission(roleKey, "لم يُقدَّم بعد");
    }
    return buildFromGovernmentReview(submission, child);
  }

  const draft = await loadPartyCaseStudyFormDraft(child.id);
  if (!draft) {
    return emptySubmission(roleKey, "لم يُقدَّم بعد");
  }
  return buildFromFormDraft(roleKey, draft, child);
}
