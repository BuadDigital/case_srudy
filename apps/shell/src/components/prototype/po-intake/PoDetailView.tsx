"use client";

import {
  assignmentTypeBadgeClass,
  formatDateAr,
  isPastDue,
  requiresAssignmentDecree,
  type PoIntakeRecord,
} from "@/lib/prototype/po-intake-data";
import { SummaryGrid } from "@/components/prototype/registration/SummaryGrid";
import { PoEditShell } from "./PoEditShell";
import { PoDetailPropertyCard } from "./PoDetailPropertyCard";

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
                  l: "تاريخ التعميد",
                  v: formatDateAr(record.promulgationDate || record.receivedFromEnfathAt),
                },
                {
                  l: "تاريخ الاستلام الفعلي",
                  v: formatDateAr(record.receivedFromEnfathAt),
                },
                {
                  l: "تاريخ الاستحقاق (4 أيام عمل)",
                  v: formatDateAr(record.dueDateAt),
                },
                { l: "أخصائي الإسناد", v: record.assignmentSpecialist },
                {
                  l: "إيميل الأخصائي",
                  v: record.assignmentSpecialistEmail || "—",
                },
                {
                  l: "عدد العقارات (من إنفاذ)",
                  v: String(record.expectedPropertyCount ?? 1),
                },
                {
                  l: "عقارات مسجّلة",
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
                  assignmentType={record.assignmentType}
                  showDecree={showDecree}
                />
              ))}
            </div>
          )}

          <p className="po-detail-footnote">
            لتعديل عقار أو إضافة عقار جديد، افتح أمر العمل من القائمة واضغط أيقونة
            العين للانتقال إلى صفحة العقارات.
          </p>
        </section>
      </div>
    </PoEditShell>
  );
}
