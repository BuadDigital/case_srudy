"use client";

import type { ReactNode } from "react";
import { PO_INTAKE_FLOW } from "@/lib/prototype/po-intake-data";
import { REG_BACK } from "@/components/prototype/registration/registration-labels";
import { UNSAVED_CONFIRM_MSG } from "@/components/prototype/registration/registration-utils";

export function PoEditShell({
  title,
  subtitle,
  isDirty,
  saving,
  onBack,
  onSave,
  saveLabel = "حفظ التعديلات",
  footerExtra,
  variant = "edit",
  children,
}: {
  title: string;
  subtitle?: string;
  isDirty?: boolean;
  saving?: boolean;
  onBack: () => void;
  onSave: () => void;
  saveLabel?: string;
  footerExtra?: ReactNode;
  variant?: "edit" | "detail";
  children: ReactNode;
}) {
  function handleBack() {
    if (isDirty && !window.confirm(UNSAVED_CONFIRM_MSG)) return;
    onBack();
  }

  return (
    <div className={`reg-root ${PO_INTAKE_FLOW.flowClass}`}>
      <div className="reg-layout">
        <div
          className={`reg-main reg-main--detail${variant === "detail" ? " reg-main--detail-view" : ""}`}
        >
          <header className="reg-topbar po-edit-topbar">
            <div className="reg-topbar-main">
              <button type="button" className="btn btn-sm" onClick={handleBack}>
                {REG_BACK}
              </button>
              <div className="po-edit-topbar-titles">
                <h1 className="po-edit-title">{title}</h1>
                {subtitle ? <p className="po-edit-subtitle">{subtitle}</p> : null}
              </div>
            </div>
          </header>
          <div className="po-edit-body">{children}</div>
          {variant !== "detail" ? (
            <footer className="reg-foot po-edit-foot">
              <div className="po-edit-foot-actions">
                {footerExtra}
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={saving}
                  onClick={onSave}
                >
                  {saving ? "جاري الحفظ…" : saveLabel}
                </button>
              </div>
            </footer>
          ) : null}
        </div>
      </div>
    </div>
  );
}
