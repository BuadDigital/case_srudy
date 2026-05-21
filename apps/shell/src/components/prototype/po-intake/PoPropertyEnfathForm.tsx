"use client";

import { useEffect, useState } from "react";
import {
  requiresAssignmentDecree,
  showsCourtFields,
  type AssignmentType,
  type PoPropertyIntake,
} from "@/lib/prototype/po-intake-data";
import {
  cacheAssignmentDoc,
  cacheDelegationDoc,
} from "@/lib/prototype/assignment-doc-attachments";
import { findPriorDeedFull } from "@/lib/prototype/po-intake-storage";
import { RegField } from "@/components/prototype/registration/FormFields";
import type { FieldErrors } from "@/components/prototype/registration/registration-utils";
import { AssignmentDocAttachment } from "./AssignmentDocAttachment";
import { PoContactEditor } from "./PoContactEditor";

type Props = {
  property: PoPropertyIntake;
  propertyOrdinal?: number;
  assignmentType: AssignmentType;
  fieldErrors: FieldErrors;
  onPatch: <K extends keyof PoPropertyIntake>(
    key: K,
    value: PoPropertyIntake[K],
  ) => void;
  poNumber?: string;
  excludePoNumber?: string;
  showStageNote?: boolean;
};

export function PoPropertyEnfathForm({
  property,
  propertyOrdinal,
  assignmentType,
  fieldErrors,
  onPatch,
  poNumber,
  excludePoNumber,
  showStageNote = true,
}: Props) {
  const attachPo = poNumber?.trim() || excludePoNumber?.trim() || "";
  const [priorPo, setPriorPo] = useState<string | null>(null);
  const showAssignmentDecree = requiresAssignmentDecree(assignmentType);
  const showCourt = showsCourtFields(assignmentType);

  useEffect(() => {
    const deed = property.deedNumber.trim();
    if (!deed) {
      setPriorPo(null);
      return;
    }
    let cancelled = false;
    void findPriorDeedFull(deed, excludePoNumber).then((hit) => {
      if (cancelled) return;
      setPriorPo(hit?.poNumber ?? null);
      if (hit) {
        if (hit.deedDate && !property.deedDate) onPatch("deedDate", hit.deedDate);
        if (hit.ownerName && !property.ownerName) onPatch("ownerName", hit.ownerName);
        if (hit.contacts?.length && property.contacts.every((c) => !c.phone)) {
          onPatch(
            "contacts",
            hit.contacts.map((c) => ({
              name: c.name ?? "",
              role: c.role ?? "",
              phone: c.phone ?? "",
            })),
          );
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [
    property.deedNumber,
    excludePoNumber,
    property.deedDate,
    property.ownerName,
    property.contacts,
    onPatch,
  ]);

  return (
    <>
      {showStageNote ? (
        <div className="note note-info" style={{ marginBottom: 12 }}>
          بيانات مرحلة إنفاذ — تُكمّل بيانات البورصة (المدينة، التصنيف، الحدود)
          لاحقاً من «استعلام البورصة».
        </div>
      ) : null}

      {priorPo ? (
        <div className="note note-success" style={{ marginBottom: 12 }}>
          هذا الصك مسجّل سابقاً في أمر العمل «{priorPo}» — يمكن استخدام بيانات
          الاتصال السابقة.
        </div>
      ) : null}

      <div className="reg-fg2">
        <RegField
          id="deed_number"
          label="رقم الصك"
          required
          dir="ltr"
          value={property.deedNumber}
          error={fieldErrors.deedNumber}
          onChange={(v) => onPatch("deedNumber", v)}
        />
        <RegField
          id="task_number"
          label="رقم المهمة"
          required
          dir="ltr"
          value={property.taskNumber}
          error={fieldErrors.taskNumber}
          onChange={(v) => onPatch("taskNumber", v)}
        />
        <RegField
          id="deed_date"
          label="تاريخ الصك"
          required
          type="date"
          value={property.deedDate}
          error={fieldErrors.deedDate}
          onChange={(v) => onPatch("deedDate", v)}
        />
        <RegField
          id="owner_name"
          label="اسم المالك"
          required
          value={property.ownerName}
          error={fieldErrors.ownerName}
          onChange={(v) => onPatch("ownerName", v)}
        />
        {showCourt ? (
          <>
            <RegField
              id="court"
              label="المحكمة"
              value={property.court}
              onChange={(v) => onPatch("court", v)}
            />
            <RegField
              id="circuit"
              label="الدائرة"
              value={property.circuit}
              onChange={(v) => onPatch("circuit", v)}
            />
          </>
        ) : null}
      </div>

      <div className="reg-fg-full" style={{ marginTop: 8 }}>
        <label className="reg-fl" htmlFor={`delegation_${property.id}`}>
          خطاب التفويض *
        </label>
        <input
          id={`delegation_${property.id}`}
          type="file"
          className="reg-fi"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => {
            const file = e.target.files?.[0];
            onPatch("delegationLetterFileName", file?.name ?? "");
            if (file && attachPo) {
              void cacheDelegationDoc(attachPo, property.id, file);
            }
          }}
        />
        {fieldErrors.delegationLetterFileName ? (
          <p className="reg-field-error" role="alert">
            {fieldErrors.delegationLetterFileName}
          </p>
        ) : property.delegationLetterFileName ? (
          <p className="reg-field-hint">{property.delegationLetterFileName}</p>
        ) : null}
      </div>

      {showAssignmentDecree ? (
        <div className="reg-fg-full" style={{ marginTop: 8 }}>
          <label className="reg-fl" htmlFor={`assignment_doc_${property.id}`}>
            قرار الإسناد
            {propertyOrdinal ? ` (${propertyOrdinal})` : ""} *
          </label>
          <input
            id={`assignment_doc_${property.id}`}
            type="file"
            className="reg-fi"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              const file = e.target.files?.[0];
              onPatch("assignmentDocFileName", file?.name ?? "");
              if (file && attachPo) {
                void cacheAssignmentDoc(attachPo, property.id, file);
              }
            }}
          />
          {property.assignmentDocFileName && attachPo ? (
            <AssignmentDocAttachment
              poNumber={attachPo}
              propertyId={property.id}
              fileName={property.assignmentDocFileName}
              variant="inline"
            />
          ) : fieldErrors.assignmentDocFileName ? (
            <p className="reg-field-error" role="alert">
              {fieldErrors.assignmentDocFileName}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="reg-fg-full" style={{ marginTop: 8 }}>
        <label className="reg-fl" htmlFor={`other_docs_${property.id}`}>
          مستندات أخرى (اختياري)
        </label>
        <input
          id={`other_docs_${property.id}`}
          type="file"
          className="reg-fi"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          onChange={(e) => {
            const names = Array.from(e.target.files ?? []).map((f) => f.name);
            onPatch("otherDocumentFileNames", names);
          }}
        />
        {property.otherDocumentFileNames.length > 0 ? (
          <p className="reg-field-hint">
            {property.otherDocumentFileNames.join("، ")}
          </p>
        ) : null}
      </div>

      <div style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
          ضباط الاتصال
        </h3>
        {fieldErrors._contacts ? (
          <div className="note note-warn" style={{ marginBottom: 12 }}>
            {fieldErrors._contacts}
          </div>
        ) : null}
        <PoContactEditor
          contacts={property.contacts}
          errors={fieldErrors}
          onChange={(contacts) => onPatch("contacts", contacts)}
        />
      </div>
    </>
  );
}
