"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PoNumber } from "@/components/ui/PoNumber";
import { StatValue } from "@/components/ui/StatValue";
import {
  emptyProperty,
  formatDateAr,
  formatPendingBourseDeedDisplay,
  formatPoDisplay,
  type PoPropertyIntake,
} from "@/lib/prototype/po-intake-data";
import {
  completePropertyBourse,
  findPropertyInRecord,
  loadPendingBourseItems,
} from "@/lib/prototype/po-intake-storage";
import { poPropertiesPath, poPropertyPath } from "@/lib/po-routes";
import { RegistrationFormCard } from "@/components/prototype/registration/RegistrationFormCard";
import {
  hasFieldErrors,
  type FieldErrors,
} from "@/components/prototype/registration/registration-utils";
import { PoPropertyBourseForm } from "@/components/prototype/po-intake/PoPropertyBourseForm";
import {
  firstBourseValidationMessage,
  validatePropertyBourseFields,
} from "@/components/prototype/po-intake/po-property-bourse-validation";
import type { PendingBoursePropertyDto } from "@platform/api-client";

export function BourseInquiryView() {
  const router = useRouter();
  const [items, setItems] = useState<PendingBoursePropertyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PendingBoursePropertyDto | null>(null);
  const [property, setProperty] = useState<PoPropertyIntake>(emptyProperty);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await loadPendingBourseItems();
    setItems(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadPendingBourseItems().then((list) => {
      if (!cancelled) {
        setItems(list);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

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

  async function openItem(item: PendingBoursePropertyDto) {
    setSelected(item);
    setFormError(null);
    setFieldErrors({});
    const hit = await findPropertyInRecord(item.poNumber, item.propertyId);
    if (hit) {
      setProperty({ ...hit.property, id: item.propertyId });
    } else {
      setProperty({
        ...emptyProperty(),
        id: item.propertyId,
        deedNumber: item.deedNumber,
        ownerName: item.ownerName ?? "",
        taskNumber: item.taskNumber ?? "",
      });
    }
  }

  function closeForm() {
    setSelected(null);
    setProperty(emptyProperty());
    setFormError(null);
    setFieldErrors({});
  }

  async function handleSubmit() {
    if (!selected) return;
    const errors = validatePropertyBourseFields(property);
    if (hasFieldErrors(errors)) {
      setFieldErrors(errors);
      setFormError(firstBourseValidationMessage(errors));
      return;
    }

    setSaving(true);
    setFormError(null);
    const result = await completePropertyBourse(
      selected.poNumber,
      selected.propertyId,
      property,
    );
    setSaving(false);

    if (!result.ok) {
      setFormError(result.error);
      if (result.errors) setFieldErrors(result.errors);
      return;
    }

    closeForm();
    await refresh();
  }

  const pendingCount = items.length;
  const showSplit =
    !!selected || (!loading && items.length > 0);
  const layoutClass = showSplit
    ? "po-bourse-inquiry-layout po-bourse-inquiry-layout--split"
    : "po-bourse-inquiry-layout po-bourse-inquiry-layout--solo";

  return (
    <div className="po-bourse-inquiry-page">
      <div className="stat-grid po-bourse-stat-grid">
        <div className="stat-card warn">
          <div className="stat-label">بانتظار البورصة</div>
          <StatValue value={loading ? undefined : pendingCount} />
          <div className="stat-sub">صكوك تحتاج إكمال بيانات البورصة</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">المرحلة</div>
          <div className="po-bourse-stat-phase">استعلام البورصة</div>
          <div className="stat-sub">بعد تسجيل بيانات إنفاذ للعقار</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">الحقول المطلوبة</div>
          <div className="po-bourse-stat-phase">مدينة · تصنيف · حدود</div>
          <div className="stat-sub">من القائمة الهرمية المعتمدة</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">الحالة في القائمة</div>
          <div className="po-bourse-stat-phase">قيد الدراسة</div>
          <div className="stat-sub">حتى إكمال بيانات البورصة</div>
        </div>
      </div>

      <div className="note note-info po-bourse-intro">
        <strong>مسار العمل:</strong> اختر صكاً من قائمة الانتظار، أكمل المدينة
        والتصنيف ونوع العقار وبيانات الحدود من البورصة، ثم احفظ — يُزال الصك
        من القائمة ويُحدَّث في شاشة العقارات.
      </div>

      <div className={layoutClass}>
        <article className="po-properties-shell po-properties-shell--compact po-bourse-queue-box">
          <header className="po-properties-hero po-properties-hero--compact po-bourse-queue-hero">
            <div className="po-properties-hero-main">
              <h2 className="po-properties-title">
                <span>قائمة الانتظار</span>
              </h2>
              <div className="po-properties-meta">
                {!loading && pendingCount > 0 ? (
                  <span className="po-properties-meta-count">
                    {pendingCount}{" "}
                    {pendingCount === 1 ? "صك" : "صكوك"} بانتظار إكمال البورصة
                  </span>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm po-properties-add"
              disabled={loading}
              onClick={() => void refresh()}
            >
              تحديث
            </button>
          </header>

          {loading ? (
            <p className="po-properties-loading">جاري تحميل قائمة الانتظار…</p>
          ) : items.length === 0 ? (
            <div className="po-properties-empty">
              <p>لا توجد صكوك بانتظار البورصة</p>
              <p className="po-properties-hint" style={{ marginTop: 8 }}>
                عند تسجيل عقار جديد من إنفاذ دون إكمال بيانات البورصة، يظهر هنا
                تلقائياً.
              </p>
            </div>
          ) : (
            <>
              <div className="po-properties-tbl-wrap">
                <table className="tbl po-properties-tbl po-properties-tbl--compact po-properties-tbl--bourse-queue">
                  <colgroup>
                    <col className="po-col-deed" />
                    <col className="po-col-location" />
                    <col className="po-col-type" />
                    <col className="po-col-deed-status" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>رقم الصك</th>
                      <th>أمر العمل</th>
                      <th>المالك</th>
                      <th>الاستحقاق</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const active =
                        selected?.poNumber === item.poNumber &&
                        selected?.propertyId === item.propertyId;
                      const deedLabel = formatPendingBourseDeedDisplay(item);

                      return (
                        <tr
                          key={`${item.poNumber}-${item.propertyId}`}
                          className={`po-properties-row${active ? " po-bourse-row-active" : ""}`}
                          onClick={() => void openItem(item)}
                        >
                          <td>
                            <span className="po-properties-deed">
                              <span
                                className="po-properties-row-idx"
                                aria-hidden
                              >
                                {index + 1}
                              </span>
                              <span className="id-cell po-num-ltr">
                                {deedLabel}
                              </span>
                            </span>
                          </td>
                          <td
                            className="po-properties-cell-muted"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <PoNumber value={item.poNumber} link />
                          </td>
                          <td className="po-properties-cell-muted">
                            {item.ownerName || "—"}
                          </td>
                          <td className="po-properties-cell-muted">
                            {formatDateAr(item.dueDateAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="po-properties-hint">
                اضغط الصف لفتح نموذج إكمال البورصة.
              </p>
            </>
          )}
        </article>

        {selected ? (
          <div className="card po-bourse-form-panel">
            <div className="card-header">
              <span className="card-title">
                بيانات البورصة
                <span className="po-bourse-form-deed" dir="ltr">
                  {formatPendingBourseDeedDisplay(selected)}
                </span>
              </span>
              <button type="button" className="btn btn-sm" onClick={closeForm}>
                إغلاق
              </button>
            </div>
            <div className="card-body">
              <div className="po-bourse-form-meta">
                <span>
                  أمر العمل:{" "}
                  <strong dir="ltr">{formatPoDisplay(selected.poNumber)}</strong>
                </span>
                {selected.ownerName ? (
                  <span>
                    المالك: <strong>{selected.ownerName}</strong>
                  </span>
                ) : null}
              </div>

              {formError ? (
                <div className="note note-warn" style={{ marginBottom: 12 }}>
                  {formError}
                </div>
              ) : null}

              <RegistrationFormCard
                title="بيانات البورصة"
                subtitle="المدينة · التصنيف · نوع العقار · الحدود"
              >
                <PoPropertyBourseForm
                  property={property}
                  fieldErrors={fieldErrors}
                  onPatch={patchProperty}
                />
              </RegistrationFormCard>

              <div className="po-bourse-form-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={saving}
                  onClick={() => void handleSubmit()}
                >
                  {saving ? "جاري الحفظ…" : "حفظ وإكمال البورصة"}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    router.push(poPropertiesPath(selected.poNumber))
                  }
                >
                  عرض أمر العمل
                </button>
              </div>
            </div>
          </div>
        ) : items.length > 0 ? (
          <aside className="po-bourse-hint-panel">
            <div className="po-bourse-hint-inner">
              <div className="po-bourse-hint-icon" aria-hidden>
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <h3 className="po-bourse-hint-title">اختر صكاً من القائمة</h3>
              <p className="po-bourse-hint-text">
                يفتح نموذج إكمال بيانات البورصة هنا — المدينة، التصنيف، نوع
                العقار، والحدود.
              </p>
              <ul className="po-bourse-hint-steps">
                <li>1 — اختر صفاً من قائمة الانتظار</li>
                <li>2 — أكمل حقول البورصة</li>
                <li>3 — احفظ لإزالة الصك من القائمة</li>
              </ul>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
