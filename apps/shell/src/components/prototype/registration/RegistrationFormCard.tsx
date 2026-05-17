"use client";

import type { ReactNode } from "react";

export function RegistrationFormCard({
  title,
  subtitle,
  headerRight,
  children,
}: {
  title: string;
  subtitle?: string;
  headerRight?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="reg-form-card">
      <div className="reg-form-card-hd">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {headerRight ? (
          <div className="reg-form-card-hd-right">{headerRight}</div>
        ) : null}
      </div>
      <div className="reg-form-card-body">{children}</div>
    </div>
  );
}
