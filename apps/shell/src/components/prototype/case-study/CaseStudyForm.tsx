"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RegistrationFormCard } from "@platform/app-shared/registration/RegistrationFormCard";
import { RegField } from "@platform/app-shared/registration/FormFields";
import {
  CASE_STUDY_FORM_STEPS,
  CASE_STUDY_SECTION_QUESTIONS,
  CASE_STUDY_TABLE_HEADERS,
  caseStudyAnswerKey,
  type CaseStudyFormAnswer,
  type CaseStudyQuestionSection,
} from "@case-study/mfe/lib/prototype/case-study-form-data";
import { CaseStudyApprovalSection } from "@/components/prototype/case-study/CaseStudyApprovalSection";
import { CaseStudyReportActions } from "@/components/prototype/case-study/CaseStudyReportActions";
import {
  CASE_STUDY_INFO_ROLE_TYPES,
  partyById,
  type CaseStudyInfoPartyId,
} from "@/lib/prototype/case-study-info-roles-data";
import {
  collectPartyAnswersByQuestion,
  type PartyQuestionContribution,
} from "@/lib/prototype/case-study-party-answers";
import {
  canPartyAnswerQuestion,
  CASE_STUDY_INFO_ROLES_CHANGED_EVENT,
  emptyCaseStudyInfoRolesConfig,
  isPartyQuestionVisible,
} from "@/lib/prototype/case-study-info-roles-storage";
import { useCaseStudyInfoRolesQuery } from "@/lib/query/prototype-queries";
import {
  emptyCaseStudyFormDraft,
  loadCaseStudyFormDraft,
  loadPartyCaseStudyFormDraft,
  saveCaseStudyFormDraft,
  savePartyCaseStudyFormDraft,
  type CaseStudyFormDraft,
  type CaseStudyMeterType,
} from "@case-study/mfe/lib/prototype/case-study-form-storage";
import { buildCaseStudyReportModel } from "@/lib/prototype/case-study-report-model";
import type { PoIntakeRecord, PoPropertyIntake } from "@case-study/mfe";
import type { WorkflowTask } from "@case-study/mfe";
import { useWorkflowTasksQuery } from "@/lib/query/prototype-queries";
import { EVALUATOR_SUBMISSION_CHANGED_EVENT } from "@/lib/prototype/evaluator/evaluator-submission-storage";

/** Stable fallback — avoid calling emptyCaseStudyInfoRolesConfig() per render (infinite effect loop). */
const DEFAULT_INFO_ROLES_CONFIG = emptyCaseStudyInfoRolesConfig();

const STEP_AR_NUMS = ["١", "٢", "٣", "٤", "٥"] as const;

