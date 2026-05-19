"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePrototype } from "@/contexts/PrototypeContext";
import { ROLES } from "@/lib/prototype/constants";
import {
  approveFailure,
  createFailure,
  failureStatusLabel,
  loadFailures,
  returnFailure,
  submitFailureForReview,
  type FailureRecord,
} from "@/lib/prototype/failures-storage";
import { formatDateAr } from "@/lib/prototype/po-intake-data";

function isCaseEditor(role: string) {
  return role === "case-specialist" || role === "report-preparer";
}

function isSupervisor(role: string) {
  return role === "section-supervisor";
}

export function FailuresView() {
  const { role } = usePrototype();
  const ce = isCaseEditor(role);
  const ca = isSupervisor(role);
  const specialistName = ROLES[role as keyof typeof ROLES]?.name ?? "أخصائي";

  const [items, setItems] = useState<FailureRecord[]>([]);
  const [supervisorNote, setSupervisorNote] = useState<Record<string, string>>({});

  const refresh = useCallback(() => {
    setItems(loadFailures());
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "evalFailureRecords") refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const stats = useMemo(() => {
    const open = items.filter(
      (f) => f.status === "internal" || f.status === "review",
    ).length;
    const review = items.filter((f) => f.status === "review").length;
    const approved = items.filter((f) => f.status === "approved").length;
    return { open, review, approved };
  }, [items]);

  function handleSubmit(id: string) {
    submitFailureForReview(id);
    refresh();
  }

  function handleApprove(id: string) {
    approveFailure(id, supervisorNote[id] ?? "");
    refresh();
  }

  function handleReturn(id: string) {
    returnFailure(id, supervisorNote[id] ?? "");
    refresh();
  }

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card red">
          <div className="stat-label">تعذرات مفتوحة</div>
          <div className="stat-value">{stats.open}</div>
        </div>
        <div className="stat-card warn">
          <div className="stat-label">قيد المراجعة</div>
          <div className="stat-value">{stats.review}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">معتمدة</div>
          <div className="stat-value">{stats.approved}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">الإجمالي</div>
          <div className="stat-value">{items.length}</div>
        </div>
      </div>

      {!ce && !ca ? (
        <div className="note note-info">
          {role === "general-manager"
            ? "أنت في وضع الاطلاع — صلاحية التعديل للمشرف والأخصائي"
            : "أنت في وضع المراقبة — لا تملك صلاحية تعديل التعذرات"}
        </div>
      ) : null}
      {ca ? (
        <div className="note note-success" style={{ marginBottom: 12 }}>
          مسار التعذر: مسودة داخلية (أخصائي) → مراجعة → اعتماد نهائي أو إعادة —
          يُحدَّث حالة الصك تلقائياً (قيد التحقق / موقوف).
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--text3)" }}>
          لا توجد تعذرات — سجّل تعذراً من شاشة العقارات.
        </div>
      ) : (
        items.map((f) => (
          <div key={f.id} className="fail-card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 6,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                {f.deedNumber || f.title}{" "}
                <span style={{ fontSize: 11, color: "var(--text3)" }}>
                  · PO {f.poNumber}
                </span>
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="badge b-cancel">{failureStatusLabel(f.status)}</span>
                <span style={{ fontSize: 11, color: "var(--text3)" }}>
                  {formatDateAr(f.updatedAt.slice(0, 10))}
                </span>
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{f.title}</div>
            <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>
              <strong>داخلي:</strong> {f.internalNote || "—"}
            </div>
            {f.finalNote ? (
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>
                <strong>قرار المشرف:</strong> {f.finalNote}
              </div>
            ) : null}
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 5 }}>
              الأخصائي: {f.specialist}
            </div>

            {ce && f.status === "internal" ? (
              <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => handleSubmit(f.id)}
                >
                  إرسال للمراجعة
                </button>
              </div>
            ) : null}

            {ca && f.status === "review" ? (
              <div style={{ marginTop: 10 }}>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="ملاحظة الاعتماد أو الإعادة"
                  value={supervisorNote[f.id] ?? ""}
                  onChange={(e) =>
                    setSupervisorNote((n) => ({ ...n, [f.id]: e.target.value }))
                  }
                  style={{ width: "100%", marginBottom: 8, fontSize: 12 }}
                />
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-success"
                    onClick={() => handleApprove(f.id)}
                  >
                    اعتماد نهائي
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => handleReturn(f.id)}
                  >
                    إعادة للأخصائي
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ))
      )}
    </>
  );
}

/** يُستدعى من شاشة العقارات لتسجيل تعذر جديد */
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
