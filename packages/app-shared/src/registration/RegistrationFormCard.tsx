"use client";

import type { ReactNode } from "react";

export function RegistrationFormCard({
  title,
  subtitle,
  headerRight,
  children,
}: {
  title?: string;
  subtitle?: string;
  headerRight?: ReactNode;
  children: ReactNode;
}) {
  const showHeader = Boolean(title || subtitle || headerRight);
  return (
    <div className="reg-form-card">
      {showHeader ? (
        <div className="reg-form-card-hd">
          <div>
            {title ? <h3>{title}</h3> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {headerRight ? (
            <div className="reg-form-card-hd-right">{headerRight}</div>
          ) : null}
        </div>
      ) : null}
      <div className="reg-form-card-body">{children}</div>
    </div>
  );
}
