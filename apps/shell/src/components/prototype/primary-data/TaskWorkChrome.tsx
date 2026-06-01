"use client";

import type { ReactNode } from "react";
import { PoEditShell } from "@/components/prototype/po-intake/PoEditShell";

export function TaskWorkChrome({
  layout = "page",
  title,
  subtitle,
  deedBadge,
  onClose,
  saving = false,
  saveLabel = "حفظ",
  onSave,
  showFooter = true,
  variant = "edit",
  footerExtra,
  children,
}: {
  layout?: "page" | "panel";
  title: string;
  subtitle?: string;
  deedBadge?: string;
  onClose: () => void;
  saving?: boolean;
  saveLabel?: string;
  onSave: () => void;
  showFooter?: boolean;
  variant?: "edit" | "detail";
  footerExtra?: ReactNode;
  children: ReactNode;
}) {
  if (layout === "panel") {
    return (
      <div className="card po-bourse-form-panel po-primary-data-form-panel">
        <div className="card-body">
          {children}
          {showFooter && variant !== "detail" ? (
            <div className="po-bourse-form-actions">
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
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <PoEditShell
      title={title}
      subtitle={subtitle}
      saving={saving}
      onBack={onClose}
      onSave={onSave}
      saveLabel={saveLabel}
      footerExtra={footerExtra}
      variant={variant}
    >
      {children}
    </PoEditShell>
  );
}