const FORM_STEP_SECTIONS: CaseStudyQuestionSection[] = [
  "deed",
  "survey",
  "comp",
  "occ",
  "extra",
];

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
  /** أخصائي — نموذج كامل؛ طرف — الأسئلة المسندة في المصفوفة فقط */
  variant?: "specialist" | "party";
  partyId?: CaseStudyInfoPartyId;
  partyChildTaskId?: string;
  parentFormTaskId?: string;
  /** مقيم — إجابات استدلالية للأخصائي وليست نهائية في نموذج الدراسة */
  partyAdvisory?: boolean;
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
  visibleKey,
  partyByKey,
  specialistReview,
  onToggleReview,
  showSpecialistReview,
}: {
  section: CaseStudyQuestionSection;
  answers: Record<string, CaseStudyFormAnswer | null>;
  onAnswer: (key: string, value: CaseStudyFormAnswer | null) => void;
  canEditKey?: (key: string) => boolean;
  visibleKey?: (key: string) => boolean;
  partyByKey?: Record<string, PartyQuestionContribution[]>;
  specialistReview?: Record<string, boolean>;
  onToggleReview?: (key: string, approved: boolean) => void;
  showSpecialistReview?: boolean;
}) {
  const questions = CASE_STUDY_SECTION_QUESTIONS[section];
  const headers = CASE_STUDY_TABLE_HEADERS[section];
  const visibleRows = questions
    .map((q, i) => ({ q, i, key: caseStudyAnswerKey(section, i) }))
    .filter((row) => (visibleKey ? visibleKey(row.key) : true));

  if (visibleRows.length === 0) {
    return (
      <p className="po-properties-hint">
        لا توجد أسئلة مسندة لدورك في هذا القسم.
      </p>
    );
  }

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
          {visibleRows.map(({ q, key }) => {
            const val = answers[key] ?? null;
            const editable = canEditKey ? canEditKey(key) : true;
            const partyItems = partyByKey?.[key] ?? [];
            const approved = specialistReview?.[key] ?? false;
            const answerLabel = (a: CaseStudyFormAnswer) =>
              a === "A" ? headers.colA : headers.colB;
            return (
              <tr key={key}>
                <td className="question" colSpan={1}>
                  <div className="cs-form-question-cell">
                    <span className="cs-form-question-text">{q}</span>
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

function CaseStudyMatrixBanner({
  viewerPartyId,
  isParty,
  partyAdvisory,
  partyContribCount,
  onRefreshParty,
}: {
  viewerPartyId: CaseStudyInfoPartyId;
  isParty: boolean;
  partyAdvisory?: boolean;
  partyContribCount: number;
  onRefreshParty: () => void;
}) {
  const party = partyById(viewerPartyId);
  return (
    <div
      className={`note note-info cs-form-matrix-banner${partyAdvisory ? " cs-form-matrix-banner--advisory" : ""}`}
    >
      {isParty ? (
        <p className="cs-form-matrix-banner-text">
          {partyAdvisory ? (
            <>
              الأسئلة أدناه <strong>استدلالية للأخصائي</strong> — تظهر فقط
              المسندة لـ<strong>{party.name}</strong> في «علاقة المستخدم
              بالمعلومة» ولا تُعتبر إجابة نهائية في نموذج الدراسة.
            </>
          ) : (
            <>
              تظهر هنا فقط الأسئلة المسندة لـ<strong>{party.name}</strong> في
              «علاقة المستخدم بالمعلومة». الأسئلة التي دورك فيها «لا دور» لا
              تُعرض.
            </>
          )}
        </p>
      ) : (
        <>
          <p className="cs-form-matrix-banner-text">
            <strong>مسؤولية الأخصائي:</strong> تظهر الأسئلة المسندة لك في
            المصفوفة فقط. راجع إجابات الأطراف على الأسئلة الظاهرة، ثم حدّد
            إجابتك الرسمية واعتمدها حيث وُجدت مساهمات.
          </p>
          {partyContribCount > 0 ? (
            <button
              type="button"
              className="btn btn-sm cs-form-refresh-party"
              onClick={onRefreshParty}
            >
              تحديث إجابات الأطراف ({partyContribCount})
            </button>
          ) : (
            <span className="cs-form-party-empty-hint">
              لا توجد إجابات من الأطراف بعد على الأسئلة الظاهرة.
            </span>
          )}
        </>
      )}
    </div>
  );
}

function SpecialistClosingCards({
  reportModel,
}: {
  reportModel: ReturnType<typeof buildCaseStudyReportModel>;
}) {
  return (
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
  partyAdvisory = false,
}: Props) {
  const isParty = variant === "party" && partyId && partyChildTaskId;
  const viewerPartyId: CaseStudyInfoPartyId = isParty ? partyId! : "specA";
  const storageTaskId = isParty ? partyChildTaskId : taskId;
  const referenceTaskId = isParty
    ? (parentFormTaskId ?? task.id)
    : taskId;

  const seed = useMemo(
    () => buildSeed(task, property, requestDateSeed),
    [task, property, requestDateSeed],
  );

  const { data: infoRolesData, isFetched: infoRolesReady } =
    useCaseStudyInfoRolesQuery();
  const infoRoles = infoRolesData ?? DEFAULT_INFO_ROLES_CONFIG;
  const infoRolesMatrix = infoRoles.matrix;

  const [draft, setDraft] = useState<CaseStudyFormDraft>(() =>
    emptyCaseStudyFormDraft(storageTaskId, seed),
  );
  const [hydrated, setHydrated] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [partyRevision, setPartyRevision] = useState(0);
  const { data: workflowTasks } = useWorkflowTasksQuery();
  const [partyAnswersByKey, setPartyAnswersByKey] = useState<
    Record<string, PartyQuestionContribution[]>
  >({});

  useEffect(() => {
    if (isParty || !hydrated || !infoRolesReady) return;

    let cancelled = false;
    void collectPartyAnswersByQuestion(
      taskId,
      infoRolesMatrix,
      workflowTasks ?? [],
    ).then((result) => {
      if (!cancelled) setPartyAnswersByKey(result);
    });
    return () => {
      cancelled = true;
    };
  }, [
    isParty,
    taskId,
    infoRolesMatrix,
    partyRevision,
    hydrated,
    infoRolesReady,
    workflowTasks,
  ]);

  const isQuestionVisible = useCallback(
    (key: string) =>
      isPartyQuestionVisible(infoRolesMatrix, key, viewerPartyId),
    [viewerPartyId, infoRolesMatrix],
  );

  const partyContribCount = useMemo(() => {
    if (isParty) return 0;
    let n = 0;
    for (const [key, items] of Object.entries(partyAnswersByKey)) {
      if (isQuestionVisible(key)) n += items.length;
    }
    return n;
  }, [isParty, partyAnswersByKey, isQuestionVisible]);

  useEffect(() => {
    if (isParty) return;
    const refresh = () => setPartyRevision((n) => n + 1);
    window.addEventListener("focus", refresh);
    window.addEventListener(CASE_STUDY_INFO_ROLES_CHANGED_EVENT, refresh);
    window.addEventListener(EVALUATOR_SUBMISSION_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener(CASE_STUDY_INFO_ROLES_CHANGED_EVENT, refresh);
      window.removeEventListener(EVALUATOR_SUBMISSION_CHANGED_EVENT, refresh);
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
        void saveCaseStudyFormDraft(next);
        return next;
      });
    },
    [],
  );

  const canEditKey = useCallback(
    (key: string) =>
      canPartyAnswerQuestion(infoRolesMatrix, key, viewerPartyId),
    [viewerPartyId, infoRolesMatrix],
  );

  const sectionHasVisibleQuestions = useCallback(
    (section: CaseStudyQuestionSection) =>
      CASE_STUDY_SECTION_QUESTIONS[section].some((_, i) =>
        isQuestionVisible(caseStudyAnswerKey(section, i)),
      ),
    [isQuestionVisible],
  );

  const visibleStepIndices = useMemo(() => {
    return FORM_STEP_SECTIONS.map((section, i) =>
      sectionHasVisibleQuestions(section) ? i : -1,
    ).filter((i) => i >= 0);
  }, [sectionHasVisibleQuestions]);

  const questionTableProps = {
    canEditKey,
    visibleKey: isQuestionVisible,
    ...(isParty
      ? {}
      : {
          partyByKey: partyAnswersByKey,
          specialistReview: draft.specialistReviewApproved ?? {},
          onToggleReview: toggleSpecialistReview,
          showSpecialistReview: true,
        }),
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const parentDraft = await loadCaseStudyFormDraft(referenceTaskId);
      const partyStored = isParty
        ? await loadPartyCaseStudyFormDraft(storageTaskId)
        : null;
      const stored = isParty
        ? partyStored
        : await loadCaseStudyFormDraft(storageTaskId);
      const base =
        stored ?? emptyCaseStudyFormDraft(storageTaskId, seed);
      const mergedAnswers = isParty
        ? { ...parentDraft?.answers, ...base.answers }
        : base.answers;
      if (cancelled) return;
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
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per task
  }, [storageTaskId, referenceTaskId, isParty]);

  const persist = useCallback(
    (next: CaseStudyFormDraft) => {
      setDraft(next);
      if (isParty) void savePartyCaseStudyFormDraft(next);
      else void saveCaseStudyFormDraft(next);
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
          void loadPartyCaseStudyFormDraft(partyChildTaskId).then((prevParty) => {
            const partyAnswers = {
              ...(prevParty?.answers ?? {}),
              [key]: value,
            };
            void savePartyCaseStudyFormDraft({
              ...next,
              taskId: partyChildTaskId,
              answers: partyAnswers,
            });
          });
        } else {
          void saveCaseStudyFormDraft(next);
        }
        return next;
      });
    },
    [canEditKey, isParty, partyChildTaskId],
  );

  const summary = useMemo(() => {
    let total = 0;
    let answered = 0;
    for (const section of FORM_STEP_SECTIONS) {
      CASE_STUDY_SECTION_QUESTIONS[section].forEach((_, i) => {
        const key = caseStudyAnswerKey(section, i);
        if (!isQuestionVisible(key)) return;
        total += 1;
        const v = draft.answers[key];
        if (v === "A" || v === "B") answered += 1;
      });
    }
    const pending = total - answered;
    const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
    return { total, answered, pending, pct };
  }, [draft.answers, isQuestionVisible]);

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

  const goAdjacentStep = (direction: -1 | 1) => {
    const pool =
      visibleStepIndices.length > 0
        ? visibleStepIndices
        : FORM_STEP_SECTIONS.map((_, i) => i);
    const pos = pool.indexOf(draft.currentStep);
    const nextPos = pos + direction;
    if (nextPos >= 0 && nextPos < pool.length) {
      goStep(pool[nextPos]);
    }
  };

  useEffect(() => {
    if (!hydrated || visibleStepIndices.length === 0) return;
    if (!visibleStepIndices.includes(draft.currentStep)) {
      goStep(visibleStepIndices[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- snap step once when visible set changes
  }, [hydrated, visibleStepIndices, draft.currentStep]);

  const patch = <K extends keyof CaseStudyFormDraft>(
    key: K,
    value: CaseStudyFormDraft[K],
  ) => {
    if (isParty) return;
    setDraft((d) => {
      const next = { ...d, [key]: value };
      void saveCaseStudyFormDraft(next);
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

  if (!hydrated || !infoRolesReady) {
    return <p className="po-properties-loading">جاري تحميل النموذج…</p>;
  }

  if (visibleStepIndices.length === 0) {
    const party = partyById(viewerPartyId);
    return (
      <div className="note note-warn cs-form-matrix-empty">
        لا توجد أسئلة مسندة لـ<strong>{party.name}</strong> في «علاقة المستخدم
        بالمعلومة». راجع الإعدادات في الشريط الجانبي.
      </div>
    );
  }

  const step = draft.currentStep;
  const navSteps = visibleStepIndices;
  const isFirstVisibleStep = navSteps[0] === step;
  const isLastVisibleStep = navSteps[navSteps.length - 1] === step;
  const showStepFooterActions = !partyAdvisory;
  const sectionCardTitle = (label: string) =>
    partyAdvisory ? undefined : label;

  const formFooterActions = (
    <div className="cs-form-actions-end">
      <button type="button" className="btn" onClick={saveDraft}>
        حفظ مسودة
      </button>
      {isParty ? (
        <button type="button" className="btn btn-primary" onClick={submitForm}>
          حفظ إجاباتي
        </button>
      ) : (
        <button type="button" className="btn btn-success" onClick={submitForm}>
          رفع النموذج للنظام
        </button>
      )}
    </div>
  );

  return (
    <div className={`cs-form${partyAdvisory ? " cs-form--party-advisory" : ""}`}>
      {!partyAdvisory ? (
        <div className="cs-form-steps-row">
          <nav className="cs-form-steps" aria-label="خطوات نموذج الدراسة">
            {navSteps.map((i) => {
              const s = CASE_STUDY_FORM_STEPS[i];
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`cs-form-step${step === i ? " active" : ""}${i < step ? " done" : ""}`}
                  onClick={() => goStep(i)}
                >
                  <span className="cs-form-step-num">{STEP_AR_NUMS[i]}</span>
                  {s.label}
                </button>
              );
            })}
          </nav>
          <FormProgressRings summary={summary} />
        </div>
      ) : null}

      {saveNotice ? (
        <div className="note note-success cs-form-notice">{saveNotice}</div>
      ) : null}

      <CaseStudyMatrixBanner
        viewerPartyId={viewerPartyId}
        isParty={!!isParty}
        partyAdvisory={partyAdvisory}
        partyContribCount={partyContribCount}
        onRefreshParty={() => setPartyRevision((n) => n + 1)}
      />

      {step === 0 && sectionHasVisibleQuestions("deed") ? (
        <section className="cs-form-panel">
          <RegistrationFormCard title={sectionCardTitle("بيانات الصك والعقار")}>
            <QuestionTable
              section="deed"
              answers={draft.answers}
              onAnswer={setAnswer}
              {...questionTableProps}
            />
            {!isParty ? (
              <RemarksBlock
                label="في حال وجود اختلاف في البيانات أعلاه يتم التوضيح في الملاحظات ادناه"
                value={draft.deedRemarks}
                onChange={(v) => patch("deedRemarks", v)}
              />
            ) : null}
          </RegistrationFormCard>
          {!isParty && isLastVisibleStep ? (
            <SpecialistClosingCards reportModel={reportModel} />
          ) : null}
          <div className="cs-form-actions">
            <span />
            {isLastVisibleStep ? (
              showStepFooterActions ? formFooterActions : null
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => goAdjacentStep(1)}
              >
                التالي — الرفع المساحي ←
              </button>
            )}
          </div>
        </section>
      ) : null}

      {step === 1 && sectionHasVisibleQuestions("survey") ? (
        <section className="cs-form-panel">
          <RegistrationFormCard title={sectionCardTitle("الرفع المساحي والطبيعة")}>
            <QuestionTable
              section="survey"
              answers={draft.answers}
              onAnswer={setAnswer}
              {...questionTableProps}
            />
            {!isParty ? (
              <RemarksBlock
                label="في حال وجود اختلاف في البيانات أعلاه يتم التوضيح في الملاحظات ادناه"
                value={draft.surveyRemarks}
                onChange={(v) => patch("surveyRemarks", v)}
              />
            ) : null}
          </RegistrationFormCard>
          {!isParty && isLastVisibleStep ? (
            <SpecialistClosingCards reportModel={reportModel} />
          ) : null}
          <div className="cs-form-actions">
            {!isFirstVisibleStep ? (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => goAdjacentStep(-1)}
              >
                → السابق
              </button>
            ) : (
              <span />
            )}
            {isLastVisibleStep ? (
              showStepFooterActions ? formFooterActions : null
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => goAdjacentStep(1)}
              >
                التالي — مكونات العقار ←
              </button>
            )}
          </div>
        </section>
      ) : null}

      {step === 2 && sectionHasVisibleQuestions("comp") ? (
        <section className="cs-form-panel">
          <RegistrationFormCard title={sectionCardTitle("مكونات العقار")}>
            <QuestionTable
              section="comp"
              answers={draft.answers}
              onAnswer={setAnswer}
              {...questionTableProps}
            />
            {!isParty ? (
              <>
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
              </>
            ) : null}
          </RegistrationFormCard>
          {!isParty && isLastVisibleStep ? (
            <SpecialistClosingCards reportModel={reportModel} />
          ) : null}
          <div className="cs-form-actions">
            {!isFirstVisibleStep ? (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => goAdjacentStep(-1)}
              >
                → السابق
              </button>
            ) : (
              <span />
            )}
            {isLastVisibleStep ? (
              showStepFooterActions ? formFooterActions : null
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => goAdjacentStep(1)}
              >
                التالي — الإشغال والإيجار ←
              </button>
            )}
          </div>
        </section>
      ) : null}

      {step === 3 && sectionHasVisibleQuestions("occ") ? (
        <section className="cs-form-panel">
          <RegistrationFormCard title={sectionCardTitle("الإشغال والإيجار")}>
            <QuestionTable
              section="occ"
              answers={draft.answers}
              onAnswer={setAnswer}
              {...questionTableProps}
            />
            {!isParty ? (
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
            ) : null}
          </RegistrationFormCard>
          {!isParty && isLastVisibleStep ? (
            <SpecialistClosingCards reportModel={reportModel} />
          ) : null}
          <div className="cs-form-actions">
            {!isFirstVisibleStep ? (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => goAdjacentStep(-1)}
              >
                → السابق
              </button>
            ) : (
              <span />
            )}
            {isLastVisibleStep ? (
              showStepFooterActions ? formFooterActions : null
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => goAdjacentStep(1)}
              >
                التالي — ملاحظات إضافية ←
              </button>
            )}
          </div>
        </section>
      ) : null}

      {step === 4 && sectionHasVisibleQuestions("extra") ? (
        <section className="cs-form-panel">
          <RegistrationFormCard title={sectionCardTitle("ملاحظات إضافية")}>
            <QuestionTable
              section="extra"
              answers={draft.answers}
              onAnswer={setAnswer}
              {...questionTableProps}
            />
          </RegistrationFormCard>

          {!isParty && isLastVisibleStep ? (
            <SpecialistClosingCards reportModel={reportModel} />
          ) : null}
          <div className="cs-form-actions">
            {!isFirstVisibleStep ? (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => goAdjacentStep(-1)}
              >
                → السابق
              </button>
            ) : (
              <span />
            )}
            {isLastVisibleStep ? (showStepFooterActions ? formFooterActions : null) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
