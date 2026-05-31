"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { StatValue } from "@/components/ui/StatValue";
import { PoNumber } from "@/components/ui/PoNumber";
import { StepIndicator } from "@/components/prototype/registration/StepIndicator";
import { RegistrationFormCard } from "@/components/prototype/registration/RegistrationFormCard";
import { PoPropertyEnfathForm } from "@/components/prototype/po-intake/PoPropertyEnfathForm";
import { PoPropertyBourseForm } from "@/components/prototype/po-intake/PoPropertyBourseForm";
import {
  firstEnfathValidationMessage,
  mergePropertyEnfathValidation,
} from "@/components/prototype/po-intake/po-property-enfath-validation";
import {
  firstBourseValidationMessage,
  validatePropertyBourseFields,
} from "@/components/prototype/po-intake/po-property-bourse-validation";
import {
  hasFieldErrors,
  type FieldErrors,
} from "@/components/prototype/registration/registration-utils";
import { usePrototype } from "@/contexts/PrototypeContext";
import {
  classificationRequiresSurvey,
  emptyProperty,
  formatPropertyDeedDisplay,
  isBourseInquiryIdentifier,
  type AssignmentType,
  type PoPropertyIntake,
} from "@/lib/prototype/po-intake-data";
import {
  addPropertyToPo,
  completePropertyBourse,
  deedExistsInPo,
  findPriorDeedFull,
  getPoRecord,
  loadPoRecords,
  updatePropertyInPo,
} from "@/lib/prototype/po-intake-storage";
import { poPropertyFailurePath } from "@/lib/po-routes";
import {
  advanceTaskAfterBourse,
  advanceTaskAfterEnfath,
  completeChildTask,
  confirmTaskDistribution,
  defaultDistribution,
  engineeringOfficeAvailable,
  patchTaskDistribution,
  resolveTaskObstruction,
  syncTasksFromPoRecords,
  taskDisplayPropertyLabel,
  taskKindLabel,
  taskPhaseLabel,
  taskStatusLabel,
  tasksForRole,
  type CaseStudyTaskPhase,
  type TaskDistributionDraft,
  type WorkflowTask,
} from "@/lib/prototype/tasks-storage";
import { useWorkflowTasksQuery } from "@/lib/query/prototype-queries";

const PHASE_STEPS = [
  "البيانات الأولية للعقار",
  "بيانات البورصة",
  "توزيع الأطراف",
] as const;

type TaskFilter = "open" | "completed";

function phaseToStep(phase: CaseStudyTaskPhase): number {
  if (phase === "enfath") return 1;
  if (phase === "bourse") return 2;
  if (phase === "distribution" || phase === "obstruction") return 3;
  return 4;
}

function taskBadgeClass(task: WorkflowTask): string {
  if (task.status === "blocked") return "b-cancel";
  if (task.status === "completed") return "b-done";
  return "b-prog";
}

function TaskListEmpty() {
  return (
    <div className="my-tasks-empty">
      <div className="my-tasks-empty-icon" aria-hidden>
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      </div>
      <p className="my-tasks-empty-title">لا توجد مهام حالياً</p>
      <p className="my-tasks-empty-sub">
        بعد تسجيل أمر عمل (PO) مع عدد العقارات المتوقع، تظهر هنا مهمة لكل
        خانة عقار.
      </p>
    </div>
  );
}

function TaskLoading() {
  return (
    <div className="my-tasks-loading">
      <span className="my-tasks-loading-dot" aria-hidden />
      جاري تحميل المهام…
    </div>
  );
}

