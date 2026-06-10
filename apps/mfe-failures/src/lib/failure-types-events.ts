export const FAILURE_TYPES_CHANGED_EVENT = "failure-types-changed";

export function notifyFailureTypesChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FAILURE_TYPES_CHANGED_EVENT));
}
