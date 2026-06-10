"use client";

import { useState } from "react";
import { createFailure } from "../../lib/failures-repository";
import type { FailureSeverity } from "../../lib/failures-types";
import { FailureRaiseFields } from "./FailureRaiseFields";

/** Property failure report form (PO property route). */
export function FailureReportForm({
  poNumber,
  propertyId,
  deedNumber,
  specialist,
  raisedByRole = "الأخصائي",
  onDone,
  onCancel,
}: {
  poNumber: string;
  propertyId: string;
  deedNumber: string;
  specialist: string;
  raisedByRole?: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [severity, setSeverity] = useState<FailureSeverity>("internal");
  const [problemTypeId, setProblemTypeId] = useState("");
  const [note, setNote] = useState("");

  function handleSubmit() {
    if (!problemTypeId) return;
    createFailure({
      poNumber,
      propertyId,
      deedNumber,
      problemTypeId,
      severity,
      raisedByRole,
      internalNote: note,
      specialist,
    });
    onDone();
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-header">
        <span className="card-title">تسجيل تعذر — {deedNumber || poNumber}</span>
      </div>
      <div style={{ padding: 16 }}>
        <FailureRaiseFields
          severity={severity}
          onSeverityChange={setSeverity}
          problemTypeId={problemTypeId}
          onProblemTypeIdChange={setProblemTypeId}
          note={note}
          onNoteChange={setNote}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!problemTypeId}
            onClick={handleSubmit}
          >
            {severity === "internal" ? "حفظ تعذر داخلي" : "تسجيل احتمال تعذر"}
          </button>
          <button type="button" className="btn btn-sm" onClick={onCancel}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
