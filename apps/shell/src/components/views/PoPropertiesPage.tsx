"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@platform/design-system";
import { EyeIconButton } from "@/components/ui/EyeIconButton";
import { PoNumber } from "@/components/ui/PoNumber";
import {
  assignmentTypeBadgeClass,
  formatDateAr,
  isPastDue,
  requiresAssignmentDecree,
} from "@/lib/prototype/po-intake-data";
import { getPropertyFailure } from "@/lib/prototype/failures-storage";
import {
  poPropertyFailurePath,
  poPropertyNewPath,
  poPropertyPath,
  poPropertyEditPath,
  poListPath,
} from "@/lib/po-routes";
import { poPropertyToPropertyRow } from "@/lib/prototype/po-intake-storage";
import { usePoRecordQuery } from "@/lib/query/prototype-queries";
import { canEditProperty } from "@/lib/prototype/po-roles";
import { usePrototype } from "@/contexts/PrototypeContext";
import type { PoPropertyIntake } from "@/lib/prototype/po-intake-data";

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

export function PoPropertiesPage({ poNumber }: { poNumber: string }) {
  const router = useRouter();
  const { role } = usePrototype();
  const showEdit = canEditProperty(role);
  const { data: record, isPending } = usePoRecordQuery(poNumber);

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
              <table className="tbl po-properties-tbl">
                <colgroup>
                  <col className="po-col-deed" />
                  <col className="po-col-location" />
                  <col className="po-col-type" />
                  <col className="po-col-deed-status" />
                  <col className="po-col-status" />
                  <col className="po-col-view" />
                  {showEdit ? <col className="po-col-actions" /> : null}
                </colgroup>
                <thead>
                  <tr>
                    <th>رقم الصك</th>
                    <th>الموقع</th>
                    <th>التصنيف / النوع</th>
                    <th>حالة الصك</th>
                    <th>الحالة</th>
                    <th aria-label="عرض" />
                    {showEdit ? <th aria-label="إجراءات" /> : null}
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
                    const location = boursePending
                      ? "—"
                      : prop.district
                        ? `${prop.city} · ${prop.district}`
                        : prop.city || "—";
                    const typeLabel =
                      prop.propertyType || prop.classification || "—";
                    const typeDisplay = boursePending
                      ? "بانتظار البورصة"
                      : prop.classification
                        ? `${prop.classification} · ${typeLabel}`
                        : typeLabel;
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
                        <td className="po-properties-cell-actions">
                          <EyeIconButton
                            href={detailHref}
                            label={`عرض تفاصيل الصك ${label}`}
                          />
                        </td>
                        {showEdit ? (
                          <td
                            className="po-properties-cell-actions"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="po-properties-row-actions">
                              <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() =>
                                  router.push(
                                    poPropertyEditPath(poNumber, prop.id),
                                  )
                                }
                              >
                                تعديل
                              </button>
                              {!getPropertyFailure(poNumber, prop.id) ? (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger-outline"
                                  onClick={() =>
                                    router.push(
                                      poPropertyFailurePath(
                                        poNumber,
                                        prop.id,
                                      ),
                                    )
                                  }
                                >
                                  تعذر
                                </button>
                              ) : null}
                            </div>
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
                مسار التنفيذ — قرار إسناد مستقل لكل صك. اضغط الصف أو العين
                لمعاينة التفاصيل.
              </p>
            ) : (
              <p className="po-properties-hint">
                اضغط الصف أو العين لمعاينة تفاصيل العقار.
              </p>
            )}
          </>
        )}
      </article>
    </div>
  );
}
