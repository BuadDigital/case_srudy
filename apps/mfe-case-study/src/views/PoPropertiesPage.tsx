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
import { usePoRecordQuery } from "@case-study/mfe/query/case-study-queries";
import { canEditProperty, canViewPoEye } from "../lib/prototype/po-roles";
import { usePrototype } from "@platform/app-shared/contexts/PrototypeContext";
import type { PoPropertyIntake } from "../lib/prototype/po-intake-data";

function deedLabel(property: PoPropertyIntake): string {
  return property.deedNumber.trim() || "—";
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
  const showEye = canViewPoEye(role);
  const showRowMenu = showEye || showEdit || Boolean(buildPropertyRowMoreItems);
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
      router,
      bumpMenu,
      buildPropertyRowMoreItems,
      menuRevision,
    ],
  );

  if (isPending && !record) {
    return (
      <div className="po-properties-page">
        <p className="po-properties-loading">جاري التحميل…</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="po-properties-page">
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

  return (
    <div className="po-properties-page">
      <article className="po-properties-shell">
        <header className="po-properties-hero">
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
                {count} من {record.expectedPropertyCount ?? count}{" "}
                {record.expectedPropertyCount === 1 ? "عقار" : "عقارات"}
              </span>
            </div>
          </div>
          <div className="po-properties-hero-stats" aria-label="ملخص أمر العمل">
            <div className="po-properties-stat">
              <span className="po-properties-stat-lbl">الأخصائي</span>
              <span className="po-properties-stat-val" title={record.assignmentSpecialist}>
                {record.assignmentSpecialist || "—"}
              </span>
            </div>
            <div className="po-properties-stat">
              <span className="po-properties-stat-lbl">تاريخ الاستحقاق</span>
              <span
                className={`po-properties-stat-val po-properties-stat-val--due${record.dueDateAt && isPastDue(record.dueDateAt) ? " po-properties-stat-val--warn" : ""}`}
              >
                {record.dueDateAt ? formatDateAr(record.dueDateAt) : "—"}
              </span>
            </div>
            <div className="po-properties-stat">
              <span className="po-properties-stat-lbl">استلام إنفاذ</span>
              <span className="po-properties-stat-val">
                {record.receivedFromEnfathAt
                  ? formatDateAr(record.receivedFromEnfathAt)
                  : "—"}
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
