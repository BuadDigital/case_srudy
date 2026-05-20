"use client";

import type { ReactNode } from "react";
import { PO_INTAKE_FLOW } from "@/lib/prototype/po-intake-data";
import { StepIndicator } from "@/components/prototype/registration/StepIndicator";
import {
  REG_BACK,
  REG_PREV,
} from "@/components/prototype/registration/registration-labels";
import { UNSAVED_CONFIRM_MSG } from "@/components/prototype/registration/registration-utils";

export function PoIntakeWizardShell({
  steps,
  step,
  hint,
  saving,
  success,
  showPrev,
  nextLabel,
  isDirty,
  onBack,
  onPrev,
  onNext,
  footerExtra,
  children,
}: {
  steps: readonly string[];
  step: number;
  hint: string;
  saving?: boolean;
  success?: boolean;
  showPrev: boolean;
  nextLabel: string;
  isDirty?: boolean;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  footerExtra?: ReactNode;
  children: ReactNode;
}) {
  const meta = PO_INTAKE_FLOW;
  const inWizard = !success && step <= steps.length;
  const displayStep = Math.min(step, steps.length);

  function handleBack() {
    if (isDirty && !window.confirm(UNSAVED_CONFIRM_MSG)) return;
    onBack();
  }

  return (
    <div
      className={`reg-root ${meta.flowClass}${inWizard ? " reg-root--compact" : ""}`}
    >
      <div className="reg-layout">
        <div
          className={`reg-main${inWizard ? " reg-main--wizard" : ""}${success ? " reg-main--success" : ""}`}
        >
          {!inWizard ? (
            <header className="reg-topbar">
              <div className="reg-topbar-main">
                <button type="button" className="btn btn-sm" onClick={handleBack}>
                  {REG_BACK}
                </button>
                <div className="reg-topbar-titles">
                  <div className="reg-tb-flow">{meta.title}</div>
                </div>
              </div>
              {success ? (
                <span className="reg-step-badge done">مكتمل</span>
              ) : null}
            </header>
          ) : null}

          {inWizard ? (
            <div className="reg-wizard-scroll">
              <div className="reg-wizard-panel">
                <header className="reg-topbar reg-topbar--panel">
                  <div className="reg-topbar-main">
                    <button type="button" className="btn btn-sm" onClick={handleBack}>
                      {REG_BACK}
                    </button>
                    <div className="reg-topbar-titles">
                      <div className="reg-tb-flow">{meta.dept}</div>
                      <div className="reg-tb-title">{meta.title}</div>
                    </div>
                  </div>
                  <span className="reg-step-badge">
                    الخطوة {displayStep} من {steps.length}
                  </span>
                </header>
                <StepIndicator steps={[...steps]} current={step} />
                {hint ? <p className="reg-step-hint">{hint}</p> : null}
                <div className="reg-body reg-body--panel">{children}</div>
                <footer className="reg-foot reg-foot--panel">
                  {footerExtra}
                  <div className="reg-foot-btns">
                    {showPrev ? (
                      <button type="button" className="btn" onClick={onPrev}>
                        {REG_PREV}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={saving}
                      onClick={onNext}
                    >
                      {saving ? "جارٍ الحفظ..." : nextLabel}
                    </button>
                  </div>
                </footer>
              </div>
            </div>
          ) : (
            <div
              className={`reg-body${success ? " reg-body--success" : ""}`}
            >
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
