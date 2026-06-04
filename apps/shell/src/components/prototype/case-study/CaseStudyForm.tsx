"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RegistrationFormCard } from "@/components/prototype/registration/RegistrationFormCard";
import { RegField } from "@/components/prototype/registration/FormFields";
import {
  CASE_STUDY_FORM_STEPS,
  CASE_STUDY_SECTION_QUESTIONS,
  CASE_STUDY_TABLE_HEADERS,
  caseStudyAnswerKey,
  caseStudyFormSummary,
  type CaseStudyFormAnswer,
  type CaseStudyQuestionSection,
} from "@/lib/prototype/case-study-form-data";
import { CaseStudyApprovalSection } from "@/components/prototype/case-study/CaseStudyApprovalSection";
import { CaseStudyReportActions } from "@/components/prototype/case-study/CaseStudyReportActions";
import {
  CASE_STUDY_INFO_ROLE_TYPES,
  type CaseStudyInfoPartyId,
} from "@/lib/prototype/case-study-info-roles-data";
import {
  collectPartyAnswersByQuestion,
  countPartyContributions,
  type PartyQuestionContribution,
} from "@/lib/prototype/case-study-party-answers";
import {
  canPartyAnswerQuestion,
  loadCaseStudyInfoRolesConfig,
} from "@/lib/prototype/case-study-info-roles-storage";
import {
  emptyCaseStudyFormDraft,
  loadCaseStudyFormDraft,
  loadPartyCaseStudyFormDraft,
  saveCaseStudyFormDraft,
  savePartyCaseStudyFormDraft,
  type CaseStudyFormDraft,
  type CaseStudyMeterType,
} from "@/lib/prototype/case-study-form-storage";
import { buildCaseStudyReportModel } from "@/lib/prototype/case-study-report-model";
import type { PoIntakeRecord, PoPropertyIntake } from "@/lib/prototype/po-intake-data";
import type { WorkflowTask } from "@/lib/prototype/tasks-storage";

const STEP_AR_NUMS = ["١", "٢", "٣", "٤", "٥"] as const;

function migrateFormStep(storedStep: number): number {
  const max = CASE_STUDY_FORM_STEPS.length - 1;
  // Legacy drafts used step 0 for بيانات التعميد (removed).
  const next = storedStep >= 1 ? storedStep - 1 : 0;
  return Math.max(0, Math.min(max, next));
}

type Props = {
  taskId: string;
  task: WorkflowTask;
  property: PoPropertyIntake | null;
  poRecord?: Pick<
    PoIntakeRecord,
    "assignmentSpecialist" | "receivedFromEnfathAt" | "promulgationDate"
  > | null;
  requestDateSeed?: string;
  /** أخصائي — نموذج كامل؛ طرف — كل الأسئلة مع تعطيل غير المسندة */
  variant?: "specialist" | "party";
  partyId?: CaseStudyInfoPartyId;
  partyChildTaskId?: string;
  parentFormTaskId?: string;
};

function RemarksBlock({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div className="cs-form-remarks">
      <p className="cs-form-remarks-label">{label}</p>
      <textarea
        className="reg-fi cs-form-textarea"
        rows={rows}
        placeholder="الملاحظات..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function BinaryCell({
  checked,
  label,
  onToggle,
  disabled = false,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`cs-form-cb${checked ? " checked" : ""}${disabled ? " cs-form-cb--locked" : ""}`}
      aria-pressed={checked}
      aria-label={label}
      disabled={disabled}
      onClick={disabled ? undefined : onToggle}
    />
  );
}

