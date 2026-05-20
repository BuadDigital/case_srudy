"use client";

import { useRouter } from "next/navigation";
import type { PoIntakeRecord } from "@/lib/prototype/po-intake-data";
import { formatDateAr } from "@/lib/prototype/po-intake-data";
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
    {
      l: "تاريخ الاستلام من إنفاذ",
      v: formatDateAr(record.receivedFromEnfathAt),
    },
    { l: "تاريخ الاستحقاق", v: formatDateAr(record.dueDateAt) },
    { l: "أخصائي الإسناد", v: record.assignmentSpecialist },
    {
      l: "عدد العقارات",
      v: String(record.properties.length),
    },
  ];

  return (
    <div className="po-intake-success-card" role="status" aria-live="polite">
      <div className="po-intake-success-card-head">
        <div className="reg-success-ico" aria-hidden />
        <h2 className="po-intake-success-title">تم استلام أمر العمل بنجاح</h2>
        <p className="po-intake-success-lead">
          سجّل النظام{" "}
          <strong>{record.properties.length}</strong>{" "}
          {record.properties.length === 1 ? "عقاراً" : "عقارات"} تحت{" "}
          <strong dir="ltr">{record.poNumber}</strong>. يمكنك متابعة تسجيل
          العقارات والإسناد من الشاشة التالية.
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
          onClick={() => router.push("/properties")}
        >
          متابعة تسجيل العقارات
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
