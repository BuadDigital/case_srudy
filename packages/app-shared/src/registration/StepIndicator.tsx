"use client";

import { Fragment } from "react";

export function StepIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="reg-steps-wrap">
      <div className="reg-steps-inner">
        {steps.map((label, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          const lineDone = n < current;

          return (
            <Fragment key={label}>
              <div className="reg-step-item">
                <div
                  className={`reg-step-circle${done ? " done" : ""}${active ? " active" : ""}`}
                >
                  {done ? <span className="reg-step-check" aria-hidden /> : n}
                </div>
                <span
                  className={`reg-step-label${done ? " done" : ""}${active ? " active" : ""}`}
                >
                  {label}
                </span>
              </div>
              {i < steps.length - 1 ? (
                <div className={`reg-step-line${lineDone ? " done" : ""}`} />
              ) : null}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

