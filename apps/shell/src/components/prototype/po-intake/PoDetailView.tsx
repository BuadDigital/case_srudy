"use client";

import {
  formatDateAr,
  requiresAssignmentDecree,
  type PoIntakeRecord,
} from "@/lib/prototype/po-intake-data";
import { RegistrationFormCard } from "@/components/prototype/registration/RegistrationFormCard";
import { SummaryGrid } from "@/components/prototype/registration/SummaryGrid";
import { PoEditShell } from "./PoEditShell";

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
  return (
    <PoEditShell
      title={`أمر العمل — ${record.poNumber}`}
      subtitle="عرض التفاصيل (للقراءة فقط)"
      onBack={onBackAction}
      onSave={onBackAction}
      saveLabel="رجوع للقائمة"
    >
      <RegistrationFormCard
        title="بيانات أمر العمل"
        headerRight={
          showEditHeader && onEditHeaderAction ? (
            <button type="button" className="btn btn-sm" onClick={onEditHeaderAction}>
              تعديل رأس PO
            </button>
          ) : null
        }
      >
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
            { l: "تاريخ الاستحقاق", v: formatDateAr(record.dueDateAt) },
            { l: "أخصائي الإسناد", v: record.assignmentSpecialist },
            { l: "عدد العقارات", v: String(record.properties.length) },
          ]}
        />
        {requiresAssignmentDecree(record.assignmentType) ? (
          <p className="reg-field-hint" style={{ marginTop: 8 }}>
            مسار التنفيذ — يتطلب قرار إسناد لكل عقار.
          </p>
        ) : null}
      </RegistrationFormCard>

      <RegistrationFormCard title={`العقارات (${record.properties.length})`}>
        {record.properties.length === 0 ? (
          <p style={{ color: "var(--text3)", fontSize: 12 }}>
            لا توجد عقارات مسجّلة.
          </p>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>رقم الصك</th>
                <th>المدينة</th>
                <th>النوع</th>
                <th>حالة الصك</th>
                <th>ضباط اتصال</th>
              </tr>
            </thead>
            <tbody>
              {record.properties.map((prop) => (
                <tr key={prop.id}>
                  <td className="id-cell" dir="ltr">
                    {prop.deedNumber || "—"}
                  </td>
                  <td>
                    {prop.city}
                    {prop.district ? ` · ${prop.district}` : ""}
                  </td>
                  <td>{prop.propertyType || prop.classification || "—"}</td>
                  <td>{prop.deedStatus || "—"}</td>
                  <td>
                    {
                      prop.contacts.filter(
                        (c) => c.name.trim() && c.phone.trim(),
                      ).length
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="reg-field-hint" style={{ marginTop: 10 }}>
          لتعديل عقار أو إضافة عقار جديد، استخدم شاشة «العقارات» (أخصائي دراسة
          الحالة).
        </p>
      </RegistrationFormCard>
    </PoEditShell>
  );
}