function CaseStudyTaskWorkflow({
  task,
  onRefresh,
}: {
  task: WorkflowTask;
  onRefresh: () => void;
}) {
  const { role } = usePrototype();
  const [assignmentType, setAssignmentType] = useState<AssignmentType>("تنفيذ");
  const [property, setProperty] = useState<PoPropertyIntake>(emptyProperty);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasPriorSurvey, setHasPriorSurvey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [distribution, setDistribution] = useState<TaskDistributionDraft>(
    () => task.distribution ?? defaultDistribution(),
  );

  useEffect(() => {
    setDistribution(task.distribution ?? defaultDistribution());
  }, [task.id, task.distribution]);

  const isSupervisor = role === "section-supervisor";
  const isSpecialist = role === "case-specialist";

  const loadProperty = useCallback(async () => {
    setLoading(true);
    const record = await getPoRecord(task.poNumber);
    setAssignmentType(record?.assignmentType ?? task.assignmentType ?? "تنفيذ");
    if (task.propertyId && record) {
      const prop =
        record.properties.find((p) => p.id === task.propertyId) ?? emptyProperty();
      setProperty(prop);
      if (prop.deedNumber.trim()) {
        const prior = await findPriorDeedFull(
          prop.deedNumber.trim(),
          task.poNumber,
        );
        setHasPriorSurvey(Boolean(prior));
      }
    } else {
      setProperty(emptyProperty());
      setHasPriorSurvey(false);
    }
    setLoading(false);
  }, [task.poNumber, task.propertyId, task.assignmentType]);

  useEffect(() => {
    void loadProperty();
  }, [loadProperty]);

  const patchProperty = useCallback(
    <K extends keyof PoPropertyIntake>(key: K, value: PoPropertyIntake[K]) => {
      setProperty((p) => {
        const next = { ...p, [key]: value };
        if (key === "classification") next.propertyType = "";
        return next;
      });
      setFieldErrors((e) => {
        if (!e[String(key)]) return e;
        const next = { ...e };
        delete next[String(key)];
        return next;
      });
    },
    [],
  );

  const showEngineering = engineeringOfficeAvailable(
    property,
    hasPriorSurvey,
    distribution.fieldInspectorRecommendedVisit,
  );
  const requiresSurvey = classificationRequiresSurvey(property.classification);

  useEffect(() => {
    if (loading || task.phase !== "distribution" || requiresSurvey) return;
    if (
      distribution.fieldInspectorRecommendedVisit ||
      distribution.engineeringOffice
    ) {
      const next = {
        ...distribution,
        fieldInspectorRecommendedVisit: false,
        engineeringOffice: false,
      };
      setDistribution(next);
      patchTaskDistribution(task.id, next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync once when classification excludes survey
  }, [loading, task.phase, task.id, requiresSurvey, property.classification]);

  function engineeringUnavailableHint(): string | null {
    if (!requiresSurvey) return null;
    if (hasPriorSurvey) return "يوجد رفع مساحي سابق لنفس الصك";
    if (!distribution.fieldInspector) {
      return "المكتب الهندسي اختياري — اختر المعاين الميداني أولاً إن رغبت بتفعيله";
    }
    if (!distribution.fieldInspectorRecommendedVisit) {
      return "المكتب الهندسي اختياري — فعّل توصية المعاين بزيارة ميدانية لتفعيله";
    }
    return null;
  }

  async function saveEnfath() {
    setFormError(null);
    const errors = mergePropertyEnfathValidation(property, assignmentType);
    if (hasFieldErrors(errors)) {
      setFieldErrors(errors);
      setFormError(firstEnfathValidationMessage(errors));
      return;
    }
    if (
      property.deedNumber.trim() &&
      (await deedExistsInPo(
        task.poNumber,
        property.deedNumber.trim(),
        task.propertyId,
      ))
    ) {
      setFormError("رقم الصك مسجّل مسبقاً في هذا أمر العمل.");
      return;
    }

    setSaving(true);
    const result = task.propertyId
      ? await updatePropertyInPo(task.poNumber, task.propertyId, property)
      : await addPropertyToPo(task.poNumber, property, {
          assignToTaskId: task.id,
        });
    setSaving(false);

    if (!result.ok) {
      setFormError(result.error);
      if (result.errors) setFieldErrors(result.errors);
      return;
    }

    if (result.ok && task.propertyId) {
      advanceTaskAfterEnfath(task.id, result.data);
    }
    onRefresh();
  }

  async function saveBourse() {
    setFormError(null);
    const bourseInquiryFastPath =
      task.phase === "enfath" && isBourseInquiryIdentifier(property.identifierType);

    if (bourseInquiryFastPath) {
      const enfathErrors = mergePropertyEnfathValidation(property, assignmentType);
      if (hasFieldErrors(enfathErrors)) {
        setFieldErrors(enfathErrors);
        setFormError(firstEnfathValidationMessage(enfathErrors));
        return;
      }
      if (
        property.deedNumber.trim() &&
        (await deedExistsInPo(
          task.poNumber,
          property.deedNumber.trim(),
          task.propertyId,
        ))
      ) {
        setFormError("رقم الصك مسجّل مسبقاً في هذا أمر العمل.");
        return;
      }
    }

    const errors = validatePropertyBourseFields(property);
    if (hasFieldErrors(errors)) {
      setFieldErrors(errors);
      setFormError(firstBourseValidationMessage(errors));
      return;
    }

    if (!task.propertyId && !bourseInquiryFastPath) {
      setFormError("لا يوجد عقار مرتبط بهذه المهمة.");
      return;
    }

    setSaving(true);
    let prop = property;
    let propertyId = task.propertyId;

    if (!propertyId) {
      const insert = await addPropertyToPo(task.poNumber, property, {
        assignToTaskId: task.id,
      });
      if (!insert.ok) {
        setSaving(false);
        setFormError(insert.error);
        if (insert.errors) setFieldErrors(insert.errors);
        return;
      }
      prop = insert.data;
      propertyId = insert.data.id;
    } else if (bourseInquiryFastPath) {
      const updated = await updatePropertyInPo(
        task.poNumber,
        propertyId,
        property,
      );
      if (!updated.ok) {
        setSaving(false);
        setFormError(updated.error);
        if (updated.errors) setFieldErrors(updated.errors);
        return;
      }
      prop = updated.data;
      advanceTaskAfterEnfath(task.id, updated.data);
    }

    const result = await completePropertyBourse(
      task.poNumber,
      propertyId!,
      prop,
    );
    setSaving(false);

    if (!result.ok) {
      setFormError(result.error);
      if (result.errors) setFieldErrors(result.errors);
      return;
    }

    advanceTaskAfterBourse(task.id, result.data);
    onRefresh();
  }

  function confirmDistribution() {
    setFormError(null);
    const selected =
      distribution.fieldInspector ||
      distribution.governmentReviewer ||
      distribution.engineeringOffice;
    if (!selected) {
      setFormError("اختر طرفاً واحداً على الأقل للتوزيع.");
      return;
    }
    if (distribution.engineeringOffice && !showEngineering) {
      setFormError("المكتب الهندسي غير متاح لهذا العقار وفق الشروط.");
      return;
    }

    confirmTaskDistribution(
      task.id,
      distribution,
      formatPropertyDeedDisplay(property),
    );
    onRefresh();
  }

  function patchDistribution(patch: Partial<TaskDistributionDraft>) {
    const next = { ...distribution, ...patch };
    if (!classificationRequiresSurvey(property.classification)) {
      next.fieldInspectorRecommendedVisit = false;
      next.engineeringOffice = false;
    }
    if (!next.fieldInspector) {
      next.fieldInspectorRecommendedVisit = false;
      next.engineeringOffice = false;
    }
    if (!next.fieldInspectorRecommendedVisit) {
      next.engineeringOffice = false;
    }
    setDistribution(next);
    patchTaskDistribution(task.id, next);
    onRefresh();
  }

  if (loading) {
    return <TaskLoading />;
  }

  if (task.phase === "obstruction") {
    return (
      <RegistrationFormCard title="تعذر — بانتظار المشرف">
        <div className="note note-warn" style={{ marginBottom: 12 }}>
          {task.obstructionReason || "تم تسجيل تعذر على هذا العقار."}
        </div>
        {isSupervisor ? (
          <div className="my-tasks-form-actions" style={{ marginTop: 0, paddingTop: 0, border: 0 }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                resolveTaskObstruction(task.id);
                onRefresh();
              }}
            >
              إعادة للأخصائي
            </button>
            <Link href="/failures" className="btn">
              مراجعة التعذرات
            </Link>
          </div>
        ) : (
          <p style={{ color: "var(--text3)", fontSize: 13 }}>
            المهمة لدى المشرف حتى يُبت في التعذر.
          </p>
        )}
      </RegistrationFormCard>
    );
  }

  if (task.phase === "done" || task.status === "completed") {
    return (
      <RegistrationFormCard title="المهمة مكتملة">
        <div className="note note-success">
          اكتملت مهمة العقار. تم إرسال مهام فرعية للأطراف المختارين (إن وُجد).
        </div>
      </RegistrationFormCard>
    );
  }

  if (!isSpecialist) {
    return (
      <p className="field-team-empty">
        هذه المهمة مخصصة لأخصائي دراسة الحالة.
      </p>
    );
  }

  const bourseInquiryFastPath =
    task.phase === "enfath" && isBourseInquiryIdentifier(property.identifierType);
  const showEnfathStep = task.phase === "enfath" && !bourseInquiryFastPath;
  const showBourseStep = task.phase === "bourse" || bourseInquiryFastPath;

  return (
    <div className="my-tasks-workflow">
      <StepIndicator
        steps={[...PHASE_STEPS]}
        current={bourseInquiryFastPath ? 2 : phaseToStep(task.phase)}
      />

      {formError ? (
        <div className="note note-warn" role="alert" style={{ marginBottom: 12 }}>
          {formError}
        </div>
      ) : null}

      {showEnfathStep ? (
        <RegistrationFormCard title="البيانات الأولية للعقار">
          <PoPropertyEnfathForm
            property={property}
            propertyOrdinal={task.propertyOrdinal}
            assignmentType={assignmentType}
            fieldErrors={fieldErrors}
            onPatch={patchProperty}
            poNumber={task.poNumber}
            showStageNote
          />
          <div className="my-tasks-form-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={saving}
              onClick={() => void saveEnfath()}
            >
              {saving ? "جاري الحفظ…" : "حفظ والانتقال للبورصة"}
            </button>
          </div>
        </RegistrationFormCard>
      ) : null}

      {showBourseStep ? (
        <RegistrationFormCard title="المرحلة 2 — بيانات البورصة العقارية">
          {bourseInquiryFastPath ? (
            <PoPropertyEnfathForm
              property={property}
              propertyOrdinal={task.propertyOrdinal}
              assignmentType={assignmentType}
              fieldErrors={fieldErrors}
              onPatch={patchProperty}
              poNumber={task.poNumber}
              showStageNote
              fieldsMode="bourse-inquiry-primary"
            />
          ) : null}
          {bourseInquiryFastPath ? (
            <div
              className="my-tasks-bourse-divider"
              role="separator"
              aria-hidden
            />
          ) : null}
          <PoPropertyBourseForm
            property={property}
            fieldErrors={fieldErrors}
            onPatch={patchProperty}
          />
          <div className="my-tasks-form-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={saving}
              onClick={() => void saveBourse()}
            >
              {saving ? "جاري الحفظ…" : "حفظ والانتقال للتوزيع"}
            </button>
            {task.propertyId ? (
              <Link
                href={poPropertyFailurePath(task.poNumber, task.propertyId)}
                className="btn btn-danger-outline"
              >
                تسجيل تعذر
              </Link>
            ) : null}
          </div>
        </RegistrationFormCard>
      ) : null}

      {task.phase === "distribution" ? (
        <RegistrationFormCard title="المرحلة 3 — توزيع الأطراف">
          <p className="note note-info" style={{ marginBottom: 14 }}>
            يمكن اختيار أكثر من طرف في آن واحد (مسار متوازٍ).
          </p>

          <div className="my-tasks-party-grid">
            <label className="my-tasks-party-card">
              <input
                type="checkbox"
                checked={distribution.fieldInspector}
                onChange={(e) =>
                  patchDistribution({ fieldInspector: e.target.checked })
                }
              />
              <div className="my-tasks-party-body">
                <p className="my-tasks-party-title">معاين ميداني</p>
                <p className="my-tasks-party-desc">
                  قسم التقييم العقاري — زيارة ميدانية
                </p>
              </div>
            </label>

            <label className="my-tasks-party-card">
              <input
                type="checkbox"
                checked={distribution.governmentReviewer}
                onChange={(e) =>
                  patchDistribution({ governmentReviewer: e.target.checked })
                }
              />
              <div className="my-tasks-party-body">
                <p className="my-tasks-party-title">مراجع حكومي</p>
                <p className="my-tasks-party-desc">
                  مراجعة الجهة الحكومية المعنية
                </p>
              </div>
            </label>

            {showEngineering ? (
              <label className="my-tasks-party-card">
                <input
                  type="checkbox"
                  checked={distribution.engineeringOffice}
                  onChange={(e) =>
                    patchDistribution({ engineeringOffice: e.target.checked })
                  }
                />
                <div className="my-tasks-party-body">
                  <p className="my-tasks-party-title">مكتب هندسي</p>
                  <p className="my-tasks-party-desc">
                    رفع مساحي — عند توصية المعاين
                  </p>
                </div>
              </label>
            ) : null}
          </div>

          <div className="my-tasks-party-foot">
          {distribution.fieldInspector && requiresSurvey ? (
            <label className="my-tasks-party-card my-tasks-party-card-nested">
              <input
                type="checkbox"
                checked={distribution.fieldInspectorRecommendedVisit}
                onChange={(e) =>
                  patchDistribution({
                    fieldInspectorRecommendedVisit: e.target.checked,
                    engineeringOffice: e.target.checked
                      ? distribution.engineeringOffice
                      : false,
                  })
                }
              />
              <div className="my-tasks-party-body">
                <p className="my-tasks-party-title">يوصي المعاين بزيارة ميدانية</p>
                <p className="my-tasks-party-desc">
                  اختياري — لتفعيل إرسال العقار للمكتب الهندسي
                </p>
              </div>
            </label>
          ) : null}

          {!requiresSurvey ? (
            <p className="my-tasks-party-hint">
              المكتب الهندسي غير متاح: تصنيف «وحدة داخل مبنى» لا يتطلب رفعاً
              مساحياً.
            </p>
          ) : !showEngineering && engineeringUnavailableHint() ? (
            <p className="my-tasks-party-hint">{engineeringUnavailableHint()}</p>
          ) : null}
          </div>

          <div className="my-tasks-form-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={confirmDistribution}
            >
              تأكيد التوزيع وإرسال المهام
            </button>
            {task.propertyId ? (
              <Link
                href={poPropertyFailurePath(task.poNumber, task.propertyId)}
                className="btn btn-danger-outline"
              >
                تسجيل تعذر
              </Link>
            ) : null}
          </div>
        </RegistrationFormCard>
      ) : null}
    </div>
  );
}

function ChildTaskPanel({
  task,
  onRefresh,
}: {
  task: WorkflowTask;
  onRefresh: () => void;
}) {
  return (
    <div className="my-tasks-child-panel">
      <div className="my-tasks-child-icon" aria-hidden>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      </div>
      <RegistrationFormCard title={task.title}>
        <p style={{ marginBottom: 12, color: "var(--text2)", fontSize: 13 }}>
          {taskKindLabel(task.kind)} — أمر العمل{" "}
          <PoNumber value={task.poNumber} link />
        </p>
        {task.status === "completed" ? (
          <div className="note note-success">تم إنجاز هذه المهمة.</div>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              completeChildTask(task.id);
              onRefresh();
            }}
          >
            تأشير كمكتملة
          </button>
        )}
      </RegistrationFormCard>
    </div>
  );
}

