import { MOCK_MESSAGES } from "@platform/app-shared/prototype/constants";

export function MessagesView() {
  return (
    <div className="messages-page grid-2">
      <article className="page-shell messages-pane">
        <header className="po-subpage-hd">
          <div className="po-subpage-titles">
            <h2 className="po-subpage-title">الرسائل</h2>
          </div>
          <button type="button" className="btn btn-sm btn-primary">
            + رسالة جديدة
          </button>
        </header>
        <div className="messages-pane__scroll">
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
      </article>
      <article className="page-shell messages-pane">
        <header className="po-subpage-hd">
          <div className="po-subpage-titles">
            <h2 className="po-subpage-title">عبدالله الكثيري</h2>
          </div>
          <span className="badge b-done">متصل</span>
        </header>
        <div className="messages-pane__body">
          اكتمل تقييم E-4401 وتم رفع التقرير.
          <br />
          <span style={{ color: "var(--text3)" }}>هل أبدأ في E-4406؟</span>
        </div>
        <div className="messages-pane__composer">
          <input className="form-control" placeholder="اكتب ردك..." style={{ flex: 1 }} />
          <button type="button" className="btn btn-primary btn-sm">
            إرسال
          </button>
        </div>
      </article>
    </div>
  );
}
