"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PartyCaseStudyFormTab } from "@/components/prototype/case-study/PartyCaseStudyFormTab";
import { FieldFormView } from "@/components/views/FieldFormView";
import { RegistrationFormCard } from "@/components/prototype/registration/RegistrationFormCard";
import { TaskWorkChrome } from "@/components/prototype/primary-data/TaskWorkChrome";
import {
  formatPoDisplay,
  formatPropertyDeedDisplay,
} from "@/lib/prototype/po-intake-data";
import { getPoRecord } from "@/lib/prototype/po-intake-storage";
import type { PartyTaskPageDef } from "@/lib/prototype/party-task-pages";
import { partyTaskPath } from "@/lib/my-task-routes";
import {
  completeChildTask,
  taskDisplayPropertyLabel,
  type WorkflowTask,
} from "@/lib/prototype/tasks-storage";

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
  if (def.kind === "property-appraisal") {
    return (
      <RegistrationFormCard title="تقرير التقييم العقاري">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="appr-value">
              القيمة التقديرية (ريال)
            </label>
            <input id="appr-value" className="form-control" type="number" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="appr-method">
              أسلوب التقييم
            </label>
            <select id="appr-method" className="form-control" defaultValue="سوق">
              {["سوق", "دخل", "تكلفة", "مختلط"].map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="appr-note">
            ملخص التقرير
          </label>
          <textarea id="appr-note" className="form-control" rows={3} />
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

export function PartyActiveTaskWork({
  def,
  task,
  onRefresh,
  layout = "panel",
  onClose,
}: {
  def: PartyTaskPageDef;
  task: WorkflowTask;
  onRefresh: () => void;
  layout?: "page" | "panel";
  onClose?: () => void;
}) {
  const router = useRouter();
  const exit = onClose ?? (() => router.push(partyTaskPath(def.pageId)));
  const [loading, setLoading] = useState(true);
  const [deedLabel, setDeedLabel] = useState(taskDisplayPropertyLabel(task));
  const [location, setLocation] = useState("—");
  const [saving, setSaving] = useState(false);
  const [workTab, setWorkTab] = useState<"task" | "case-study">("task");

  const loadContext = useCallback(async () => {
    setLoading(true);
    const record = await getPoRecord(task.poNumber);
    const property = record?.properties.find((p) => p.id === task.propertyId);
    if (property) {
      setDeedLabel(
        formatPropertyDeedDisplay(property) ||
          `خانة ${task.propertyOrdinal}`,
      );
      setLocation(
        property.district
          ? `${property.city} · ${property.district}`
          : property.city || "—",
      );
    } else {
      setDeedLabel(taskDisplayPropertyLabel(task));
      setLocation("—");
    }
    setLoading(false);
  }, [task.poNumber, task.propertyId, task.propertyOrdinal]);

  useEffect(() => {
    void loadContext();
  }, [loadContext]);

  function submitWork() {
    setSaving(true);
    completeChildTask(task.id);
    setSaving(false);
    onRefresh();
    exit();
  }

  if (loading) {
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
        </>
      ) : (
        <PartyCaseStudyFormTab def={def} childTask={task} />
      )}
    </TaskWorkChrome>
  );
}
