"use client";

import { useRouter } from "next/navigation";
import type { PoIntakeRecord } from "@/lib/prototype/po-intake-data";
import { formatDateAr } from "@/lib/prototype/po-intake-data";
import { poPropertiesPath } from "@/lib/po-routes";
import { SummaryGrid } from "@/components/prototype/registration/SummaryGrid";

export function PoIntakeSuccess({
  record,
  onBackToList,
  onAddAnother,
}: {
  record: PoIntakeRecord;
  onBackToList: () => void;
  onAddAnother: () => void;
}) {
  const router = useRouter();

  const summaryRows = [
    { l: "رقم PO", v: record.poNumber },
    { l: "نوع الإسناد", v: record.assignmentType },
    { l: "تاريخ التعميد", v: formatDateAr(record.promulgationDate) },
    {
      l: "تاريخ الاستلام الفعلي",
      v: formatDateAr(record.receivedFromEnfathAt),
    },
    { l: "تاريخ الاستحقاق", v: formatDateAr(record.dueDateAt) },
    { l: "أخصائي الإسناد", v: record.assignmentSpecialist },
    { l: "إيميل الأخصائي", v: record.assignmentSpecialistEmail },
    {
      l: "عدد العقارات (من إنفاذ)",
      v: String(record.expectedPropertyCount ?? 1),
    },
  ];

  return (
    <div className="po-intake-success-card" role="status" aria-live="polite">
      <div className="po-intake-success-card-head">
        <div className="reg-success-ico" aria-hidden />
        <h2 className="po-intake-success-title">تم استلام أمر العمل بنجاح</h2>
        <p className="po-intake-success-lead">
          سجّل النظام أمر العمل{" "}
          <strong dir="ltr">{record.poNumber}</strong> بدون عقارات. أضف الصكوك
          من قائمة العقارات داخل أمر العمل، ثم أكمل بيانات البورصة من «استعلام
          البورصة».
        </p>
      </div>

      <div className="po-intake-success-details">
        <p className="po-intake-success-details-title">ملخص أمر العمل</p>
        <SummaryGrid rows={summaryRows} />
      </div>

      <div className="po-intake-success-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => router.push(poPropertiesPath(record.poNumber))}
        >
          إضافة العقارات
        </button>
        <button type="button" className="btn" onClick={onBackToList}>
          العودة لقائمة أوامر العمل
        </button>
        <button type="button" className="btn" onClick={onAddAnother}>
          + استلام PO آخر
        </button>
      </div>
    </div>
  );
}
