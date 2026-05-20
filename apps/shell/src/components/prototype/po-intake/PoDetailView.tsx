"use client";

import {
  assignmentTypeBadgeClass,
  formatDateAr,
  isPastDue,
  requiresAssignmentDecree,
  type PoIntakeRecord,
  type PoPropertyIntake,
} from "@/lib/prototype/po-intake-data";
import { isValidPhone } from "./po-property-validation";
import { SummaryGrid } from "@/components/prototype/registration/SummaryGrid";
import { PoEditShell } from "./PoEditShell";
import { AssignmentDocAttachment } from "./AssignmentDocAttachment";

export function PoDetailView({
  record,
  onBackAction,
  onEditHeaderAction,
  showEditHeader,
}: {
  record: PoIntakeRecord;
  onBackAction: () => void;
  onEditHeaderAction?: () => void;
  showEditHeader?: boolean;
}) {
  const showDecree = requiresAssignmentDecree(record.assignmentType);
  const pastDue = isPastDue(record.dueDateAt);

  return (
    <PoEditShell
      title={`أمر العمل — ${record.poNumber}`}
      subtitle="عرض التفاصيل (للقراءة فقط)"
      onBack={onBackAction}
      onSave={onBackAction}
      variant="detail"
    >
      <div className="po-detail-page">
        <section className="po-detail-card">
          <div className="po-detail-card-hd">
            <div>
              <h2 className="po-detail-card-title">بيانات أمر العمل</h2>
              <p className="po-detail-card-sub">ملخص التعميد والمواعيد</p>
            </div>
            <div className="po-detail-card-badges">
              <span className="po-detail-po-badge" dir="ltr">
                {record.poNumber}
              </span>
              <span
                className={`badge ${assignmentTypeBadgeClass(record.assignmentType)}`}
              >
                {record.assignmentType}
              </span>
              {showEditHeader && onEditHeaderAction ? (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={onEditHeaderAction}
                >
                  تعديل رأس PO
                </button>
              ) : null}
            </div>
          </div>

          <div className="po-detail-summary-panel">
            <SummaryGrid
              rows={[
                { l: "رقم PO (التعميد)", v: record.poNumber },
                { l: "نوع الإسناد", v: record.assignmentType },
                {
                  l: "تاريخ الاستلام من إنفاذ",
                  v: formatDateAr(record.receivedFromEnfathAt),
                },
                { l: "وقت الاستلام", v: record.receivedFromEnfathTime || "—" },
                {
                  l: "تاريخ التكليف الداخلي",
                  v: formatDateAr(record.internalAssignmentAt),
                },
                {
                  l: "تاريخ الاستحقاق (4 أيام عمل)",
                  v: formatDateAr(record.dueDateAt),
                },
                { l: "أخصائي الإسناد", v: record.assignmentSpecialist },
                {
                  l: "عدد العقارات",
                  v: String(record.properties.length),
                },
              ]}
            />
          </div>

          {pastDue ? (
            <p className="po-detail-alert po-detail-alert--warn" role="status">
              تجاوز تاريخ الاستحقاق — يُنصح بمتابعة العقارات فوراً.
            </p>
          ) : null}

          {showDecree ? (
            <p className="po-detail-note">
              مسار التنفيذ — قرار إسناد مستقل لكل عقار (معاينة المرفق أدناه).
            </p>
          ) : null}
        </section>

        <section className="po-detail-card">
          <div className="po-detail-card-hd">
            <div>
              <h2 className="po-detail-card-title">
                العقارات ({record.properties.length})
              </h2>
              <p className="po-detail-card-sub">
                بيانات الصك وضباط الاتصال لكل عقار
              </p>
            </div>
          </div>

          {record.properties.length === 0 ? (
            <p className="po-detail-empty">لا توجد عقارات مسجّلة.</p>
          ) : (
            <div className="po-detail-property-list">
              {record.properties.map((prop, index) => (
                <PoDetailPropertyCard
                  key={prop.id}
                  index={index + 1}
                  property={prop}
                  poNumber={record.poNumber}
                  showDecree={showDecree}
                />
              ))}
            </div>
          )}

          <p className="po-detail-footnote">
            لتعديل عقار أو إضافة عقار جديد، استخدم شاشة «العقارات».
          </p>
        </section>
      </div>
    </PoEditShell>
  );
}

function PoDetailPropertyCard({
  index,
  property,
  poNumber,
  showDecree,
}: {
  index: number;
  property: PoPropertyIntake;
  poNumber: string;
  showDecree: boolean;
}) {
  const contactCount = property.contacts.filter(
    (c) => c.name.trim() && isValidPhone(c.phone),
  ).length;
  const typeLabel =
    property.propertyType || property.classification || "—";
  const location = [property.city, property.district].filter(Boolean).join(" · ");

  return (
    <article className="po-detail-property-card">
      <header className="po-detail-property-hd">
        <div className="po-detail-property-hd-main">
          <span className="po-detail-property-num">عقار {index}</span>
          <span className="po-detail-property-deed" dir="ltr">
            {property.deedNumber || "—"}
          </span>
        </div>
        {property.deedStatus ? (
          <span className="badge b-prog">{property.deedStatus}</span>
        ) : null}
      </header>

      <div className="po-detail-property-meta">
        <div className="po-detail-meta-item">
          <span className="po-detail-meta-lbl">الموقع</span>
          <span className="po-detail-meta-val">{location || "—"}</span>
        </div>
        <div className="po-detail-meta-item">
          <span className="po-detail-meta-lbl">التصنيف / النوع</span>
          <span className="po-detail-meta-val">
            {property.classification
              ? `${property.classification} · ${typeLabel}`
              : typeLabel}
          </span>
        </div>
        <div className="po-detail-meta-item">
          <span className="po-detail-meta-lbl">ضباط اتصال</span>
          <span className="po-detail-meta-val">
            {contactCount}{" "}
            {contactCount === 1 ? "ضابط" : "ضباط"}
          </span>
        </div>
        {(property.court || property.circuit) && (
          <div className="po-detail-meta-item">
            <span className="po-detail-meta-lbl">المحكمة / الدائرة</span>
            <span className="po-detail-meta-val">
              {[property.court, property.circuit].filter(Boolean).join(" · ")}
            </span>
          </div>
        )}
      </div>

      {showDecree ? (
        <div className="po-detail-property-attach">
          <span className="po-detail-meta-lbl">مرفق قرار الإسناد</span>
          <AssignmentDocAttachment
            poNumber={poNumber}
            propertyId={property.id}
            fileName={property.assignmentDocFileName}
            variant="card"
          />
        </div>
      ) : null}
    </article>
  );
}
