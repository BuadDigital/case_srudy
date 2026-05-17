"use client";

export type TypePillOption = { value: string; label: string };

export function TypePills({
  options,
  value,
  onChange,
  error,
}: {
  options: TypePillOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div>
      <div className={`reg-type-pills${error ? " reg-type-pills--error" : ""}`}>
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              className={`reg-type-pill${selected ? " sel" : ""}`}
              onClick={() => onChange(opt.value)}
              aria-pressed={selected}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="reg-field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