function TaskRow({
  task,
  selected,
  onSelect,
}: {
  task: WorkflowTask;
  selected: boolean;
  onSelect: () => void;
}) {
  const label = taskDisplayPropertyLabel(task);
  const phase =
    task.kind === "case-study-property"
      ? taskPhaseLabel(task.phase)
      : taskKindLabel(task.kind);

  return (
    <button
      type="button"
      className={`my-tasks-row${selected ? " active" : ""}`}
      onClick={onSelect}
    >
      <span className="my-tasks-row-slot" aria-hidden>
        {task.propertyOrdinal}
      </span>
      <div className="my-tasks-row-main">
        <p className="my-tasks-row-title">{label}</p>
        <p className="my-tasks-row-po">
          PO <PoNumber value={task.poNumber} link />
        </p>
      </div>
      <div className="my-tasks-row-meta">
        <span className={`badge ${taskBadgeClass(task)}`}>
          {taskStatusLabel(task.status)}
        </span>
        <span className="my-tasks-row-phase">{phase}</span>
      </div>
    </button>
  );
}

export function MyTasksView() {
  const { role } = usePrototype();
  const { data: tasks, refetch, isLoading } = useWorkflowTasksQuery();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskFilter>("open");

  useEffect(() => {
    void loadPoRecords().then((records) => {
      syncTasksFromPoRecords(records);
      void refetch();
    });
  }, [refetch]);

  const mine = useMemo(
    () => tasksForRole(role, tasks ?? []),
    [role, tasks],
  );

  const activeTasks = useMemo(
    () =>
      mine.filter((t) => t.status === "open" || t.status === "blocked"),
    [mine],
  );

  const filtered = useMemo(() => {
    if (filter === "completed") {
      return mine.filter((t) => t.status === "completed");
    }
    return activeTasks;
  }, [mine, filter, activeTasks]);

  const openCount = activeTasks.length;
  const doneCount = mine.filter((t) => t.status === "completed").length;

  const selected = filtered.find((t) => t.id === selectedId) ?? filtered[0] ?? null;

  useEffect(() => {
    const stillVisible = selectedId
      ? filtered.some((t) => t.id === selectedId)
      : false;
    if (!stillVisible) {
      setSelectedId(filtered[0]?.id ?? null);
    }
  }, [filtered, selectedId]);

  const refresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const showSplit = !isLoading && filtered.length > 0;

  return (
    <div className="my-tasks-page">
      <div className="stat-grid my-tasks-stat-grid">
        <div className="stat-card blue">
          <div className="stat-label">مهامي المفتوحة</div>
          <StatValue value={openCount} />
          <div className="stat-sub">بانتظار الإنجاز أو المراجعة</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">إجمالي المهام</div>
          <StatValue value={mine.length} />
          <div className="stat-sub">على مستوى العقار</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">مكتملة</div>
          <StatValue value={doneCount} />
          <div className="stat-sub">تم التوزيع أو الإغلاق</div>
        </div>
        <div className="stat-card warn">
          <div className="stat-label">المرحلة الحالية</div>
          <div className="my-tasks-stat-highlight">
            {selected
              ? selected.kind === "case-study-property"
                ? taskPhaseLabel(selected.phase).replace("المرحلة ", "")
                : taskKindLabel(selected.kind)
              : "—"}
          </div>
          <div className="stat-sub">للمهمة المحددة</div>
        </div>
      </div>

      <div className="note note-info my-tasks-intro">
        <strong>مسار العمل:</strong> عند تسجيل أمر العمل يُحدَّد عدد العقارات
        يدوياً — تُنشأ مهمة لكل خانة. أكمل البيانات الأولية ثم البورصة ثم
        التوزيع. يمكن أيضاً تسجيل العقار من{" "}
        <Link href="/po">أوامر العمل → إضافة عقار</Link>.
      </div>

      <div
        className={`my-tasks-layout${showSplit ? " my-tasks-layout--split" : ""}`}
      >
        <div className="card my-tasks-queue">
          <div className="card-header">
            <span className="card-title">
              قائمة المهام
              {!isLoading ? (
                <span className="badge b-prog">{filtered.length}</span>
              ) : null}
            </span>
            <button
              type="button"
              className="btn btn-sm"
              disabled={isLoading}
              onClick={() => void refresh()}
            >
              تحديث
            </button>
          </div>

          {!isLoading && mine.length > 0 ? (
            <div className="my-tasks-queue-tools">
              {(
                [
                  ["open", "مفتوحة"],
                  ["completed", "مكتملة"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`my-tasks-filter${filter === id ? " active" : ""}`}
                  onClick={() => setFilter(id)}
                >
                  {label}
                  {id === "open" ? ` (${openCount})` : doneCount ? ` (${doneCount})` : ""}
                </button>
              ))}
            </div>
          ) : null}

          {isLoading ? (
            <TaskLoading />
          ) : mine.length === 0 ? (
            <TaskListEmpty />
          ) : filtered.length === 0 ? (
            <div className="my-tasks-empty">
              <p className="my-tasks-empty-title">
                {filter === "completed" ? "لا مهام مكتملة" : "لا مهام مفتوحة"}
              </p>
              <p className="my-tasks-empty-sub">
                {filter === "open" && doneCount > 0
                  ? "أنجزت جميع مهامك الحالية."
                  : filter === "completed"
                    ? "المهام المكتملة تظهر هنا بعد إنهائها."
                    : "جرّب تحديث القائمة أو انتظر مهاماً جديدة."}
              </p>
              {filter === "open" && doneCount > 0 ? (
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ marginTop: 12 }}
                  onClick={() => setFilter("completed")}
                >
                  عرض المكتملة ({doneCount})
                </button>
              ) : null}
            </div>
          ) : (
            <div className="my-tasks-list">
              {filtered.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  selected={selected?.id === t.id}
                  onSelect={() => setSelectedId(t.id)}
                />
              ))}
            </div>
          )}
        </div>

        {showSplit ? (
          <div className="card my-tasks-detail-panel">
            <div className="card-header">
              <div className="my-tasks-detail-head">
                <span className="card-title">تفاصيل المهمة</span>
                {selected ? (
                  <span className={`badge ${taskBadgeClass(selected)}`}>
                    {taskStatusLabel(selected.status)}
                  </span>
                ) : null}
              </div>
            </div>

            {selected ? (
              <>
                <div className="my-tasks-detail-meta">
                  <span>
                    <strong>الخانة:</strong> {selected.propertyOrdinal}
                  </span>
                  <span>
                    <strong>PO:</strong>{" "}
                    <PoNumber value={selected.poNumber} link />
                  </span>
                  <span>
                    <strong>العقار:</strong> {taskDisplayPropertyLabel(selected)}
                  </span>
                </div>
                <div className="my-tasks-detail-body">
                  {selected.kind === "case-study-property" ? (
                    <CaseStudyTaskWorkflow task={selected} onRefresh={refresh} />
                  ) : (
                    <ChildTaskPanel task={selected} onRefresh={refresh} />
                  )}
                </div>
              </>
            ) : (
              <p className="field-team-empty">اختر مهمة من القائمة.</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
