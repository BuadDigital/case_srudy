"use client";

import {
  FLOW_META,
  type RegistrationSource,
} from "@/lib/prototype/registration-data";
import { REG_BACK } from "./registration-labels";

export function RegistrationSidePanel({
  source,
  onBack,
}: {
  source: RegistrationSource;
  onBack: () => void;
}) {
  const meta = FLOW_META[source];
  const icons: Record<RegistrationSource, string> = {
    hr: "HR",
    proc: "PROC",
    crm: "CRM",
  };

  return (
    <aside className={`reg-side reg-side--${source}`} aria-label={meta.dept}>
      <button type="button" className="reg-side-back" onClick={onBack}>
        {REG_BACK}
      </button>
      <div className="reg-side-logo">{icons[source]}</div>
      <div className="reg-side-dept">{meta.dept}</div>
      <h2 className="reg-side-title">{meta.title}</h2>
      <p className="reg-side-desc">{meta.desc}</p>
      <div className="reg-side-users">
        <div className="reg-side-users-label">أنواع المسجّلين</div>
        {meta.sideTypes.map((line) => (
          <div key={line} className="reg-side-user-type">
            {line}
          </div>
        ))}
      </div>
    </aside>
  );
}
