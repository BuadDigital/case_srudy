"use client";

import type { ReactNode } from "react";

export function FieldBox({
  label,
  value,
  ltr,
  span,
  children,
  emptyLabel = "غير محدد",
  link,
}: {
  label: string;
  value?: string;
  ltr?: boolean;
  span?: 2 | 3 | 4;
  children?: ReactNode;
  emptyLabel?: string;
  link?: boolean;
}) {
  const trimmed = value?.trim() ?? "";
  const isEmpty = !trimmed && !children;

  return (
    <div
      className={`pd-field-box${span ? ` pd-field-box--span-${span}` : ""}`}
    >
      <div className="pd-field-label">{label}</div>
      <div
        className={`pd-field-val${isEmpty ? " pd-field-val--na" : ""}${link ? " pd-field-val--link" : ""}`}
      >
        {children ??
          (isEmpty ? (
            emptyLabel
          ) : ltr ? (
            <bdi dir="ltr" className="po-property-detail-ltr-val">
              {trimmed}
            </bdi>
          ) : (
            trimmed
          ))}
      </div>
    </div>
  );
}

export function FieldsGrid({
  cols = 3,
  children,
}: {
  cols?: 2 | 3 | 4;
  children: ReactNode;
}) {
  return (
    <div className={`pd-fields-grid pd-fields-grid--${cols}`}>{children}</div>
  );
}

export function SectionHeader({
  children,
  icon,
}: {
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <h3 className="pd-section-hd">
      {icon ? <span className="pd-section-hd-icon" aria-hidden>{icon}</span> : null}
      {children}
    </h3>
  );
}

export function SectionDivider() {
  return <hr className="pd-section-divider" />;
}

export function InfoBox({
  variant = "default",
  icon,
  children,
}: {
  variant?: "default" | "teal" | "amber" | "red";
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`pd-info-box pd-info-box--${variant}`}>
      {icon ? (
        <span className="pd-info-box-icon" aria-hidden>
          {icon}
        </span>
      ) : null}
      <span className="pd-info-box-text">{children}</span>
    </div>
  );
}

export function EmptyState({
  title,
  sub,
  icon,
}: {
  title: string;
  sub?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="pd-empty-state">
      {icon ? (
        <span className="pd-empty-state-icon" aria-hidden>
          {icon}
        </span>
      ) : null}
      <div className="pd-empty-state-title">{title}</div>
      {sub ? <div className="pd-empty-state-sub">{sub}</div> : null}
    </div>
  );
}

export function ProgressBar({
  label,
  pct,
  tone = "teal",
}: {
  label: string;
  pct: number;
  tone?: "teal" | "amber" | "red";
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="pd-progress-bar-wrap">
      <div className="pd-progress-row">
        <span className="pd-progress-label">{label}</span>
        <span className="pd-progress-pct">{clamped}%</span>
      </div>
      <div className="pd-progress-track">
        <div
          className={`pd-progress-fill pd-progress-fill--${tone}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export function DocIconButton({
  label,
  danger,
  disabled,
  onClick,
}: {
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={`pd-icon-btn${danger ? " pd-icon-btn--danger" : ""}`}
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {label === "معاينة" ? "👁" : label === "تحميل" ? "⬇" : "🗑"}
    </button>
  );
}

/** @deprecated Use FieldBox inside FieldsGrid */
export function DetailField({
  label,
  value,
  ltr,
}: {
  label: string;
  value: string;
  ltr?: boolean;
}) {
  if (!value || value === "—") return null;
  return <FieldBox label={label} value={value} ltr={ltr} />;
}

/** @deprecated Use SectionHeader + FieldsGrid */
export function DetailSection({
  title,
  children,
  badge,
}: {
  title: string;
  children: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <section className="po-property-detail-section">
      <div className="po-property-detail-section-hd">
        <h2 className="po-property-detail-section-title">{title}</h2>
        {badge}
      </div>
      <div className="po-property-detail-fields">{children}</div>
    </section>
  );
}
