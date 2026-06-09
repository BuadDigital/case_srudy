"use client";

import {
  PORTAL_CARDS,
  type RegistrationSource,
} from "../prototype/registration-data";

export function RegistrationPortal({
  onSelect,
  onBack,
}: {
  onSelect: (source: RegistrationSource) => void;
  onBack: () => void;
}) {
  return (
    <div className="card reg-portal-wrap">
      <div className="card-header">
        <span className="card-title">تسجيل المستخدمين</span>
        <button type="button" className="btn btn-sm" onClick={onBack}>
          رجوع للقائمة
        </button>
      </div>
      <div className="card-body reg-portal">
        <div className="reg-portal-head">
          <h2>اختر الإدارة المسؤولة</h2>
          <p>ابدأ تسجيل المستخدم من الإدارة المناسبة حسب نوع الحساب المطلوب</p>
        </div>

        <div className="reg-portal-grid">
          {PORTAL_CARDS.map((card) => (
            <button
              key={card.source}
              type="button"
              className={`reg-portal-card reg-portal-card--${card.source}`}
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
    </div>
  );
}
