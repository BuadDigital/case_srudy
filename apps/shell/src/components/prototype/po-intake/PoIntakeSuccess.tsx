"use client";

import { useRouter } from "next/navigation";
import type { PoIntakeRecord } from "@/lib/prototype/po-intake-data";
import { formatDateAr } from "@/lib/prototype/po-intake-data";

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

  return (
    <div className="reg-success-wrap">
      <div className="reg-success-ico" aria-hidden />
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
        تم استلام أمر العمل بنجاح
      </h2>
      <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>
        سجّل النظام {record.properties.length} عقاراً تحت{" "}
        <strong>{record.poNumber}</strong>. يمكنك متابعة تسجيل العقارات والإسناد
        من الشاشة التالية.
      </p>
      <div className="reg-success-info">
        <div className="reg-si-row">
          رقم PO: <strong>{record.poNumber}</strong>
        </div>
        <div className="reg-si-row">
          نوع الإسناد: <strong>{record.assignmentType}</strong>
        </div>
        <div className="reg-si-row">
          تاريخ الاستلام من إنفاذ:{" "}
          <strong>{formatDateAr(record.receivedFromEnfathAt)}</strong>
        </div>
        <div className="reg-si-row">
          تاريخ الاستحقاق: <strong>{formatDateAr(record.dueDateAt)}</strong>
        </div>
        <div className="reg-si-row">
          أخصائي الإسناد: <strong>{record.assignmentSpecialist}</strong>
        </div>
        <div className="reg-si-row">
          عدد العقارات: <strong>{record.properties.length}</strong>
        </div>
      </div>
      <div className="reg-success-btns">
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
