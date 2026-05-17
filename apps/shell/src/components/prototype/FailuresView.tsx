"use client";

import { usePrototype } from "@/contexts/PrototypeContext";
import { StatusBadge } from "@platform/design-system";
import { MOCK_FAILURES, type RoleId } from "@/lib/prototype/constants";

function isCaseEditor(role: RoleId) {
  return role === "case-specialist" || role === "report-preparer";
}

function isSupervisor(role: RoleId) {
  return role === "section-supervisor";
}

export function FailuresView() {
  const { role } = usePrototype();
  const ce = isCaseEditor(role);
  const ca = isSupervisor(role);
  const fl = MOCK_FAILURES;

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card red">
          <div className="stat-label">تعذرات مفتوحة</div>
          <div className="stat-value">{fl.length}</div>
        </div>
        <div className="stat-card warn">
          <div className="stat-label">قيد المراجعة</div>
          <div className="stat-value">1</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">معتمدة هذا الأسبوع</div>
          <div className="stat-value">3</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">متوسط وقت الحل</div>
          <div className="stat-value">2.6 يوم</div>
        </div>
      </div>
      {!ce && !ca ? (
        <div className="note note-info">
          {role === "general-manager"
            ? "أنت في وضع الاطلاع — صلاحية التعديل للمشرف فقط"
            : "أنت في وضع المراقبة — لا تملك صلاحية تعديل التعذرات"}
        </div>
      ) : null}
      {ca ? (
        <div className="note note-success">
          صلاحية الاعتماد: يمكنك اعتماد التعذرات أو إعادتها للأخصائي
        </div>
      ) : null}
      {fl.map((f) => (
        <div key={f.id} className="fail-card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              {f.id} — {f.title}{" "}
              <span style={{ fontSize: 11, color: "var(--text3)" }}>{f.po}</span>
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <StatusBadge status={f.status} />
              <span style={{ fontSize: 11, color: "var(--text3)" }}>{f.date}</span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>{f.body}</div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 5 }}>
            الأخصائي: {f.specialist}
          </div>
          {ce ? (
            <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
              <button type="button" className="btn btn-sm btn-primary">
                تحديث
              </button>
              <button type="button" className="btn btn-sm">
                إرسال للمراجعة
              </button>
            </div>
          ) : null}
          {ca && f.status === "review" ? (
            <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
              <button type="button" className="btn btn-sm btn-success">
                اعتماد
              </button>
              <button type="button" className="btn btn-sm btn-danger">
                إعادة
              </button>
            </div>
          ) : null}
        </div>
      ))}
    </>
  );
}
