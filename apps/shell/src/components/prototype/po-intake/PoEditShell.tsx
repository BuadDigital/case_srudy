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
  children: ReactNode;
}) {
  function handleBack() {
    if (isDirty && !window.confirm(UNSAVED_CONFIRM_MSG)) return;
    onBack();
  }

  return (
    <div className={`reg-root ${PO_INTAKE_FLOW.flowClass}`}>
      <div className="reg-layout">
        <div className="reg-main">
          <header className="reg-topbar">
            <div className="reg-topbar-main">
              <button type="button" className="btn btn-sm" onClick={handleBack}>
                {REG_BACK}
              </button>
              <div>
                <h1 className="reg-title">{title}</h1>
                {subtitle ? (
                  <p className="reg-subtitle">{subtitle}</p>
                ) : null}
              </div>
            </div>
          </header>
          {children}
          <div
            className="reg-footer"
            style={{
              marginTop: 16,
              justifyContent: footerExtra ? "space-between" : "flex-end",
            }}
          >
            {footerExtra ?? <span />}
            <button
              type="button"
              className="btn btn-primary"
              disabled={saving}
              onClick={onSave}
            >
              {saving ? "جاري الحفظ…" : saveLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
