"use client";
import { useState } from "react";
import { createFailure } from "../../lib/prototype/failures-storage";

/** Property failure report form (PO property route). */
export function FailureReportForm({
  poNumber,
  propertyId,
  deedNumber,
  specialist,
  onDone,
  onCancel,
}: {
  poNumber: string;
  propertyId: string;
  deedNumber: string;
  specialist: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");

  function handleSubmit() {
    if (!title.trim() || !note.trim()) return;
    createFailure({
      poNumber,
      propertyId,
      deedNumber,
      title,
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
        <div className="reg-fg-full" style={{ marginBottom: 10 }}>
          <label className="reg-fl" htmlFor="fail_title">
            عنوان التعذر *
          </label>
          <input
            id="fail_title"
            className="reg-fi"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="reg-fg-full" style={{ marginBottom: 12 }}>
          <label className="reg-fl" htmlFor="fail_note">
            وصف داخلي *
          </label>
          <textarea
            id="fail_note"
            className="form-control"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ width: "100%", fontSize: 12 }}
          />
        </div>
        <p className="reg-field-hint" style={{ marginBottom: 12 }}>
          يُضبط حالة الصك إلى «قيد التحقق» حتى يعتمد المشرف التعذر.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleSubmit}>
            حفظ مسودة داخلية
          </button>
          <button type="button" className="btn btn-sm" onClick={onCancel}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
