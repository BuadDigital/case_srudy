"use client";
import { useEffect, useMemo, useState } from "react";
import {
  BOURSE_INQUIRY_IDENTIFIER_STATUS,
  CLASSIFICATION_OPTIONS,
  isBourseInquiryIdentifier,
  PROPERTY_CLASSIFICATIONS,
  requiresAssignmentDecree,
  showsCourtFields,
  type AssignmentType,
  type PoPropertyIntake,
  type PropertyIdentifierType,
} from "@/lib/prototype/po-intake-data";
import {
  cacheAssignmentDoc,
  cacheDelegationDoc,
} from "@/lib/prototype/assignment-doc-attachments";
import { findPriorDeedFull } from "@/lib/prototype/po-intake-storage";
import { RegField, RegSelect } from "@/components/prototype/registration/FormFields";
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
  /** Hide «حالة المسار / قيد الدراسة» for استعلام بورصة (e.g. primary-data panel). */
  hideBoursePathStatus?: boolean;
  /** When set, only render identifier type selector (for bourse-inquiry fast path). */
  fieldsMode?: "all" | "identifier-only" | "bourse-inquiry-primary";
};

function selectIdentifierType(
  onPatch: Props["onPatch"],
  type: PropertyIdentifierType,
) {
  onPatch("identifierType", type);
  if (type === "bourse_inquiry") {
    onPatch("delegationLetterFileName", "");
  } else if (type === "deed" || type === "real_estate_reg") {
    onPatch("city", "");
  }
}

