"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PartyCaseStudyFormTab } from "../components/case-study/PartyCaseStudyFormTab";
import { TaskWorkChrome } from "../components/primary-data/TaskWorkChrome";
import { FieldFormView } from "./FieldFormView";
import { RegistrationFormCard } from "@platform/app-shared/registration/RegistrationFormCard";
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
import { FailureRaisePanel } from "@failures/mfe";
import { failureRaiserRoleForParty } from "@failures/mfe/lib/failure-party-roles";
import { usePoRecordQuery } from "../query/case-study-queries";

function GenericPartyWorkBody({ def }: { def: PartyTaskPageDef }) {
  if (def.kind === "government-review") {
    return (
      <RegistrationFormCard title="زيارة المحكمة وجمع المفاتيح">
        <div className="form-group">
          <span className="form-label">حالة الزيارة</span>
          <div className="radio-group">
            {["تمت الزيارة", "بانتظار الموعد", "تعذر الوصول"].map((o) => (
              <label key={o} className="radio-opt">
                <input type="radio" name="gov-visit" /> {o}
              </label>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="gov-keys">
            المفاتيح المستلمة
          </label>
          <textarea
            id="gov-keys"
            className="form-control"
            rows={2}
            placeholder="وصف المفاتيح أو سبب التعذر…"
          />
        </div>
      </RegistrationFormCard>
    );
  }

  if (def.kind === "valuation-coordination") {
    return (
      <RegistrationFormCard title="استلام في قسم التقييم">
        <div className="form-group">
          <label className="form-label" htmlFor="vc-note">
            ملاحظات الاستلام
          </label>
          <textarea
            id="vc-note"
            className="form-control"
            rows={3}
            placeholder="تأكيد استلام المعاملة وتوزيعها على المعاين والمقيم…"
          />
        </div>
      </RegistrationFormCard>
    );
  }

  if (def.kind === "engineering-survey") {
    return (
      <RegistrationFormCard title="تقرير الرفع المساحي">
        <div className="form-group">
          <label className="form-label" htmlFor="survey-ref">
            رقم التقرير / المرجع
          </label>
          <input id="survey-ref" className="form-control" placeholder="CAD-…" />
        </div>
        <div className="form-group">
          <span className="form-label">مرفقات الرفع</span>
          <div className="photo-grid">
            {["مخطط", "صور", "+"].map((l) => (
              <button key={l} type="button" className="photo-ph">
                📎<span>{l}</span>
              </button>
            ))}
          </div>
        </div>
      </RegistrationFormCard>
    );
  }
  return null;
}

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
}: {
  def: PartyTaskPageDef;
  task: WorkflowTask;
  hostRef: PartyActiveTaskWorkHostRefObject;
  layout?: "page" | "panel";
  appraisalExtensions?: PartyAppraisalExtensions;
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
  const evaluatorHostRef = useRef<PartyEvaluatorWorkHostRef>({});
  evaluatorHostRef.current.onSubmitted = refresh;
  evaluatorHostRef.current.onSavingChange = setSaving;

  const isAppraisal = def.kind === "property-appraisal";

  const evaluatorLocked = useMemo(() => {
    if (!appraisalExtensions) return false;
    return appraisalExtensions.isEvaluatorLocked(task.id, saving);
  }, [appraisalExtensions, task.id, saving]);

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
          {def.useFieldForm ? (
            <FieldFormView embedded />
          ) : (
            <GenericPartyWorkBody def={def} />
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
