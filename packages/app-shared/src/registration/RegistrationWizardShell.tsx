"use client";

import type { ReactNode } from "react";
import {
  ENTITY_SUBTITLES,
  FLOW_META,
  type RegistrationSource,
} from "../prototype/registration-data";
import { RegistrationSidePanel } from "./RegistrationSidePanel";
import { StepIndicator } from "./StepIndicator";
import { REG_BACK, REG_PREV } from "./registration-labels";
import { UNSAVED_CONFIRM_MSG } from "./registration-utils";

export function RegistrationWizardShell({
  source,
  steps,
  step,
  title,
  hint,
  saving,
  success,
  showPrev,
  nextLabel,
  isDirty,
  onBack,
  onPrev,
  onNext,
  children,
}: {
  source: RegistrationSource;
  steps: string[];
  step: number;
  title: string;
  hint: string;
  saving?: boolean;
  success?: boolean;
  showPrev: boolean;
  nextLabel: string;
  isDirty?: boolean;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  children: ReactNode;
}) {
  const meta = FLOW_META[source];
  const inWizard = !success && step <= steps.length;
  const displayStep = Math.min(step, steps.length);

  function handleBack() {
    if (isDirty && !window.confirm(UNSAVED_CONFIRM_MSG)) return;
    onBack();
  }

  return (
    <div
      className={`card reg-root reg-flow-card ${meta.flowClass}${inWizard ? " reg-flow-card--wizard reg-root--with-side" : ""}`}
    >
      <div className="reg-layout">
        {inWizard ? (
          <RegistrationSidePanel source={source} onBack={handleBack} />
        ) : null}

        <div className={`reg-main${inWizard ? " reg-main--wizard" : ""}`}>
          {!inWizard ? (
            <header className="reg-topbar">
              <div className="reg-topbar-main">
                <button type="button" className="btn btn-sm" onClick={handleBack}>
                  {REG_BACK}
                </button>
                <div className="reg-topbar-titles">
                  <div className="reg-tb-flow">{meta.title}</div>
                  <div className="reg-tb-title">{title}</div>
                </div>
              </div>
              {success ? (
                <span className="reg-step-badge done">مكتمل</span>
              ) : null}
            </header>
          ) : null}

          {inWizard ? (
            <div className="reg-wizard-scroll">
              <div className="reg-wizard-panel reg-wizard-panel--wide">
                <header className="reg-topbar reg-topbar--panel">
                  <div className="reg-topbar-main">
                    <div className="reg-topbar-titles">
                      <div className="reg-tb-title">
                        الخطوة {displayStep} من {steps.length} — {title}
                      </div>
                      <div className="reg-tb-sub" dir="ltr">
                        {ENTITY_SUBTITLES[source]}
                      </div>
                    </div>
                  </div>
                  <span className="reg-step-badge">الخطوة {displayStep}</span>
                </header>
                <StepIndicator steps={steps} current={step} />
                {hint ? <p className="reg-step-hint">{hint}</p> : null}
                <div className="reg-body reg-body--panel">{children}</div>
                <footer className="reg-foot reg-foot--panel">
                  <div className="reg-foot-hint">{hint}</div>
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
