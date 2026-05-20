"use client";

function FieldWrap({
  label,
  required,
  className,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="reg-fl">
        {label}
        {required ? <span className="reg-req"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="reg-field-error" role="alert">
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
}) {
  return (
    <FieldWrap label={label} required={required} className={className} error={error}>
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
        aria-describedby={error ? `${id}-error` : undefined}
      />
    </FieldWrap>
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
  options: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
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
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </FieldWrap>
  );
}

