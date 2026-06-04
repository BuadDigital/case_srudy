"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CaseStudyForm } from "@/components/prototype/case-study/CaseStudyForm";
import { RegistrationFormCard } from "@/components/prototype/registration/RegistrationFormCard";
import { PoNumber } from "@/components/ui/PoNumber";
import { usePrototype } from "@/contexts/PrototypeContext";
import { activeCaseStudyPath } from "@/lib/my-task-routes";
import {
  buildCaseStudyTracks,
  caseStudyTrackBadgeClass,
  caseStudyTrackBadgeLabel,
  type CaseStudyTrack,
} from "@/lib/prototype/case-study-tracks";
import { findPropertyForTask } from "@/lib/prototype/my-task-row";
import {
  formatDateAr,
  formatPoDisplay,
  formatPropertyDeedDisplay,
  formatPropertyTypeLine,
} from "@/lib/prototype/po-intake-data";
import {
  loadWorkflowTasks,
  tasksForRole,
  type WorkflowTask,
} from "@/lib/prototype/tasks-storage";
import { isSuperAdmin } from "@/lib/prototype/prototype-role-access";
import {
  usePoRecordQuery,
  useWorkflowTasksQuery,
} from "@/lib/query/prototype-queries";

const TABS = [
  { id: "info", label: "معلومات العقار" },
  { id: "parties", label: "الأطراف والحالة" },
  { id: "form", label: "نموذج الدراسة" },
  { id: "docs", label: "المستندات" },
  { id: "log", label: "السجل الزمني" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="cs-info-row">
      <span className="cs-info-label">{label}</span>
      <span className="cs-info-value">{value}</span>
    </div>
  );
}

function TrackRow({ track }: { track: CaseStudyTrack }) {
  const barClass =
    track.state === "done" ? "g" : track.state === "progress" ? "o" : "";
  return (
    <div className="cs-track-row">
      <div className="cs-track-head">
        <span className="cs-track-label">{track.label}</span>
        <span
          className={`badge ${caseStudyTrackBadgeClass(track.state)}`}
        >
          {caseStudyTrackBadgeLabel(track.state)}
        </span>
      </div>
      <div className="prog-wrap" style={{ marginTop: 6 }}>
        <div
          className={`prog-bar ${barClass}`.trim()}
          style={{ width: `${track.progressPct}%` }}
        />
      </div>
      <div className="cs-track-assignee">{track.assigneeName}</div>
    </div>
  );
}

function TabPlaceholder({ title }: { title: string }) {
  return (
    <div className="po-properties-empty active-transactions-soon">
      <p>{title}</p>
      <p className="po-properties-hint" style={{ marginTop: 8 }}>
        هذا القسم قيد التطوير — سيتم تفعيله لاحقاً.
      </p>
    </div>
  );
}

