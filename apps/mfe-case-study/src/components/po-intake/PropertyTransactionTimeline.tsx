"use client";

import { useMemo } from "react";
import {
  buildPropertyDetailTimeline,
  formatTimelineDate,
  type PropertyTimelineTone,
} from "../../lib/prototype/property-detail-timeline";
import { buildPropertyDetailTimelinePartyRows } from "../../lib/prototype/property-detail-parties";
import { formatDateAr } from "../../lib/prototype/po-intake-data";
import type { PoIntakeRecord, PoPropertyIntake } from "../../lib/prototype/po-intake-data";
import { caseStudyTaskForProperty } from "../../lib/prototype/tasks-storage";
import { useWorkflowTasksQuery } from "../../query/case-study-queries";

function toneToDotClass(tone: PropertyTimelineTone): string {
  if (tone === "done") return "pd-tl-dot--teal";
  if (tone === "active") return "pd-tl-dot--amber";
  if (tone === "warn") return "pd-tl-dot--red";
  return "pd-tl-dot--gray";
}

function ClockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function PropertyTransactionTimeline({
  record,
  property,
}: {
  record: PoIntakeRecord;
  property: PoPropertyIntake;
}) {
  const { data: tasks = [] } = useWorkflowTasksQuery();
  const poNumber = record.poNumber.trim();

  const events = useMemo(
    () =>
      buildPropertyDetailTimeline({
        record,
        property,
        tasks,
      }),
    [record, property, tasks],
  );

  const task = useMemo(
    () => caseStudyTaskForProperty(poNumber, property.id, tasks),
    [poNumber, property.id, tasks],
  );

  const partyRows = useMemo(
    () =>
      buildPropertyDetailTimelinePartyRows({
        task: task ?? null,
        allTasks: tasks,
      }),
    [task, tasks],
  );

  const displayEvents = useMemo(() => [...events].reverse(), [events]);

  return (
    <aside className="pd-timeline-panel" aria-label="الجدول الزمني للمعاملة">
      <div className="pd-tl-header">
        <span className="pd-tl-header-title">الجدول الزمني</span>
        <span className="pd-tl-header-icon" aria-hidden>
          <ClockIcon />
        </span>
      </div>

      {displayEvents.length === 0 ? (
        <p className="po-property-detail-empty-contacts">
          لا توجد أحداث مسجّلة بعد.
        </p>
      ) : (
        <div className="pd-tl-list">
          {displayEvents.map((event, index) => (
            <div key={event.id} className="pd-tl-entry">
              <div className="pd-tl-spine">
                <span
                  className={`pd-tl-dot ${toneToDotClass(event.tone)}`}
                  aria-hidden
                />
                {index < displayEvents.length - 1 ? (
                  <span className="pd-tl-line" aria-hidden />
                ) : null}
              </div>
              <div className="pd-tl-body">
                <div className="pd-tl-action">{event.title}</div>
                <div className="pd-tl-when">{formatTimelineDate(event.at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <hr className="pd-tl-divider" />
      <div className="pd-tl-section-label">حالة الأطراف</div>
      {partyRows.map((row) => (
        <div key={row.label} className="pd-party-status-row">
          <span className="pd-party-status-name">{row.label}</span>
          <span className={`pd-badge pd-party-status-badge ${row.badgeClass}`}>
            {row.badge}
          </span>
        </div>
      ))}

      <hr className="pd-tl-divider" />
      <div className="pd-tl-section-label">مواعيد مهمة</div>
      <div className="pd-tl-dates">
        <div className="pd-tl-date-row">
          <span>الاستحقاق</span>
          <span className="pd-tl-date-row--due">
            {record.dueDateAt ? (
              <bdi dir="ltr" className="po-property-detail-ltr-val">
                {formatDateAr(record.dueDateAt)}
              </bdi>
            ) : (
              "—"
            )}
          </span>
        </div>
        <div className="pd-tl-date-row">
          <span>استلام إنفاذ</span>
          <span>
            {record.receivedFromEnfathAt ? (
              <bdi dir="ltr" className="po-property-detail-ltr-val">
                {formatDateAr(record.receivedFromEnfathAt)}
              </bdi>
            ) : (
              "—"
            )}
          </span>
        </div>
      </div>
    </aside>
  );
}
