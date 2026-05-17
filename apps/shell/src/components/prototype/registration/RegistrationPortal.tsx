"use client";

import {
  PORTAL_CARDS,
  type RegistrationSource,
} from "@/lib/prototype/registration-data";

export function RegistrationPortal({
  onSelect,
  onBack,
}: {
  onSelect: (source: RegistrationSource) => void;
  onBack: () => void;
}) {
  return (
    <div className="reg-portal">
      <div style={{ marginBottom: 12 }}>
        <button type="button" className="btn btn-sm" onClick={onBack}>
          → رجوع للقائمة
        </button>
      </div>
      <div className="reg-portal-head">
        <h2>تسجيل مستخدم جديد</h2>
        <p>اختر الإدارة المسؤولة لبدء تسجيل المستخدم</p>
      </div>
      <div className="reg-portal-grid">
        {PORTAL_CARDS.map((card) => (
          <button
            key={card.source}
            type="button"
            className="reg-portal-card"
            onClick={() => onSelect(card.source)}
          >
            <div className="reg-portal-card-ico">{card.icon}</div>
            <div className="reg-portal-card-dept">{card.dept}</div>
            <div className="reg-portal-card-title">{card.title}</div>
            <div className="reg-portal-card-desc">{card.desc}</div>
            <div className="reg-portal-tags">
              {card.tags.map((t) => (
                <span key={t} className="reg-portal-tag">
                  {t}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

