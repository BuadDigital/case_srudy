"use client";

import type { EvaluatorChecklistAnswers } from "@/lib/prototype/evaluator/evaluator-window-data";
import {
  EVALUATOR_CONDITIONAL_QUESTIONS,
  EVALUATOR_SIMPLE_QUESTIONS,
} from "@/lib/prototype/evaluator/evaluator-window-data";
import type { EvaluatorValidationErrors } from "@/lib/prototype/evaluator/evaluator-validation";

function BoolQuestion({
  id,
  label,
  value,
  disabled,
  error,
  onChange,
}: {
  id: string;
  label: string;
  value: boolean | null;
  disabled?: boolean;
  error?: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className={`evaluator-q${error ? " has-error" : ""}`}>
      <span className="evaluator-q-label">{label}</span>
      <div className="radio-group">
        <label className="radio-opt">
          <input
            type="radio"
            name={id}
            checked={value === true}
            disabled={disabled}
            onChange={() => onChange(true)}
          />{" "}
          نعم
        </label>
        <label className="radio-opt">
          <input
            type="radio"
            name={id}
            checked={value === false}
            disabled={disabled}
            onChange={() => onChange(false)}
          />{" "}
          لا
        </label>
      </div>
      {error ? <span className="form-error">{error}</span> : null}
    </div>
  );
}

export function EvaluatorChecklist({
  checklist,
  disabled,
  errors,
  onChange,
}: {
  checklist: EvaluatorChecklistAnswers;
  disabled?: boolean;
  errors: EvaluatorValidationErrors;
  onChange: (patch: Partial<EvaluatorChecklistAnswers>) => void;
}) {
  return (
    <div className="evaluator-checklist">
      <h4 className="evaluator-section-title">قائمة فحص المقيم</h4>
      {EVALUATOR_SIMPLE_QUESTIONS.map((q) => (
        <BoolQuestion
          key={q.id}
          id={q.id}
          label={q.label}
          value={checklist[q.id]}
          disabled={disabled}
          error={errors[q.id]}
          onChange={(next) => onChange({ [q.id]: next })}
        />
      ))}

      {EVALUATOR_CONDITIONAL_QUESTIONS.map((q) => (
        <div key={q.id} className="evaluator-conditional-block">
          <BoolQuestion
            id={q.id}
            label={q.label}
            value={checklist[q.id]}
            disabled={disabled}
            error={errors[q.id]}
            onChange={(next) => onChange({ [q.id]: next })}
          />

          {q.id === "q_shared_deed" && checklist.q_shared_deed === true ? (
            <div className="evaluator-sub-fields">
              <div className={`form-group${errors.shared_deed_scope ? " has-error" : ""}`}>
                <span className="form-label">نطاق الملكية</span>
                <div className="radio-group">
                  <label className="radio-opt">
                    <input
                      type="radio"
                      name="shared_deed_scope"
                      checked={checklist.shared_deed_scope === "full"}
                      disabled={disabled}
                      onChange={() => onChange({ shared_deed_scope: "full" })}
                    />{" "}
                    كامل المساحة
                  </label>
                  <label className="radio-opt">
                    <input
                      type="radio"
                      name="shared_deed_scope"
                      checked={checklist.shared_deed_scope === "part"}
                      disabled={disabled}
                      onChange={() => onChange({ shared_deed_scope: "part" })}
                    />{" "}
                    جزء محدد
                  </label>
                </div>
                {errors.shared_deed_scope ? (
                  <span className="form-error">{errors.shared_deed_scope}</span>
                ) : null}
              </div>
              {checklist.shared_deed_scope === "part" ? (
                <div className={`form-group${errors.shared_deed_percentage ? " has-error" : ""}`}>
                  <label className="form-label" htmlFor="shared_deed_percentage">
                    نسبة الملكية
                  </label>
                  <input
                    id="shared_deed_percentage"
                    className="form-control"
                    value={checklist.shared_deed_percentage}
                    disabled={disabled}
                    placeholder="مثال: 3/8 أو 37.5%"
                    onChange={(e) =>
                      onChange({ shared_deed_percentage: e.target.value })
                    }
                  />
                  {errors.shared_deed_percentage ? (
                    <span className="form-error">{errors.shared_deed_percentage}</span>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {q.id === "q_lease_exists" && checklist.q_lease_exists === true ? (
            <div className="evaluator-sub-fields">
              <BoolQuestion
                id="q_lease_active"
                label="هل عقد الإيجار ساري المفعول؟"
                value={checklist.q_lease_active}
                disabled={disabled}
                error={errors.q_lease_active}
                onChange={(next) => onChange({ q_lease_active: next })}
              />
            </div>
          ) : null}

          {q.id === "q_technical_notes_exists" &&
          checklist.q_technical_notes_exists === true ? (
            <div className="evaluator-sub-fields">
              <div className={`form-group${errors.technical_notes_text ? " has-error" : ""}`}>
                <label className="form-label" htmlFor="technical_notes_text">
                  وصف الملاحظات الفنية
                </label>
                <textarea
                  id="technical_notes_text"
                  className="form-control"
                  rows={3}
                  disabled={disabled}
                  value={checklist.technical_notes_text}
                  onChange={(e) =>
                    onChange({ technical_notes_text: e.target.value })
                  }
                />
                {errors.technical_notes_text ? (
                  <span className="form-error">{errors.technical_notes_text}</span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
