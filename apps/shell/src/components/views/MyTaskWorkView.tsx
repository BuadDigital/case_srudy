"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DistributionPartiesForm } from "@/components/prototype/distribution/DistributionPartiesForm";
import { RegistrationFormCard } from "@/components/prototype/registration/RegistrationFormCard";
import { TaskWorkChrome } from "@/components/prototype/primary-data/TaskWorkChrome";
import { PoEditShell } from "@/components/prototype/po-intake/PoEditShell";
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
import { myTasksPath } from "@/lib/my-task-routes";
import {
  classificationRequiresSurvey,
  emptyProperty,
  formatPoDisplay,
  formatPropertyDeedDisplay,
  isBourseInquiryIdentifier,
  skipsBourseForIdentifier,
  type AssignmentType,
  type PoPropertyIntake,
  type PropertyIdentifierType,
} from "@/lib/prototype/po-intake-data";
import {
  addPropertyToPo,
  completePropertyBourse,
  deedExistsInPo,
  findPriorDeedFull,
  getPoRecord,
  updatePropertyInPo,
} from "@/lib/prototype/po-intake-storage";
import { poPropertyFailurePath } from "@/lib/po-routes";
import {
  advanceTaskAfterBourse,
  advanceTaskAfterEnfath,
  completeChildTask,
  confirmTaskDistribution,
  defaultDistribution,
  distributionValidationError,
  engineeringOfficeAvailable,
  loadWorkflowTasks,
  migrateDistribution,
  patchTaskDistribution,
  resolveTaskObstruction,
  TASKS_CHANGED_EVENT,
  taskDisplayPropertyLabel,
  taskKindLabel,
  type TaskDistributionDraft,
  type WorkflowTask,
} from "@/lib/prototype/tasks-storage";

