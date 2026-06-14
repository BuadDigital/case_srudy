"use client";

import { useMemo, useRef, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { PartyCaseStudyFormTab } from "../components/case-study/PartyCaseStudyFormTab";
import {
  GovernmentReviewWorkBody,
  type GovernmentReviewWorkHostRef,
} from "../components/government-review/GovernmentReviewWorkBody";
import { TaskWorkChrome } from "../components/primary-data/TaskWorkChrome";
import {
  ValuationCoordinationWorkBody,
  type ValuationCoordinationWorkHostRef,
} from "../components/valuation-coordination/ValuationCoordinationWorkBody";
import { FieldFormView } from "./FieldFormView";
import { RegistrationFormCard } from "@platform/app-shared/registration/RegistrationFormCard";
import { isGovernmentReviewLocked } from "../lib/prototype/government-review-work-queue";
import { isValuationCoordinationLocked } from "../lib/prototype/valuation-coordination-work-queue";
import type { PartyTaskPageDef } from "@platform/app-shared/prototype/party-task-pages";
import { partyTaskPath } from "../lib/my-task-routes";
import {
  formatPoDisplay,
  formatPropertyDeedDisplay,
} from "../lib/prototype/po-intake-data";
import {
  completeChildTask,
  taskDisplayPropertyLabel,
  type WorkflowTask,
} from "../lib/prototype/tasks-storage";
import type {
  PartyActiveTaskWorkHostRefObject,
} from "../lib/party-active-task-work-host";
import type {
  PartyAppraisalExtensions,
  PartyEvaluatorWorkHostRef,
} from "../lib/party-appraisal-extensions";
import type {
  PartyEngineeringSurveyExtensions,
  PartyEngineeringSurveyWorkHostRef,
} from "../lib/party-engineering-survey-extensions";
import { FailureRaisePanel } from "@failures/mfe";
import { failureRaiserRoleForParty } from "@failures/mfe/lib/failure-party-roles";
import { usePoRecordQuery } from "../query/case-study-queries";

const PARTY_FAILURE_RAISE_KINDS = new Set([
  "field-inspection",
  "property-appraisal",
  "government-review",
  "engineering-survey",
]);

function PartyTaskFailureRaise({
  def,
  task,
  deedNumber,
  onSubmitted,
}: {
  def: PartyTaskPageDef;
  task: WorkflowTask;
  deedNumber: string;
  onSubmitted?: () => void;
}) {
  if (!task.propertyId || !PARTY_FAILURE_RAISE_KINDS.has(task.kind)) {
    return null;
  }
  return (
    <FailureRaisePanel
      poNumber={task.poNumber}
      propertyId={task.propertyId}
      deedNumber={deedNumber}
      specialist={task.assigneeName || def.assigneeSubtitle}
      raisedByRole={failureRaiserRoleForParty(def)}
      onSubmitted={onSubmitted}
    />
  );
}

export function PartyActiveTaskWork({
  def,
  task,
  hostRef,
  layout = "panel",
  appraisalExtensions,
  engineeringSurveyExtensions,
}: {
  def: PartyTaskPageDef;
  task: WorkflowTask;
  hostRef: PartyActiveTaskWorkHostRefObject;
  layout?: "page" | "panel";
  appraisalExtensions?: PartyAppraisalExtensions;
  engineeringSurveyExtensions?: PartyEngineeringSurveyExtensions;
}) {
  const router = useRouter();

  const exit = () => {
    if (hostRef.current?.onClose) {
      hostRef.current.onClose();
      return;
    }
    router.push(partyTaskPath(def.pageId));
  };

  const refresh = () => {
    hostRef.current?.onRefresh?.();
  };

  const { data: record, isPending: recordLoading } = usePoRecordQuery(
    task.poNumber,
  );
  const [saving, setSaving] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [workTab, setWorkTab] = useState<"task" | "case-study">("task");

  const isAppraisal = def.kind === "property-appraisal";
  const isEngineeringSurvey = def.kind === "engineering-survey";
  const isGovernmentReview = def.kind === "government-review";
  const isValuationCoordination = def.kind === "valuation-coordination";
  const usesStructuredWorkForm =
    isGovernmentReview || isValuationCoordination;

  const evaluatorHostRef = useRef<PartyEvaluatorWorkHostRef>({});
  const surveyHostRef = useRef<PartyEngineeringSurveyWorkHostRef>({});
  const governmentHostRef = useRef<GovernmentReviewWorkHostRef>({});
  const coordinationHostRef = useRef<ValuationCoordinationWorkHostRef>({});
  evaluatorHostRef.current.onSubmitted = refresh;
  evaluatorHostRef.current.onSavingChange = setSaving;
  surveyHostRef.current.onSubmitted = refresh;
  surveyHostRef.current.onSavingChange = setSaving;
  governmentHostRef.current.onSubmitted = refresh;
  governmentHostRef.current.onSavingChange = setSaving;
  coordinationHostRef.current.onSubmitted = refresh;
  coordinationHostRef.current.onSavingChange = setSaving;

  const evaluatorLocked = useMemo(() => {
    if (!appraisalExtensions) return false;
    return appraisalExtensions.isEvaluatorLocked(task.id, saving);
  }, [appraisalExtensions, task.id, saving]);

  const surveyLocked = useMemo(() => {
    if (!engineeringSurveyExtensions) return false;
    return engineeringSurveyExtensions.isSurveyLocked(task.id, saving);
  }, [engineeringSurveyExtensions, task.id, saving]);

  const governmentLocked = useMemo(
    () => isGovernmentReviewLocked(task.id),
    [task.id],
  );

  const coordinationLocked = useMemo(
    () => isValuationCoordinationLocked(task.id),
    [task.id],
  );

  const { deedLabel, location } = useMemo(() => {
    const property = record?.properties.find((p) => p.id === task.propertyId);

    if (property) {
      return {
        deedLabel:
          formatPropertyDeedDisplay(property) ||
          `خانة ${task.propertyOrdinal}`,
        location: property.district
          ? `${property.city} · ${property.district}`
          : property.city || "—",
      };
    }

    return {
      deedLabel: taskDisplayPropertyLabel(task),
      location: "—",
    };
  }, [record, task]);

  async function submitStructuredWork(
    locked: boolean,
    hostRef: RefObject<{ submit?: () => Promise<boolean> } | null>,
  ) {
    if (locked) {
      exit();
      return;
    }
    setSaving(true);
    const ok = (await hostRef.current?.submit?.()) ?? false;
    setSaving(false);
    if (ok) {
      setSubmitSuccess(true);
      refresh();
      window.setTimeout(() => exit(), 1800);
    }
  }

  async function submitGovernmentReview() {
    await submitStructuredWork(governmentLocked, governmentHostRef);
  }

  async function submitValuationCoordination() {
    await submitStructuredWork(coordinationLocked, coordinationHostRef);
  }

  async function submitWork() {
    setSaving(true);
    await completeChildTask(task.id);
    setSaving(false);
    refresh();
    exit();
  }

  async function submitAppraisal() {
    if (evaluatorLocked) {
      exit();
      return;
    }
    setSaving(true);
    const ok = (await evaluatorHostRef.current.submit?.()) ?? false;
    setSaving(false);
    if (ok) {
      setSubmitSuccess(true);
      refresh();
      window.setTimeout(() => exit(), 1800);
    }
  }

  async function submitSurvey() {
    if (surveyLocked) {
      exit();
      return;
    }
    setSaving(true);
    const ok = (await surveyHostRef.current.submit?.()) ?? false;
    setSaving(false);
    if (ok) {
      setSubmitSuccess(true);
      refresh();
      window.setTimeout(() => exit(), 1800);
    }
  }

  if (recordLoading && !record) {
    return (
      <TaskWorkChrome
        layout={layout}
        title={def.workTitle}
        onClose={exit}
        onSave={exit}
        saveLabel="رجوع"
        showFooter={false}
      >
        <p className="po-properties-loading">جاري التحميل…</p>
      </TaskWorkChrome>
    );
  }

  if (task.status === "completed") {
    return (
      <TaskWorkChrome
        layout={layout}
        title={`${def.completeTitle} — ${deedLabel}`}
        subtitle={`${def.assigneeSubtitle} · ${formatPoDisplay(task.poNumber)}`}
        deedBadge={deedLabel}
        onClose={exit}
        onSave={exit}
        saveLabel="رجوع"
        variant="detail"
        showFooter={false}
      >
        <RegistrationFormCard title={def.completeTitle}>
          <div className="note note-success">{def.completeMessage}</div>
        </RegistrationFormCard>
      </TaskWorkChrome>
    );
  }

  if (isAppraisal) {
    if (submitSuccess) {
      return (
        <TaskWorkChrome
          layout={layout}
          title={`رفع التقييم — ${deedLabel}`}
          subtitle={`${def.assigneeSubtitle} · ${formatPoDisplay(task.poNumber)} · ${location}`}
          deedBadge={deedLabel}
          onClose={exit}
          onSave={exit}
          saveLabel="رجوع للقائمة"
          showFooter
        >
          <RegistrationFormCard title="تم الإرسال">
            <div className="note note-success">
              تم إرسال التقييم وإجابات الاستدلال لأخصائي دراسة الحالة.
            </div>
          </RegistrationFormCard>
        </TaskWorkChrome>
      );
    }

    return (
      <TaskWorkChrome
        layout={layout}
        title={`رفع التقييم — ${deedLabel}`}
        subtitle={`${def.assigneeSubtitle} · ${formatPoDisplay(task.poNumber)} · ${location}`}
        deedBadge={deedLabel}
        saving={saving}
        onClose={exit}
        onSave={submitAppraisal}
        saveLabel={
          saving
            ? "جاري الإرسال…"
            : evaluatorLocked
              ? "رجوع"
              : "إرسال للأخصائي"
        }
        showFooter
      >
        {appraisalExtensions ? (
          appraisalExtensions.renderAppraisalWork({
            def,
            childTask: task,
            hostRef: evaluatorHostRef,
          })
        ) : (
          <p className="po-properties-loading">جاري تحميل نموذج التقييم…</p>
        )}
        <PartyTaskFailureRaise
          def={def}
          task={task}
          deedNumber={deedLabel}
          onSubmitted={refresh}
        />
      </TaskWorkChrome>
    );
  }

  if (usesStructuredWorkForm) {
    const locked = isGovernmentReview ? governmentLocked : coordinationLocked;
    const onSave = isGovernmentReview
      ? submitGovernmentReview
      : submitValuationCoordination;

    if (submitSuccess) {
      return (
        <TaskWorkChrome
          layout={layout}
          title={`${def.workTitle} — ${deedLabel}`}
          subtitle={`${def.assigneeSubtitle} · ${formatPoDisplay(task.poNumber)} · ${location}`}
          deedBadge={deedLabel}
          onClose={exit}
          onSave={exit}
          saveLabel="رجوع للقائمة"
          showFooter
        >
          <RegistrationFormCard title="تم الإرسال">
            <div className="note note-success">{def.completeMessage}</div>
          </RegistrationFormCard>
        </TaskWorkChrome>
      );
    }

    return (
      <TaskWorkChrome
        layout={layout}
        title={`${def.workTitle} — ${deedLabel}`}
        subtitle={`${def.assigneeSubtitle} · ${formatPoDisplay(task.poNumber)} · ${location}`}
        deedBadge={deedLabel}
        saving={saving}
        onClose={exit}
        onSave={onSave}
        saveLabel={
          saving ? "جاري الإرسال…" : locked ? "رجوع" : def.saveLabel
        }
        showFooter
      >
        <nav className="case-study-tabs party-work-tabs" aria-label="أقسام المهمة">
          <button
            type="button"
            className={`case-study-tab${workTab === "task" ? " active" : ""}`}
            onClick={() => setWorkTab("task")}
          >
            {def.workTitle}
          </button>
          <button
            type="button"
            className={`case-study-tab${workTab === "case-study" ? " active" : ""}`}
            onClick={() => setWorkTab("case-study")}
          >
            نموذج الدراسة
          </button>
        </nav>

        {workTab === "task" ? (
          <>
            <div className="note note-info" style={{ marginBottom: 12 }}>
              {def.workIntro}
            </div>
            {isGovernmentReview ? (
              <GovernmentReviewWorkBody
                def={def}
                task={task}
                hostRef={governmentHostRef}
              />
            ) : (
              <ValuationCoordinationWorkBody
                def={def}
                task={task}
                hostRef={coordinationHostRef}
              />
            )}
            <PartyTaskFailureRaise
              def={def}
              task={task}
              deedNumber={deedLabel}
              onSubmitted={refresh}
            />
          </>
        ) : (
          <PartyCaseStudyFormTab def={def} childTask={task} />
        )}
      </TaskWorkChrome>
    );
  }

  if (isEngineeringSurvey) {
    if (submitSuccess) {
      return (
        <TaskWorkChrome
          layout={layout}
          title={`${def.workTitle} — ${deedLabel}`}
          subtitle={`${def.assigneeSubtitle} · ${formatPoDisplay(task.poNumber)} · ${location}`}
          deedBadge={deedLabel}
          onClose={exit}
          onSave={exit}
          saveLabel="رجوع للقائمة"
          showFooter
        >
          <RegistrationFormCard title="تم الإرسال">
            <div className="note note-success">{def.completeMessage}</div>
          </RegistrationFormCard>
        </TaskWorkChrome>
      );
    }

    return (
      <TaskWorkChrome
        layout={layout}
        title={`${def.workTitle} — ${deedLabel}`}
        subtitle={`${def.assigneeSubtitle} · ${formatPoDisplay(task.poNumber)} · ${location}`}
        deedBadge={deedLabel}
        saving={saving}
        onClose={exit}
        onSave={submitSurvey}
        saveLabel={
          saving
            ? "جاري الإرسال…"
            : surveyLocked
              ? "رجوع"
              : def.saveLabel
        }
        showFooter
      >
        {engineeringSurveyExtensions ? (
          engineeringSurveyExtensions.renderSurveyWork({
            def,
            childTask: task,
            hostRef: surveyHostRef,
          })
        ) : (
          <p className="po-properties-loading">جاري تحميل نموذج الرفع المساحي…</p>
        )}
        <PartyTaskFailureRaise
          def={def}
          task={task}
          deedNumber={deedLabel}
          onSubmitted={refresh}
        />
      </TaskWorkChrome>
    );
  }

  return (
    <TaskWorkChrome
      layout={layout}
      title={`${def.workTitle} — ${deedLabel}`}
      subtitle={`${def.assigneeSubtitle} · ${formatPoDisplay(task.poNumber)} · ${location}`}
      deedBadge={deedLabel}
      saving={saving}
      onClose={exit}
      onSave={submitWork}
      saveLabel={saving ? "جاري الإرسال…" : def.saveLabel}
    >
      <nav className="case-study-tabs party-work-tabs" aria-label="أقسام المهمة">
        <button
          type="button"
          className={`case-study-tab${workTab === "task" ? " active" : ""}`}
          onClick={() => setWorkTab("task")}
        >
          {def.workTitle}
        </button>
        <button
          type="button"
          className={`case-study-tab${workTab === "case-study" ? " active" : ""}`}
          onClick={() => setWorkTab("case-study")}
        >
          نموذج الدراسة
        </button>
      </nav>

      {workTab === "task" ? (
        <>
          <div className="note note-info" style={{ marginBottom: 12 }}>
            {def.workIntro}
          </div>
          {def.useFieldForm ? <FieldFormView embedded /> : null}
          <PartyTaskFailureRaise
            def={def}
            task={task}
            deedNumber={deedLabel}
            onSubmitted={refresh}
          />
        </>
      ) : (
        <PartyCaseStudyFormTab def={def} childTask={task} />
      )}
    </TaskWorkChrome>
  );
}