export function PoPropertyEnfathForm({
  property,
  propertyOrdinal,
  assignmentType,
  fieldErrors,
  onPatch,
  poNumber,
  excludePoNumber,
  showStageNote = true,
  hideBoursePathStatus = false,
  fieldsMode = "all",
}: Props) {
  const attachPo = poNumber?.trim() || excludePoNumber?.trim() || "";
  const [priorPo, setPriorPo] = useState<string | null>(null);
  const showAssignmentDecree = requiresAssignmentDecree(assignmentType);
  const showCourt = showsCourtFields(assignmentType);
  const isBourseId = isBourseInquiryIdentifier(property.identifierType);
  const propertyTypes = useMemo(() => {
    const c = property.classification;
    return c ? (PROPERTY_CLASSIFICATIONS[c] ?? []) : [];
  }, [property.classification]);

  useEffect(() => {
    const deed = property.deedNumber.trim();
    if (!deed) return;
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
    isBourseId,
    property.deedDate,
    property.ownerName,
    property.contacts,
    onPatch,
  ]);

  const priorPoNotice = property.deedNumber.trim() ? priorPo : null;
  const isIdentifierOnly = fieldsMode === "identifier-only";
  const isPrimaryOnly = fieldsMode === "bourse-inquiry-primary";
  const showExtended = fieldsMode === "all" || isPrimaryOnly;
  const showBoursePrimary = isBourseId && showExtended;
  const showDeedFields = !isBourseId && fieldsMode === "all";

  return (
    <>
      {showStageNote ? (
        <div className="note note-info" style={{ marginBottom: 12 }}>
          {isBourseId
            ? "مسار استعلام البورصة — أدخل البيانات الأولية وبيانات البورصة معاً."
            : "بيانات مرحلة إنفاذ — تُكمّل بيانات البورصة (المدينة، التصنيف، الحدود) لاحقاً من «استعلام البورصة»."}
        </div>
      ) : null}

      <div className="reg-fg-full po-data-source-field" style={{ marginBottom: 12 }}>
        <span className="reg-fl po-data-source-label">مصدر البيانات</span>
        <div className="po-id-type-pills">
          <button
            type="button"
            className={`reg-type-pill${property.identifierType === "deed" ? " sel" : ""}`}
            onClick={() => selectIdentifierType(onPatch, "deed")}
          >
            صك ملكية
          </button>
          <button
            type="button"
            className={`reg-type-pill${property.identifierType === "real_estate_reg" ? " sel" : ""}`}
            onClick={() => selectIdentifierType(onPatch, "real_estate_reg")}
          >
            تسجيل عيني
          </button>
          <button
            type="button"
            className={`reg-type-pill${property.identifierType === "bourse_inquiry" ? " sel" : ""}`}
            onClick={() => selectIdentifierType(onPatch, "bourse_inquiry")}
          >
            البورصة العقاريه
          </button>
        </div>
      </div>

      {isBourseId && !hideBoursePathStatus && !showBoursePrimary ? (
        <div className="po-bourse-id-status card" style={{ marginBottom: 14 }}>
          <div className="card-body" style={{ padding: "14px 16px" }}>
            <span className="reg-fl" style={{ display: "block", marginBottom: 8 }}>
              حالة المسار
            </span>
            <span className="badge b-prog" style={{ fontSize: 13 }}>
              {BOURSE_INQUIRY_IDENTIFIER_STATUS}
            </span>
          </div>
        </div>
      ) : property.identifierType === "real_estate_reg" ? (
        <div className="note note-warn" style={{ marginBottom: 12 }}>
          لا يمكن الاستعلام من بورصة العقارات — يطلب الأخصائي السجل العقاري من
          أطراف التنفيذ ويرفعه كمرفق.
        </div>
      ) : null}

      {isIdentifierOnly ? null : (
      <>
      {!isBourseId && priorPoNotice ? (
        <div className="note note-success" style={{ marginBottom: 12 }}>
          هذا الصك مسجّل سابقاً في أمر العمل «{priorPoNotice}» — يمكن استخدام بيانات
          الاتصال السابقة.
        </div>
      ) : null}

      {isBourseId && priorPoNotice ? (
        <div className="note note-success" style={{ marginBottom: 12 }}>
          هذا الصك مسجّل سابقاً في أمر العمل «{priorPoNotice}».
        </div>
      ) : null}

      {showBoursePrimary ? (
        <div className="reg-fg2">
          <RegField
            id="deed_number_bourse"
            label="رقم الصك"
            required
            dir="ltr"
            value={property.deedNumber}
            error={fieldErrors.deedNumber}
            onChange={(v) => onPatch("deedNumber", v)}
          />
          <RegField
            id="task_number_bourse"
            label="رقم المهمة"
            required
            dir="ltr"
            value={property.taskNumber}
            error={fieldErrors.taskNumber}
            onChange={(v) => onPatch("taskNumber", v)}
          />
          <RegField
            id="deed_date_bourse"
            label="تاريخ الصك"
            required
            type="date"
            value={property.deedDate}
            error={fieldErrors.deedDate}
            onChange={(v) => onPatch("deedDate", v)}
          />
          <RegField
            id="owner_name_bourse"
            label="اسم المالك"
            required
            value={property.ownerName}
            error={fieldErrors.ownerName}
            onChange={(v) => onPatch("ownerName", v)}
          />
          <RegField
            id="court_bourse"
            label="المحكمة"
            required
            value={property.court}
            error={fieldErrors.court}
            onChange={(v) => onPatch("court", v)}
          />
          <RegField
            id="circuit_bourse"
            label="الدائرة"
            required
            value={property.circuit}
            error={fieldErrors.circuit}
            onChange={(v) => onPatch("circuit", v)}
          />
        </div>
      ) : showDeedFields ? (
      <div className="reg-fg2">
        <RegField
          id="deed_number"
          label={
            property.identifierType === "real_estate_reg"
              ? "رقم التسجيل العيني"
              : "رقم الصك"
          }
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
      ) : null}

      {!isBourseId && fieldsMode === "all" ? (
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
      ) : null}

      {property.identifierType === "real_estate_reg" && fieldsMode === "all" ? (
        <div className="reg-fg-full" style={{ marginTop: 8 }}>
          <label className="reg-fl" htmlFor={`real_estate_reg_${property.id}`}>
            السجل العقاري (مرفق) *
          </label>
          <input
            id={`real_estate_reg_${property.id}`}
            type="file"
            className="reg-fi"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              const file = e.target.files?.[0];
              onPatch("realEstateRegFileName", file?.name ?? "");
            }}
          />
          {fieldErrors.realEstateRegFileName ? (
            <p className="reg-field-error" role="alert">
              {fieldErrors.realEstateRegFileName}
            </p>
          ) : property.realEstateRegFileName ? (
            <p className="reg-field-hint">{property.realEstateRegFileName}</p>
          ) : null}
        </div>
      ) : null}

      {showAssignmentDecree && showExtended ? (
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

      {fieldsMode === "all" ? (
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
      ) : null}

      {showExtended ? (
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
      ) : null}
      </>
      )}
    </>
  );
}
