"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@platform/design-system";
import { RowMoreMenu } from "@case-study/mfe/components/ui/RowMoreMenu";
import type { RowMoreMenuItem } from "@case-study/mfe/components/ui/RowMoreMenu";
import { PoNumber } from "@case-study/mfe/components/ui/PoNumber";
import {
  assignmentTypeBadgeClass,
  formatDateAr,
  formatPropertyLocation,
  formatPropertyTypeLine,
  hasBourseDetailFields,
  isPastDue,
  requiresAssignmentDecree,
} from "../lib/prototype/po-intake-data";
import {
  poPropertyNewPath,
  poPropertyPath,
  poListPath,
} from "../lib/po-routes";
import { poPropertyToPropertyRow } from "../lib/prototype/po-intake-storage";
import {
  buildPoPropertiesRowMoreItems,
  type PoPropertyRowMoreContext,
} from "../lib/prototype/po-properties-row-menu";
import { formatDeliveryRemainingLabel } from "../lib/prototype/my-task-row";
import { usePoRecordQuery } from "@case-study/mfe/query/case-study-queries";
import {
  canEditProperty,
  canRaisePropertyFailure,
  canViewPoEye,
} from "../lib/prototype/po-roles";
import { usePrototype } from "@platform/app-shared/contexts/PrototypeContext";
import type { PoPropertyIntake } from "../lib/prototype/po-intake-data";

function deedLabel(property: PoPropertyIntake): string {
  return property.deedNumber.trim() || "—";
}