export function CaseStudyWorkspaceView({ taskId }: { taskId: string }) {
  const router = useRouter();
  const { role } = usePrototype();
  const { data: tasks, isLoading: tasksLoading } = useWorkflowTasksQuery();
  const [tab, setTab] = useState<TabId>("info");

  const task = useMemo((): WorkflowTask | null => {
    const list = tasks ?? loadWorkflowTasks();
    return list.find((t) => t.id === taskId) ?? null;
  }, [tasks, taskId]);

  const canAccess = useMemo(() => {
    if (!task) return false;
    if (isSuperAdmin(role)) return true;
    return tasksForRole(role, tasks ?? loadWorkflowTasks()).some(
      (t) => t.id === taskId,
    );
  }, [task, role, tasks, taskId]);

  const { data: record, isPending: recordLoading } = usePoRecordQuery(
    task?.poNumber ?? null,
  );

  const property = useMemo(
    () => (task && record ? findPropertyForTask(record, task) : null),
    [task, record],
  );

  const tracks = useMemo(
    () =>
      task ? buildCaseStudyTracks(task, tasks ?? loadWorkflowTasks()) : [],
    [task, tasks],
  );

  const poLabel = task?.poNumber?.trim()
    ? formatPoDisplay(task.poNumber)
    : "";
  const deedDisplay = property
    ? formatPropertyDeedDisplay(property)
    : "";
  const city = property?.city?.trim() ?? "";
  const district = property?.district?.trim() ?? "";
  const subtitleParts = [poLabel, deedDisplay, city, district].filter(Boolean);
  const subtitle = subtitleParts.join(" • ");

  const loading = tasksLoading || recordLoading;

  if (!loading && (!task || !canAccess)) {
    return (
      <div className="po-properties-page">
        <div className="note note-warn">
          لم تُعثر على معاملة دراسة الحالة أو لا تملك صلاحية عرضها.
          <div className="po-properties-empty-actions">
            <Link href={activeCaseStudyPath()} className="btn btn-sm">
              رجوع لدراسة حالة العقارات
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !task) {
    return (
      <div className="po-properties-page">
        <p className="po-properties-loading">جاري تحميل دراسة الحالة…</p>
      </div>
    );
  }

  return (
    <div className="po-properties-page case-study-workspace">
      <article className="po-properties-shell">
        <header className="po-properties-hero po-properties-hero--compact case-study-workspace-hero">
          <div className="po-properties-hero-main">
            <Link
              href={activeCaseStudyPath()}
              className="po-properties-back"
              onClick={(e) => {
                e.preventDefault();
                router.push(activeCaseStudyPath());
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              دراسة حالة العقارات
            </Link>
            {subtitle ? (
              <p className="po-subpage-sub case-study-workspace-sub">
                {subtitle}
              </p>
            ) : null}
          </div>
        </header>

        <nav className="case-study-tabs" aria-label="أقسام دراسة الحالة">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`case-study-tab${tab === t.id ? " active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="case-study-tab-panel">
          {tab === "info" ? (
            <div className="grid-2 case-study-info-grid">
              <RegistrationFormCard title="بيانات العقار">
                <InfoRow
                  label="أمر العمل"
                  value={
                    task.poNumber.trim() ? (
                      <PoNumber value={task.poNumber} link />
                    ) : (
                      "—"
                    )
                  }
                />
                <InfoRow label="رقم الصك" value={deedDisplay || "—"} />
                <InfoRow label="المدينة" value={city || "—"} />
                <InfoRow label="الحي" value={district || "—"} />
                <InfoRow
                  label="نوع العقار"
                  value={
                    property
                      ? formatPropertyTypeLine(property) ||
                        property.classification ||
                        "—"
                      : "—"
                  }
                />
                <InfoRow
                  label="تاريخ الاستلام"
                  value={
                    record?.receivedFromEnfathAt
                      ? formatDateAr(record.receivedFromEnfathAt)
                      : "—"
                  }
                />
                <InfoRow
                  label="الأخصائي"
                  value={
                    record?.assignmentSpecialist?.trim() ||
                    task.assigneeName ||
                    "—"
                  }
                />
              </RegistrationFormCard>

              <RegistrationFormCard title="حالة المسارات">
                {tracks.map((tr) => (
                  <TrackRow key={tr.id} track={tr} />
                ))}
              </RegistrationFormCard>
            </div>
          ) : null}

          {tab === "parties" ? (
            <TabPlaceholder title="الأطراف والحالة" />
          ) : null}
          {tab === "form" ? (
            <CaseStudyForm
              taskId={taskId}
              task={task}
              property={property}
              poRecord={record ?? undefined}
              requestDateSeed={record?.receivedFromEnfathAt}
            />
          ) : null}
          {tab === "docs" ? <TabPlaceholder title="المستندات" /> : null}
          {tab === "log" ? <TabPlaceholder title="السجل الزمني" /> : null}
        </div>
      </article>
    </div>
  );
}
