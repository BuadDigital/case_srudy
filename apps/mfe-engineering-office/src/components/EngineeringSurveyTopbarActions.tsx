"use client";

import { useSyncExternalStore } from "react";
import {
  getSurveyWorkTopbarState,
  subscribeSurveyWorkTopbar,
} from "@platform/app-shared/prototype/survey-work-topbar-bridge";

export function EngineeringSurveyTopbarActions() {
  const topbar = useSyncExternalStore(
    subscribeSurveyWorkTopbar,
    getSurveyWorkTopbarState,
    () => null,
  );

  if (!topbar) return null;

  return (
    <div className="topbar-actions" aria-label="إجراءات الرفع المساحي">
      <button
        type="button"
        className="btn btn-sm btn-primary"
        disabled={topbar.saving}
        onClick={topbar.onSave}
      >
        {topbar.saving ? "جاري الإرسال…" : topbar.saveLabel}
      </button>
    </div>
  );
}