function isDueSoon(iso: string): boolean {
  if (!iso) return false;
  const due = new Date(iso.slice(0, 10));
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

/** DD/MM/YYYY plus HH:mm when present in ISO or a separate time field. */
function formatDateTimeAr(iso: string, separateTime?: string): string {
  if (!iso) return "—";
  const date = formatDateAr(iso);
  const extra = separateTime?.trim();
  if (extra) return `${date} ${extra}`;
  const timeMatch = iso.trim().match(/T(\d{2}:\d{2})/);
  return timeMatch ? `${date} ${timeMatch[1]}` : date;
}

function BackIcon() {
  return (
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
  );
}

export function PoPropertiesPage({
  poNumber,
  buildPropertyRowMoreItems,
}: {
  poNumber: string;
  /** Shell may append role-specific items (e.g. appraiser recall). */
  buildPropertyRowMoreItems?: (
    ctx: PoPropertyRowMoreContext,
  ) => RowMoreMenuItem[];
}) {
  const router = useRouter();
  const { role } = usePrototype();
  const showEdit = canEditProperty(role);
  const showFailureRaise = canRaisePropertyFailure(role);
  const showEye = canViewPoEye(role);
  const showRowMenu =
    showEye || showEdit || showFailureRaise || Boolean(buildPropertyRowMoreItems);
  const [menuRevision, setMenuRevision] = useState(0);
  const bumpMenu = useCallback(() => setMenuRevision((n) => n + 1), []);

  const { data: record, isPending } = usePoRecordQuery(poNumber);

  const resolveRowMoreItems = useCallback(
    (property: PoPropertyIntake): RowMoreMenuItem[] => {
      void menuRevision;
      const ctx: PoPropertyRowMoreContext = {
        poNumber,
        property,
        showEdit,
        showFailureRaise,
        router,
        refresh: bumpMenu,
      };
      const base = buildPoPropertiesRowMoreItems(ctx);
      const extra = buildPropertyRowMoreItems?.(ctx) ?? [];
      const ids = new Set(base.map((i) => i.id));
      const merged = [...base];
      for (const item of extra) {
        if (!ids.has(item.id)) merged.push(item);
      }
      return merged;
    },
    [
      poNumber,
      showEdit,
      showFailureRaise,
      router,
      bumpMenu,
      buildPropertyRowMoreItems,
      menuRevision,
    ],
  );

  if (isPending && !record) {
    return (
      <div className="po-properties-page pd-page">
        <p className="po-properties-loading">جاري التحميل…</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="po-properties-page pd-page">
        <div className="note note-warn">
          لم يُعثر على أمر العمل.
          <div className="po-properties-empty-actions">
            <Link href={poListPath()} className="btn btn-sm">
              رجوع لأوامر العمل
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const showDecree = requiresAssignmentDecree(record.assignmentType);
  const priorByDeed = new Map<string, string>();
  const count = record.properties.length;
  const expected = record.expectedPropertyCount ?? count;
  const dueUrgent = record.dueDateAt
    ? isPastDue(record.dueDateAt) || isDueSoon(record.dueDateAt)
    : false;

  return (
    <div className="po-properties-page pd-page">
      <article className="po-properties-shell">
        <header className="po-properties-hero po-properties-hero--meta">
          <div className="po-properties-hero-top">
            <div className="po-properties-hero-main">
              <Link href={poListPath()} className="po-properties-back">
                <BackIcon />
                <span>أوامر العمل</span>
              </Link>
              <h1 className="po-properties-title">
                <span>عقارات</span>
                <PoNumber value={record.poNumber} className="po-properties-title-num" />
              </h1>
              <div className="po-properties-meta">
                <span
                  className={`badge ${assignmentTypeBadgeClass(record.assignmentType)}`}
                >
                  {record.assignmentType}
                </span>
                <span className="po-properties-meta-sep" aria-hidden>
                  ·
                </span>
                <span className="po-properties-meta-count">
                  {count} من {expected}{" "}
                  {expected === 1 ? "عقار" : "عقارات"}
                </span>
              </div>
            </div>
            {showEdit ? (
              <button
                type="button"
                className="btn btn-sm btn-primary po-properties-add"
                onClick={() => router.push(poPropertyNewPath(poNumber))}
              >
                + إضافة عقار
              </button>
            ) : null}
          </div>

          <div className="pd-meta-strip" aria-label="ملخص أمر العمل">
            <div className="pd-meta-item">
              <div className="pd-meta-label">اسم الأخصائي</div>
              <div className="pd-meta-val">
                {record.assignmentSpecialist.trim() || "—"}
              </div>
            </div>
            <div className="pd-meta-item">
              <div className="pd-meta-label">استلام إنفاذ</div>
              <div className="pd-meta-val">
                {record.receivedFromEnfathAt ? (
                  <bdi dir="ltr" className="po-property-detail-ltr-val">
                    {formatDateTimeAr(
                      record.receivedFromEnfathAt,
                      record.receivedFromEnfathTime,
                    )}
                  </bdi>
                ) : (
                  "—"
                )}
              </div>
            </div>
            <div className="pd-meta-item">
              <div className="pd-meta-label">تاريخ الاستحقاق</div>
              <div
                className={`pd-meta-val${dueUrgent ? " pd-meta-val--urgent" : ""}`}
              >
                {record.dueDateAt ? (
                  <bdi dir="ltr" className="po-property-detail-ltr-val">
                    {formatDateTimeAr(record.dueDateAt)}
                  </bdi>
                ) : (
                  "—"
                )}
              </div>
            </div>
            <div className="pd-meta-item">
              <div className="pd-meta-label">المتبقي للتسليم</div>
              <div
                className={`pd-meta-val${dueUrgent ? " pd-meta-val--urgent" : ""}`}
              >
                {formatDeliveryRemainingLabel(record.dueDateAt)}
              </div>
            </div>
          </div>
        </header>

        {count === 0 ? (
          <div className="po-properties-empty">
            <p>لا توجد عقارات في هذا الأمر.</p>
            {showEdit ? (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => router.push(poPropertyNewPath(poNumber))}
              >
                إضافة أول عقار
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="po-properties-tbl-wrap">
              <table
                className={`tbl po-properties-tbl po-properties-tbl--deed-list${showRowMenu ? " po-properties-tbl--has-view" : ""}`}
              >
                <colgroup>
                  <col className="po-col-deed" />
                  <col className="po-col-location" />
                  <col className="po-col-type" />
                  <col className="po-col-deed-status" />
                  <col className="po-col-status" />
                  {showRowMenu ? <col className="po-col-more" /> : null}
                </colgroup>
                <thead>
                  <tr>
                    <th>رقم الصك</th>
                    <th>الموقع</th>
                    <th>التصنيف / النوع</th>
                    <th>حالة الصك</th>
                    <th>الحالة</th>
                    {showRowMenu ? (
                      <th className="po-properties-th-more" aria-label="المزيد" />
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {record.properties.map((prop, index) => {
                    const row = poPropertyToPropertyRow(
                      record,
                      prop,
                      priorByDeed,
                    );
                    const boursePending = !prop.bourseDataCompleted;
                    const locRaw = formatPropertyLocation(prop);
                    const location =
                      locRaw === "بانتظار البورصة" &&
                      !hasBourseDetailFields(prop)
                        ? "—"
                        : locRaw === "بانتظار البورصة"
                          ? "—"
                          : locRaw;
                    const typeLine = formatPropertyTypeLine(prop);
                    const typeDisplay =
                      boursePending && !hasBourseDetailFields(prop)
                        ? "بانتظار البورصة"
                        : typeLine || "—";
                    const detailHref = poPropertyPath(poNumber, prop.id);
                    const label = deedLabel(prop);

                    return (
                      <tr
                        key={prop.id}
                        className="po-properties-row"
                        onClick={() => router.push(detailHref)}
                      >
                        <td>
                          <span className="po-properties-deed">
                            <span className="po-properties-row-idx" aria-hidden>
                              {index + 1}
                            </span>
                            <span className="id-cell po-num-ltr">{label}</span>
                          </span>
                        </td>
                        <td className="po-properties-cell-muted">{location}</td>
                        <td>{typeDisplay}</td>
                        <td className="po-properties-cell-muted">
                          {prop.deedStatus || "—"}
                        </td>
                        <td>
                          {boursePending ? (
                            <span className="badge b-prog">بانتظار البورصة</span>
                          ) : (
                            <StatusBadge status={row.status} />
                          )}
                        </td>
                        {showRowMenu ? (
                          <td
                            className="po-properties-cell-more"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <RowMoreMenu items={resolveRowMoreItems(prop)} />
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {showDecree ? (
              <p className="po-properties-hint">
                مسار التنفيذ — قرار إسناد مستقل لكل صك.
                {showRowMenu
                  ? " اضغط الصف للتفاصيل أو ⋮ للإجراءات."
                  : " اضغط الصف للتفاصيل."}
              </p>
            ) : (
              <p className="po-properties-hint">
                {showRowMenu
                  ? "اضغط الصف لمعاينة العقار أو ⋮ للإجراءات (تفاصيل · استدعاء المعاملة…)."
                  : "اضغط الصف لمعاينة تفاصيل العقار."}
              </p>
            )}
          </>
        )}
      </article>
    </div>
  );
}