function useWorkflowTask(taskId: string): WorkflowTask | null {
  const [task, setTask] = useState<WorkflowTask | null>(null);

  const reload = useCallback(() => {
    setTask(loadWorkflowTasks().find((t) => t.id === taskId) ?? null);
  }, [taskId]);

  useEffect(() => {
    reload();
    const onChange = () => reload();
    window.addEventListener(TASKS_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(TASKS_CHANGED_EVENT, onChange);
  }, [reload]);

  return task;
}

export function CaseStudyTaskWork({
  task,
  onRefresh,
  layout = "page",
  onClose,
  onEnfathSaved,
}: {
  task: WorkflowTask;
  onRefresh: () => void;
  layout?: "page" | "panel";
  onClose?: () => void;
  /** After successful إنفاذ save (panel flow): advance or route by identifier type. */
  onEnfathSaved?: (
    taskId: string,
    meta: { identifierType: PropertyIdentifierType },
  ) => void | Promise<void>;
}) {
  const router = useRouter();
  const exit = onClose ?? (() => router.push(myTasksPath()));
  const { role } = usePrototype();
  const [assignmentType, setAssignmentType] = useState<AssignmentType>("تنفيذ");
  const [property, setProperty] = useState<PoPropertyIntake>(emptyProperty);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasPriorSurvey, setHasPriorSurvey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [distribution, setDistribution] = useState<TaskDistributionDraft>(
    () => migrateDistribution(task.distribution),
  );

  useEffect(() => {
    setDistribution(migrateDistribution(task.distribution));
  }, [task.id, task.distribution]);

  const isSupervisor = role === "section-supervisor" || role === "cdo";
  const isSpecialist = role === "case-specialist" || role === "cdo";

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

  const showEngineering = engineeringOfficeAvailable(property, hasPriorSurvey);
  const requiresSurvey = classificationRequiresSurvey(property.classification);

  useEffect(() => {
    if (loading || task.phase !== "distribution" || showEngineering) return;
    if (distribution.engineeringOffice) {
      const next = migrateDistribution({
        ...distribution,
        engineeringOffice: false,
        engineeringOfficeId: "",
      });
      setDistribution(next);
      patchTaskDistribution(task.id, next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when engineering unavailable
  }, [loading, task.phase, task.id, showEngineering, property.classification]);

  function engineeringUnavailableHint(): string | null {
    if (!requiresSurvey) {
      return "المكتب الهندسي غير متاح: تصنيف «وحدة داخل مبنى» لا يتطلب رفعاً مساحياً.";
    }
    if (hasPriorSurvey) return "يوجد رفع مساحي سابق لنفس الصك — لا حاجة لمكتب هندسي.";
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

    const persisted = skipsBourseForIdentifier(property.identifierType)
      ? { ...property, bourseDataCompleted: true }
      : isBourseInquiryIdentifier(property.identifierType)
        ? { ...property, bourseDataCompleted: false }
        : property;

    setSaving(true);
    const result = task.propertyId
      ? await updatePropertyInPo(task.poNumber, task.propertyId, persisted)
      : await addPropertyToPo(task.poNumber, persisted, {
          assignToTaskId: task.id,
        });
    setSaving(false);

    if (!result.ok) {
      setFormError(result.error);
      if (result.errors) setFieldErrors(result.errors);
      return;
    }

    if (result.ok) {
      const advanced = skipsBourseForIdentifier(property.identifierType)
        ? { ...result.data, bourseDataCompleted: true }
        : result.data;
      if (task.propertyId) {
        advanceTaskAfterEnfath(task.id, advanced);
      }
      if (onEnfathSaved) {
        await onEnfathSaved(task.id, {
          identifierType: property.identifierType,
        });
      } else {
        onRefresh();
      }
    }
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
    const validation = distributionValidationError(
      distribution,
      showEngineering,
    );
    if (validation) {
      setFormError(validation);
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
    const next = migrateDistribution({ ...distribution, ...patch });
    if (!showEngineering) {
      next.engineeringOffice = false;
      next.engineeringOfficeId = "";
    }
    setDistribution(next);
    patchTaskDistribution(task.id, next);
    onRefresh();
  }

  const bourseInquiryFastPath =
    task.phase === "enfath" && isBourseInquiryIdentifier(property.identifierType);
  /** Primary-data panel: استعلام بورصة fields live on «استعلام بورصة» tab only. */
  const bourseInquiryPanelOnly =
    layout === "panel" && bourseInquiryFastPath;
  const showEnfathStep =
    task.phase === "enfath" && (!bourseInquiryFastPath || bourseInquiryPanelOnly);
  const showBourseStep =
    (task.phase === "bourse" || bourseInquiryFastPath) && !bourseInquiryPanelOnly;
  const showDistribution = task.phase === "distribution";
  const showCaseStudy = task.phase === "case-study";
  const showPrimarySave =
    isSpecialist &&
    !showCaseStudy &&
    task.phase !== "obstruction" &&
    task.phase !== "done" &&
    task.status !== "completed";

  const saveLabel = showEnfathStep
    ? saving
      ? "جاري الحفظ…"
      : "حفظ"
    : showBourseStep
      ? saving
        ? "جاري الحفظ…"
        : "حفظ والانتقال للتوزيع"
      : showDistribution
        ? "تأكيد التوزيع وإرسال المهام"
        : "حفظ";

  function handlePrimarySave() {
    if (showEnfathStep) void saveEnfath();
    else if (showBourseStep) void saveBourse();
    else if (showDistribution) confirmDistribution();
  }

  const deedTitle =
    property.deedNumber.trim() ||
    taskDisplayPropertyLabel(task) ||
    `خانة ${task.propertyOrdinal}`;

  const panelDeedBadge =
    property.deedNumber.trim() || `خانة ${task.propertyOrdinal}`;

  const workSubtitle = `أخصائي دراسة الحالة · ${formatPoDisplay(task.poNumber)}`;

  if (loading) {
    return (
      <TaskWorkChrome
        layout={layout}
        title="تنفيذ المهمة"
        onClose={exit}
        onSave={exit}
        saveLabel="رجوع"
        showFooter={false}
      >
        <p className="po-properties-loading">جاري التحميل…</p>
      </TaskWorkChrome>
    );
  }

  if (task.phase === "obstruction") {
    return (
      <TaskWorkChrome
        layout={layout}
        title={`تعذر — ${deedTitle}`}
        subtitle={workSubtitle}
        deedBadge={panelDeedBadge}
        onClose={exit}
        onSave={exit}
        saveLabel="رجوع"
        variant="detail"
        showFooter={false}
      >
      <RegistrationFormCard title="تعذر — بانتظار المشرف">
        <div className="note note-warn" style={{ marginBottom: 12 }}>
          {task.obstructionReason || "تم تسجيل تعذر على هذا العقار."}
        </div>
        {isSupervisor ? (
          <div className="po-edit-foot-actions">
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
      </TaskWorkChrome>
    );
  }

  if (showCaseStudy) {
    return (
      <TaskWorkChrome
        layout={layout}
        title={`دراسة حالة — ${deedTitle}`}
        subtitle={workSubtitle}
        deedBadge={panelDeedBadge}
        onClose={exit}
        onSave={exit}
        saveLabel="رجوع للمهام"
        variant="detail"
        showFooter={false}
      >
        <RegistrationFormCard title="دراسة حالة العقار">
          <div className="note note-success" style={{ marginBottom: 12 }}>
            تم تأكيد التوزيع وإرسال المهام للأطراف. المعاملة في مرحلة دراسة
            الحالة.
          </div>
          <DistributionPartiesForm
            distribution={migrateDistribution(task.distribution)}
            onPatch={() => {}}
            showEngineering={engineeringOfficeAvailable(
              property,
              hasPriorSurvey,
            )}
            engineeringHint={engineeringUnavailableHint()}
            readOnly
          />
        </RegistrationFormCard>
      </TaskWorkChrome>
    );
  }

  if (task.phase === "done" || task.status === "completed") {
    return (
      <TaskWorkChrome
        layout={layout}
        title={`مهمة مكتملة — ${deedTitle}`}
        subtitle={workSubtitle}
        deedBadge={panelDeedBadge}
        onClose={exit}
        onSave={exit}
        saveLabel="رجوع للمهام"
        variant="detail"
        showFooter={false}
      >
        <RegistrationFormCard title="المهمة مكتملة">
          <div className="note note-success">
            اكتملت مهمة العقار. تم إرسال مهام فرعية للأطراف المختارين (إن وُجد).
          </div>
        </RegistrationFormCard>
      </TaskWorkChrome>
    );
  }

  if (!isSpecialist) {
    return (
      <TaskWorkChrome
        layout={layout}
        title={deedTitle}
        subtitle={formatPoDisplay(task.poNumber)}
        deedBadge={panelDeedBadge}
        onClose={exit}
        onSave={exit}
        saveLabel="رجوع"
        variant="detail"
        showFooter={false}
      >
        <p className="field-team-empty">
          هذه المهمة مخصصة لأخصائي دراسة الحالة.
        </p>
      </TaskWorkChrome>
    );
  }

  return (
    <TaskWorkChrome
      layout={layout}
      title={`تعديل عقار — ${deedTitle}`}
      subtitle={workSubtitle}
      deedBadge={panelDeedBadge}
      saving={saving}
      onClose={exit}
      onSave={showPrimarySave ? handlePrimarySave : exit}
      saveLabel={showPrimarySave ? saveLabel : "رجوع للمهام"}
      footerExtra={
        <>
          {task.propertyId && (showBourseStep || showDistribution) ? (
            <Link
              href={poPropertyFailurePath(task.poNumber, task.propertyId)}
              className="btn btn-danger-outline"
            >
              تسجيل تعذر
            </Link>
          ) : null}
        </>
      }
    >
      {formError ? (
        <div className="note note-warn" role="alert" style={{ marginBottom: 12 }}>
          {formError}
        </div>
      ) : null}

      {showEnfathStep ? (
        <RegistrationFormCard
          title={layout === "panel" ? undefined : "بيانات إنفاذ (الصك)"}
          subtitle={
            layout === "panel" ? undefined : "البيانات الواردة من منصة إنفاذ"
          }
        >
          <PoPropertyEnfathForm
            property={property}
            propertyOrdinal={task.propertyOrdinal}
            assignmentType={assignmentType}
            fieldErrors={fieldErrors}
            onPatch={patchProperty}
            poNumber={task.poNumber}
            fieldsMode={
              bourseInquiryFastPath ? "bourse-inquiry-primary" : "all"
            }
            showStageNote={layout !== "panel"}
            hideBoursePathStatus={bourseInquiryPanelOnly}
          />
        </RegistrationFormCard>
      ) : null}

      {showBourseStep ? (
        <RegistrationFormCard
          title="بيانات البورصة"
          subtitle={
            bourseInquiryFastPath
              ? "استعلام البورصة — أكمل المعرف ثم بيانات البورصة"
              : "يمكن تعديلها هنا أو من استعلام البورصة"
          }
        >
          {bourseInquiryFastPath ? (
            <PoPropertyEnfathForm
              property={property}
              propertyOrdinal={task.propertyOrdinal}
              assignmentType={assignmentType}
              fieldErrors={fieldErrors}
              onPatch={patchProperty}
              poNumber={task.poNumber}
              fieldsMode="bourse-inquiry-primary"
            />
          ) : null}
          {bourseInquiryFastPath ? (
            <hr className="my-tasks-bourse-divider" aria-hidden />
          ) : null}
          <PoPropertyBourseForm
            property={property}
            fieldErrors={fieldErrors}
            onPatch={patchProperty}
          />
        </RegistrationFormCard>
      ) : null}

      {showDistribution ? (
        <RegistrationFormCard
          title={layout === "panel" ? undefined : "توزيع المعاملة على الأطراف"}
          subtitle={
            layout === "panel"
              ? undefined
              : "فعّل الطرف ثم اختر المسؤول — يمكن الإسناد لأكثر من طرف معاً"
          }
        >
          <DistributionPartiesForm
            distribution={distribution}
            onPatch={patchDistribution}
            showEngineering={showEngineering}
            engineeringHint={engineeringUnavailableHint()}
          />
        </RegistrationFormCard>
      ) : null}
    </TaskWorkChrome>
  );
}

export function MyTaskWorkView({ taskId }: { taskId: string }) {
  const router = useRouter();
  const task = useWorkflowTask(taskId);
  const [, bump] = useState(0);
  const refresh = useCallback(() => bump((n) => n + 1), []);

  if (!task) {
    return (
      <div className="po-properties-page">
        <div className="note note-warn">
          لم تُعثر على المهمة.
          <div className="po-properties-empty-actions">
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => router.push(myTasksPath())}
            >
              رجوع للمعاملات النشطة
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (task.kind !== "case-study-property") {
    return (
      <PoEditShell
        title={task.title}
        subtitle={`${taskKindLabel(task.kind)} · ${formatPoDisplay(task.poNumber)}`}
        onBack={() => router.push(myTasksPath())}
        onSave={() => {
          if (task.status !== "completed") completeChildTask(task.id);
          router.push(myTasksPath());
        }}
        saveLabel={
          task.status === "completed" ? "رجوع للمهام" : "تأشير كمكتملة"
        }
      >
        <RegistrationFormCard title={task.title}>
          {task.status === "completed" ? (
            <div className="note note-success">تم إنجاز هذه المهمة.</div>
          ) : (
            <p style={{ margin: 0, color: "var(--text2)", fontSize: 13 }}>
              أكمل الإجراء المطلوب ثم احفظ لتأشير المهمة كمكتملة.
            </p>
          )}
        </RegistrationFormCard>
      </PoEditShell>
    );
  }

  return <CaseStudyTaskWork task={task} onRefresh={refresh} />;
}
