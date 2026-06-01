"use client";

function FieldWrap({
  label,
  required,
  className,
  error,
  hint,
  fieldId,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  error?: string;
  hint?: string;
  fieldId?: string;
  children: React.ReactNode;
}) {
  const hintId = hint && fieldId ? `${fieldId}-hint` : undefined;
  return (
    <div className={className}>
      <label className="reg-fl" htmlFor={fieldId}>
        {label}
        {required ? <span className="reg-req"> *</span> : null}
      </label>
      {children}
      {hint ? (
        <p className="reg-field-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="reg-field-error" role="alert" id={fieldId ? `${fieldId}-error` : undefined}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function RegField({
  id,
  label,
  required,
  type = "text",
  placeholder,
  inputMode,
  value,
  onChange,
  className,
  dir,
  error,
  hint,
}: {
  id: string;
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  dir?: "ltr" | "rtl";
  error?: string;
  hint?: string;
}) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");
  return (
    <FieldWrap
      label={label}
      required={required}
      className={className}
      error={error}
      hint={hint}
      fieldId={id}
    >
      <input
        id={id}
        className={`reg-fi${error ? " reg-fi--error" : ""}`}
        type={type}
        placeholder={placeholder}
        inputMode={inputMode}
        value={value}
        dir={dir}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
      />
    </FieldWrap>
  );
}

export type RegSelectOption = string | { value: string; label: string };

function regSelectEntries(options: RegSelectOption[]): { value: string; label: string }[] {
  return options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );
}

export function RegSelect({
  id,
  label,
  required,
  options,
  value,
  onChange,
  className,
  error,
  disabled,
  placeholder,
}: {
  id: string;
  label: string;
  required?: boolean;
  options: RegSelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  const entries = regSelectEntries(options);
  return (
    <FieldWrap label={label} required={required} className={className} error={error}>
      <select
        id={id}
        className={`reg-fi${error ? " reg-fi--error" : ""}${disabled ? " reg-fi--disabled" : ""}`}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
      >
        <option value="">{placeholder ?? "اختر..."}</option>
        {entries.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldWrap>
  );
}

