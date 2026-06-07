"use client";

import { AppModal } from "@/components/ui/AppModal";
import { RegField, RegSelect } from "@/components/prototype/registration/FormFields";
import { RegistrationFormCard } from "@/components/prototype/registration/RegistrationFormCard";
import { UNSAVED_CONFIRM_MSG } from "@/components/prototype/registration/registration-utils";
import {
  ASSIGNMENT_TYPE_OPTIONS,
  type AssignmentType,
  type PoIntakeRecord,
} from "@/lib/prototype/po-intake-data";
import { usePoIntakeForm } from "@/components/prototype/po-intake/usePoIntakeForm";

export function PoIntakeModal({
  open,
  onClose,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  onComplete: (record: PoIntakeRecord) => void;
}) {
  const form = usePoIntakeForm(onComplete);

  function requestClose() {
    if (form.isDirty && !window.confirm(UNSAVED_CONFIRM_MSG)) return;
    onClose();
  }

  return (
    <AppModal
      open={open}
      title="تسجيل أمر عمل (PO) جديد"
      wide
      onClose={requestClose}
      footer={
        <>
          <button type="button" className="btn" onClick={requestClose}>
            إلغاء
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={form.saving}
            onClick={() => void form.save()}
          >
            {form.saving ? "جارٍ الحفظ..." : "حفظ أمر العمل"}
          </button>
        </>
      }
    >
      {form.formError ? (
        <div className="note note-warn" style={{ marginBottom: 12 }}>
          {form.formError}
        </div>
      ) : null}

      <RegistrationFormCard>
        <div className="reg-fg2">
          <RegField
            id="po_number_modal"
            label="رقم التعميد (PO)"
            required
            dir="ltr"
            value={form.poNumber}
            error={form.fieldErrors.poNumber}
            placeholder="مثال: PO-2025-001"
            onChange={form.setPoNumber}
          />
          <RegField
            id="promulgation_date_modal"
            label="تاريخ التعميد"
            required
            type="date"
            value={form.promulgationDate}
            error={form.fieldErrors.promulgationDate}
            onChange={form.setPromulgationDate}
          />
          <RegField
            id="po_specialist_modal"
            label="اسم أخصائي الإسناد"
            required
            value={form.assignmentSpecialist}
            error={form.fieldErrors.assignmentSpecialist}
            onChange={form.setAssignmentSpecialist}
          />
          <RegField
            id="po_specialist_email_modal"
            label="إيميل أخصائي الإسناد"
            required
            type="email"
            dir="ltr"
            value={form.assignmentSpecialistEmail}
            error={form.fieldErrors.assignmentSpecialistEmail}
            onChange={form.setAssignmentSpecialistEmail}
          />
          <RegSelect
            id="assignment_type_modal"
            label="نوع الإسناد"
            required
            options={[...ASSIGNMENT_TYPE_OPTIONS]}
            value={form.assignmentType}
            error={form.fieldErrors.assignmentType}
            onChange={(v) => form.setAssignmentType(v as AssignmentType)}
          />
          <RegField
            id="expected_property_count_modal"
            label="عدد العقارات"
            required
            type="number"
            dir="ltr"
            value={form.expectedPropertyCount}
            error={form.fieldErrors.expectedPropertyCount}
            placeholder="1"
            onChange={(v) => {
              const digits = v.replace(/\D/g, "").slice(0, 3);
              form.setExpectedPropertyCount(digits || "");
            }}
          />
        </div>
      </RegistrationFormCard>
    </AppModal>
  );
}
