/** Shared field-level validation helpers (domain layer — no UI). */

export type FieldErrors = Record<string, string>;

export function collectRequiredErrors(
  data: Record<string, string | undefined>,
  keys: string[],
  message = "هذا الحقل مطلوب",
): FieldErrors {
  const errors: FieldErrors = {};
  for (const key of keys) {
    if (!(data[key] ?? "").trim()) {
      errors[key] = message;
    }
  }
  return errors;
}

export function mergeFieldErrors(
  ...parts: (FieldErrors | undefined)[]
): FieldErrors {
  return Object.assign({}, ...parts.filter(Boolean));
}

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
