import { MOCK_MESSAGES } from "@platform/app-shared/prototype/constants";

export function MessagesView() {
  return (
    <div className="grid-2" style={{ height: 440 }}>
      <div className="card" style={{ marginBottom: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div className="card-header">
          <span className="card-title">الرسائل</span>
          <button type="button" className="btn btn-sm btn-primary">
            + رسالة جديدة
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {MOCK_MESSAGES.map((m, i) => (
            <div key={i} className={`msg-item${m.unread ? " unread" : ""}`}>
              {m.unread ? <div className="msg-udot" aria-hidden /> : <div style={{ width: 6, flexShrink: 0 }} />}
              <div className="msg-content">
                <div className="msg-from">
                  {m.from} <span className="msg-dept">({m.dept})</span>
                </div>
                <div className="msg-preview">{m.preview}</div>
              </div>
              <div className="msg-time">{m.time}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{ marginBottom: 0, display: "flex", flexDirection: "column" }}>
        <div className="card-header">
          <span className="card-title">عبدالله الكثيري</span>
          <span className="badge b-done">متصل</span>
        </div>
        <div
          style={{
            flex: 1,
            padding: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text2)",
            fontSize: 12,
            textAlign: "center",
            lineHeight: 1.7,
          }}
        >
          اكتمل تقييم E-4401 وتم رفع التقرير.
          <br />
          <span style={{ color: "var(--text3)" }}>هل أبدأ في E-4406؟</span>
        </div>
        <div style={{ padding: 12, borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
          <input className="form-control" placeholder="اكتب ردك..." style={{ flex: 1 }} />
          <button type="button" className="btn btn-primary btn-sm">
            إرسال
          </button>
        </div>
      </div>
    </div>
  );
}
