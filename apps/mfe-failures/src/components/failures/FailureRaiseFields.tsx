"use client";

import { useMemo } from "react";
import type { FailureSeverity } from "../../lib/failures-types";
import { useFailureTypesQuery } from "../../query/failure-types-queries";

export function FailureRaiseFields({
  severity,
  onSeverityChange,
  problemTypeId,
  onProblemTypeIdChange,
  note,
  onNoteChange,
  idPrefix = "fail",
}: {
  severity: FailureSeverity;
  onSeverityChange: (value: FailureSeverity) => void;
  problemTypeId: string;
  onProblemTypeIdChange: (value: string) => void;
  note: string;
  onNoteChange: (value: string) => void;
  idPrefix?: string;
}) {
  const { data: catalog } = useFailureTypesQuery();

  const groupedOptions = useMemo(() => {
    if (!catalog) return [];
    return catalog.categories
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((category) => ({
        category,
        types: catalog.problemTypes
          .filter((t) => t.categoryId === category.id)
          .sort((a, b) => a.order - b.order),
      }));
  }, [catalog]);

  const selectedType = catalog?.problemTypes.find((t) => t.id === problemTypeId);

  return (
    <>
      <div className="reg-fg-full" style={{ marginBottom: 10 }}>
        <span className="reg-fl">نوع التعذر *</span>
        <div className="radio-group" style={{ marginTop: 6 }}>
          <label className="radio-opt">
            <input
              type="radio"
              name={`${idPrefix}_severity`}
              checked={severity === "suspected"}
              onChange={() => onSeverityChange("suspected")}
            />{" "}
            احتمال تعذر
          </label>
          <label className="radio-opt">
            <input
              type="radio"
              name={`${idPrefix}_severity`}
              checked={severity === "internal"}
              onChange={() => onSeverityChange("internal")}
            />{" "}
            تعذر داخلي
          </label>
        </div>
      </div>

      <div className="reg-fg-full" style={{ marginBottom: 10 }}>
        <label className="reg-fl" htmlFor={`${idPrefix}_problem_type`}>
          نوع المشكلة *
        </label>
        <select
          id={`${idPrefix}_problem_type`}
          className="reg-fi"
          value={problemTypeId}
          onChange={(e) => onProblemTypeIdChange(e.target.value)}
        >
          <option value="">— اختر من القائمة —</option>
          {groupedOptions.map(({ category, types }) => (
            <optgroup key={category.id} label={category.label}>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {selectedType?.description ? (
          <p className="reg-field-hint" style={{ marginTop: 6 }}>
            {selectedType.description}
          </p>
        ) : null}
      </div>

      <div className="reg-fg-full" style={{ marginBottom: 12 }}>
        <label className="reg-fl" htmlFor={`${idPrefix}_note`}>
          ملاحظات
        </label>
        <textarea
          id={`${idPrefix}_note`}
          className="form-control"
          rows={3}
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="وصف تفصيلي للمشكلة (اختياري)"
          style={{ width: "100%", fontSize: 12 }}
        />
      </div>

      <p className="reg-field-hint" style={{ marginBottom: 12 }}>
        {severity === "internal"
          ? "يُضبط حالة الصك إلى «قيد التحقق» ويُوقف العمل على العقار حتى يُعالج التعذر."
          : "احتمال تعذر — إشارة تحذيرية فقط دون إيقاف العمل على العقار."}
      </p>
    </>
  );
}