function PartyContributions({
  items,
  answerLabel,
  specialistAnswer,
}: {
  items: PartyQuestionContribution[];
  answerLabel: (answer: CaseStudyFormAnswer) => string;
  specialistAnswer: CaseStudyFormAnswer | null;
}) {
  if (items.length === 0) return null;
  return (
    <div className="cs-form-party-contribs">
      <p className="cs-form-party-contribs-title">إجابات الأطراف</p>
      <ul className="cs-form-party-contribs-list">
        {items.map((item) => {
          const roleType = item.roleType
            ? CASE_STUDY_INFO_ROLE_TYPES.find((r) => r.id === item.roleType)
            : null;
          const differs =
            specialistAnswer != null && specialistAnswer !== item.answer;
          return (
            <li
              key={`${item.taskId}-${item.answer}`}
              className={`cs-form-party-contrib${differs ? " cs-form-party-contrib--diff" : ""}`}
            >
              <span
                className="cs-form-party-dot"
                style={{ background: item.partyColor }}
              />
              <span className="cs-form-party-contrib-name">
                {item.partyName}
                {item.roleLabel ? (
                  <span
                    className="cs-form-party-role"
                    style={
                      roleType
                        ? { background: roleType.bg, color: roleType.color }
                        : undefined
                    }
                  >
                    {item.roleLabel}
                  </span>
                ) : null}
              </span>
              <span className="cs-form-party-contrib-ans">
                {answerLabel(item.answer)}
              </span>
              <span className="cs-form-party-contrib-who">{item.assigneeName}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function QuestionTable({
  section,
  answers,
  onAnswer,
  canEditKey,
  partyByKey,
  specialistReview,
  onToggleReview,
  showSpecialistReview,
}: {
  section: CaseStudyQuestionSection;
  answers: Record<string, CaseStudyFormAnswer | null>;
  onAnswer: (key: string, value: CaseStudyFormAnswer | null) => void;
  canEditKey?: (key: string) => boolean;
  partyByKey?: Record<string, PartyQuestionContribution[]>;
  specialistReview?: Record<string, boolean>;
  onToggleReview?: (key: string, approved: boolean) => void;
  showSpecialistReview?: boolean;
}) {
  const questions = CASE_STUDY_SECTION_QUESTIONS[section];
  const headers = CASE_STUDY_TABLE_HEADERS[section];

  return (
    <div className="cs-form-table-wrap">
      <table className="cs-form-table">
        <thead>
          <tr>
            <th>الأسئلة</th>
            <th className="center">{headers.colA}</th>
            <th className="center">{headers.colB}</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q, i) => {
            const key = caseStudyAnswerKey(section, i);
            const val = answers[key] ?? null;
            const editable = canEditKey ? canEditKey(key) : true;
            const partyItems = partyByKey?.[key] ?? [];
            const approved = specialistReview?.[key] ?? false;
            const answerLabel = (a: CaseStudyFormAnswer) =>
              a === "A" ? headers.colA : headers.colB;
            return (
              <tr
                key={key}
                className={editable ? undefined : "cs-form-row--readonly"}
              >
                <td className="question" colSpan={1}>
                  <div className="cs-form-question-cell">
                    <span className="cs-form-question-text">{q}</span>
                    {!editable ? (
                      <span className="cs-form-readonly-tag">عرض فقط</span>
                    ) : null}
                    <PartyContributions
                      items={partyItems}
                      answerLabel={answerLabel}
                      specialistAnswer={val}
                    />
                    {showSpecialistReview && partyItems.length > 0 ? (
                      <label className="cs-form-review-approve">
                        <input
                          type="checkbox"
                          checked={approved}
                          onChange={(e) =>
                            onToggleReview?.(key, e.target.checked)
                          }
                        />
                        <span>اعتماد بعد مراجعة إجابات الأطراف</span>
                      </label>
                    ) : null}
                  </div>
                </td>
                <td className="center">
                  <BinaryCell
                    checked={val === "A"}
                    label={headers.colA}
                    disabled={!editable}
                    onToggle={() => onAnswer(key, val === "A" ? null : "A")}
                  />
                </td>
                <td className="center">
                  <BinaryCell
                    checked={val === "B"}
                    label={headers.colB}
                    disabled={!editable}
                    onToggle={() => onAnswer(key, val === "B" ? null : "B")}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const DONUT_R = 14;
const DONUT_CIRC = 2 * Math.PI * DONUT_R;

function Donut({
  pct,
  color,
  label,
  sub,
}: {
  pct: number;
  color: string;
  label: string;
  sub: string;
}) {
  const offset = DONUT_CIRC * (1 - pct / 100);
  return (
    <div className="cs-mini-donut">
      <svg
        width="44"
        height="44"
        viewBox="0 0 36 36"
        className="cs-mini-donut-svg"
        aria-hidden="true"
      >
        <circle
          cx="18"
          cy="18"
          r={DONUT_R}
          fill="none"
          stroke="var(--border)"
          strokeWidth="3.5"
        />
        <circle
          cx="18"
          cy="18"
          r={DONUT_R}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeDasharray={`${DONUT_CIRC}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
        <text
          x="18"
          y="18"
          textAnchor="middle"
          dominantBaseline="central"
          className="cs-mini-donut-pct"
        >
          {pct}%
        </text>
      </svg>
      <div className="cs-mini-donut-meta">
        <span className="cs-mini-donut-label">{label}</span>
        <span className="cs-mini-donut-sub">{sub}</span>
      </div>
    </div>
  );
}

function FormProgressRings({
  summary,
}: {
  summary: { total: number; answered: number; pending: number; pct: number };
}) {
  return (
    <div className="cs-form-progress-rings" aria-label="تقدم النموذج">
      <Donut
        pct={summary.pct}
        color="var(--success, #16a34a)"
        label="اكتمال النموذج"
        sub={`${summary.answered} / ${summary.total}`}
      />
    </div>
  );
}

function buildSeed(
  task: WorkflowTask,
  property: PoPropertyIntake | null,
  requestDateSeed?: string,
): Partial<CaseStudyFormDraft> {
  const deed = property?.deedNumber?.trim() ?? "";
  return {
    requestNumber: task.poNumber.trim(),
    requestDate: requestDateSeed?.slice(0, 10) || undefined,
    deedNumber: deed,
    propertyId: property?.id,
    poNumber: task.poNumber.trim(),
  };
}

export function CaseStudyForm({
  taskId,
  task,
  property,
  poRecord,
  requestDateSeed,
  variant = "specialist",
  partyId,
  partyChildTaskId,
  parentFormTaskId,
}: Props) {
  const isParty = variant === "party" && partyId && partyChildTaskId;
  const storageTaskId = isParty ? partyChildTaskId : taskId;
  const referenceTaskId = isParty
    ? (parentFormTaskId ?? task.id)
    : taskId;

  const seed = useMemo(
    () => buildSeed(task, property, requestDateSeed),
    [task, property, requestDateSeed],
  );

  const [infoRoles] = useState(() => loadCaseStudyInfoRolesConfig());

  const [draft, setDraft] = useState<CaseStudyFormDraft>(() =>
    emptyCaseStudyFormDraft(storageTaskId, seed),
  );
  const [hydrated, setHydrated] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [partyRevision, setPartyRevision] = useState(0);

  const partyAnswersByKey = useMemo(() => {
    if (isParty) return {};
    return collectPartyAnswersByQuestion(taskId, infoRoles.matrix);
  }, [isParty, taskId, infoRoles.matrix, partyRevision, hydrated]);

  const partyContribCount = useMemo(
    () => countPartyContributions(partyAnswersByKey),
    [partyAnswersByKey],
  );

  useEffect(() => {
    if (isParty) return;
    const refresh = () => setPartyRevision((n) => n + 1);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [isParty]);

  const toggleSpecialistReview = useCallback(
    (key: string, approved: boolean) => {
      setDraft((d) => {
        const next = {
          ...d,
          specialistReviewApproved: {
            ...d.specialistReviewApproved,
            [key]: approved,
          },
        };
        saveCaseStudyFormDraft(next);
        return next;
      });
    },
    [],
  );

  const canEditKey = useCallback(
    (key: string) => {
      if (!isParty || !partyId) return true;
      return canPartyAnswerQuestion(infoRoles.matrix, key, partyId);
    },
    [isParty, partyId, infoRoles.matrix],
  );

  const questionTableProps = isParty
    ? { canEditKey }
    : {
        partyByKey: partyAnswersByKey,
        specialistReview: draft.specialistReviewApproved ?? {},
        onToggleReview: toggleSpecialistReview,
        showSpecialistReview: true,
      };

  useEffect(() => {
    const parentDraft = loadCaseStudyFormDraft(referenceTaskId);
    const partyStored = isParty
      ? loadPartyCaseStudyFormDraft(storageTaskId)
      : null;
    const stored = isParty ? partyStored : loadCaseStudyFormDraft(storageTaskId);
    const base =
      stored ?? emptyCaseStudyFormDraft(storageTaskId, seed);
    const mergedAnswers = isParty
      ? { ...parentDraft?.answers, ...base.answers }
      : base.answers;
    setDraft({
      ...base,
      ...seed,
      answers: mergedAnswers,
      specialistReviewApproved: {
        ...base.specialistReviewApproved,
        ...stored?.specialistReviewApproved,
      },
      requestNumber: seed.requestNumber ?? base.requestNumber,
      deedNumber: seed.deedNumber ?? base.deedNumber,
      requestDate: seed.requestDate ?? base.requestDate,
      currentStep: stored ? migrateFormStep(stored.currentStep) : 0,
    });
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per task
  }, [storageTaskId, referenceTaskId, isParty]);

  const persist = useCallback(
    (next: CaseStudyFormDraft) => {
      setDraft(next);
      if (isParty) savePartyCaseStudyFormDraft(next);
      else saveCaseStudyFormDraft(next);
    },
    [isParty],
  );

  const setAnswer = useCallback(
    (key: string, value: CaseStudyFormAnswer | null) => {
      if (!canEditKey(key)) return;
      setDraft((d) => {
        const displayAnswers = { ...d.answers, [key]: value };
        const next = { ...d, answers: displayAnswers };
        if (isParty && partyChildTaskId) {
          const prevParty = loadPartyCaseStudyFormDraft(partyChildTaskId);
          const partyAnswers = {
            ...(prevParty?.answers ?? {}),
            [key]: value,
          };
          savePartyCaseStudyFormDraft({
            ...next,
            taskId: partyChildTaskId,
            answers: partyAnswers,
          });
        } else {
          saveCaseStudyFormDraft(next);
        }
        return next;
      });
    },
    [canEditKey, isParty, partyChildTaskId],
  );

  const summary = useMemo(
    () => caseStudyFormSummary(draft.answers),
    [draft.answers],
  );

  const reportModel = useMemo(
    () => buildCaseStudyReportModel(draft, property, task, poRecord),
    [draft, property, task, poRecord],
  );

  const goStep = (n: number) => {
    const step = Math.max(0, Math.min(CASE_STUDY_FORM_STEPS.length - 1, n));
    persist({ ...draft, currentStep: step });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const patch = <K extends keyof CaseStudyFormDraft>(
    key: K,
    value: CaseStudyFormDraft[K],
  ) => {
    if (isParty) return;
    setDraft((d) => {
      const next = { ...d, [key]: value };
      saveCaseStudyFormDraft(next);
      return next;
    });
  };

  const saveDraft = () => {
    persist({ ...draft, status: "draft" });
    setSaveNotice("تم حفظ المسودة — يمكنك مواصلة التعبئة لاحقاً");
    window.setTimeout(() => setSaveNotice(null), 4000);
  };

  const submitForm = () => {
    if (isParty) {
      persist({ ...draft, status: "draft" });
      setSaveNotice("تم حفظ إجاباتك في نموذج الدراسة");
      window.setTimeout(() => setSaveNotice(null), 4000);
      return;
    }
    const { answered, total, pct } = summary;
    if (pct < 100) {
      const ok = window.confirm(
        `تم الإجابة على ${answered} من ${total} سؤالاً (${pct}%). هل تريد الرفع رغم ذلك؟`,
      );
      if (!ok) return;
    }
    persist({ ...draft, status: "submitted" });
    setSaveNotice("تم رفع نموذج دراسة الحالة للنظام بنجاح");
    window.setTimeout(() => setSaveNotice(null), 5000);
  };

  if (!hydrated) {
    return <p className="po-properties-loading">جاري تحميل النموذج…</p>;
  }

  const step = draft.currentStep;

  return (
    <div className="cs-form">
      <div className="cs-form-steps-row">
        <nav className="cs-form-steps" aria-label="خطوات نموذج الدراسة">
          {CASE_STUDY_FORM_STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`cs-form-step${step === i ? " active" : ""}${i < step ? " done" : ""}`}
              onClick={() => goStep(i)}
            >
              <span className="cs-form-step-num">{STEP_AR_NUMS[i]}</span>
              {s.label}
            </button>
          ))}
        </nav>
        <FormProgressRings summary={summary} />
      </div>

      {saveNotice ? (
        <div className="note note-success cs-form-notice">{saveNotice}</div>
      ) : null}

      {!isParty ? (
        <div className="note note-info cs-form-specialist-banner">
          <strong>مسؤولية الأخصائي:</strong> جميع إجابات الأطراف تظهر أدناه
          للمراجعة. حدّد إجابتك الرسمية في الأعمدة، ثم اعتمد بعد المراجعة حيث
          وُجدت مساهمات. التقرير النهائي يعتمد على إجاباتك المعتمدة.
          {partyContribCount > 0 ? (
            <button
              type="button"
              className="btn btn-sm cs-form-refresh-party"
              onClick={() => setPartyRevision((n) => n + 1)}
            >
              تحديث إجابات الأطراف ({partyContribCount})
            </button>
          ) : (
            <span className="cs-form-party-empty-hint">
              {" "}
              — لا توجد إجابات من الأطراف بعد.
            </span>
          )}
        </div>
      ) : null}

      {step === 0 ? (
        <section className="cs-form-panel">
          <RegistrationFormCard title="بيانات الصك والعقار">
            <QuestionTable
              section="deed"
              answers={draft.answers}
              onAnswer={setAnswer}
              {...questionTableProps}
            />
            <RemarksBlock
              label="في حال وجود اختلاف في البيانات أعلاه يتم التوضيح في الملاحظات ادناه"
              value={draft.deedRemarks}
              onChange={(v) => patch("deedRemarks", v)}
            />
          </RegistrationFormCard>
          <div className="cs-form-actions">
            <span />
            <button type="button" className="btn btn-primary" onClick={() => goStep(1)}>
              التالي — الرفع المساحي ←
            </button>
          </div>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="cs-form-panel">
          <RegistrationFormCard title="الرفع المساحي والطبيعة">
            <QuestionTable
              section="survey"
              answers={draft.answers}
              onAnswer={setAnswer}
              {...questionTableProps}
            />
            <RemarksBlock
              label="في حال وجود اختلاف في البيانات أعلاه يتم التوضيح في الملاحظات ادناه"
              value={draft.surveyRemarks}
              onChange={(v) => patch("surveyRemarks", v)}
            />
          </RegistrationFormCard>
          <div className="cs-form-actions">
            <button type="button" className="btn btn-outline" onClick={() => goStep(0)}>
              → السابق
            </button>
            <button type="button" className="btn btn-primary" onClick={() => goStep(2)}>
              التالي — مكونات العقار ←
            </button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="cs-form-panel">
          <RegistrationFormCard title="مكونات العقار">
            <QuestionTable
              section="comp"
              answers={draft.answers}
              onAnswer={setAnswer}
              {...questionTableProps}
            />
            <div className="cs-form-meter-inline">
              <span className="cs-form-meter-label">عداد الكهرباء رقم (</span>
              <input
                className="cs-form-meter-num-inline"
                placeholder="رقم"
                aria-label="رقم العداد"
                value={draft.meterNumber}
                onChange={(e) => patch("meterNumber", e.target.value)}
              />
              <span className="cs-form-meter-label">)</span>
              <span className="cs-form-meter-options">
                {(
                  [
                    ["electronic", "إلكتروني"],
                    ["analog", "مؤرشف"],
                    ["none", "لا يوجد"],
                  ] as const
                ).map(([val, label]) => (
                  <label key={val} className="cs-form-radio">
                    <input
                      type="radio"
                      name={`meter-${taskId}`}
                      checked={draft.meterType === val}
                      onChange={() => {
                        patch("meterType", val as CaseStudyMeterType);
                        if (val === "none") patch("meterNumber", "");
                      }}
                    />
                    {label}
                  </label>
                ))}
              </span>
            </div>
            <RemarksBlock
              label="ملاحظات"
              value={draft.componentsRemarks}
              onChange={(v) => patch("componentsRemarks", v)}
              rows={2}
            />
          </RegistrationFormCard>
          <div className="cs-form-actions">
            <button type="button" className="btn btn-outline" onClick={() => goStep(1)}>
              → السابق
            </button>
            <button type="button" className="btn btn-primary" onClick={() => goStep(3)}>
              التالي — الإشغال والإيجار ←
            </button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="cs-form-panel">
          <RegistrationFormCard title="الإشغال والإيجار">
            <QuestionTable
              section="occ"
              answers={draft.answers}
              onAnswer={setAnswer}
              {...questionTableProps}
            />
            <div className="cs-form-meter">
              <RegField
                id="cs-hoa"
                label="قيمة اشتراك اتحاد الملاك"
                type="number"
                placeholder="القيمة"
                value={draft.hoaFee}
                onChange={(v) => patch("hoaFee", v)}
                className="cs-form-hoa-field"
              />
              <span className="cs-form-hoa-unit">ريال سعودي</span>
              <RemarksBlock
                label="ملاحظات"
                value={draft.occupancyRemarks}
                onChange={(v) => patch("occupancyRemarks", v)}
                rows={2}
              />
            </div>
          </RegistrationFormCard>
          <div className="cs-form-actions">
            <button type="button" className="btn btn-outline" onClick={() => goStep(2)}>
              → السابق
            </button>
            <button type="button" className="btn btn-primary" onClick={() => goStep(4)}>
              التالي — ملاحظات إضافية ←
            </button>
          </div>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="cs-form-panel">
          <RegistrationFormCard title="ملاحظات إضافية">
            <QuestionTable
              section="extra"
              answers={draft.answers}
              onAnswer={setAnswer}
              {...questionTableProps}
            />
          </RegistrationFormCard>

          {!isParty ? (
            <>
              <RegistrationFormCard title="الاعتماد والتوقيع">
                <CaseStudyApprovalSection approval={reportModel.approval} />
              </RegistrationFormCard>

              <RegistrationFormCard title="التقرير النهائي">
                <p className="cs-form-report-hint">
                  يُعبّأ التقرير تلقائياً من إجابات النموذج وبيانات النظام (الصك، أمر
                  العمل، التاريخ، المعتمد).
                </p>
                <CaseStudyReportActions model={reportModel} />
              </RegistrationFormCard>
            </>
          ) : null}

          <div className="cs-form-actions">
            <button type="button" className="btn btn-outline" onClick={() => goStep(3)}>
              → السابق
            </button>
            <div className="cs-form-actions-end">
              <button type="button" className="btn" onClick={saveDraft}>
                حفظ مسودة
              </button>
              {!isParty ? (
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={submitForm}
                >
                  رفع النموذج للنظام
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={submitForm}
                >
                  حفظ إجاباتي
                </button>
              )}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
