"use client";

import { useCallback, useMemo, useState } from "react";
import type { RegistrationFormData } from "../prototype/map-registration-to-staff";
import {
  hasDraftData,
  type FieldErrors,
  UNSAVED_CONFIRM_MSG,
} from "./registration-utils";

export function useRegistrationDraft(
  initial: RegistrationFormData = {},
  ignoreForDirty: Record<string, string> = {},
) {
  const [data, setData] = useState<RegistrationFormData>(initial);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState(false);

  const patch = useCallback((key: string, value: string) => {
    setData((d) => ({ ...d, [key]: value }));
    setFieldErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
    setError(null);
    setPendingConfirm(false);
  }, []);

  const isDirty = useMemo(
    () => hasDraftData(data, ignoreForDirty),
    [data, ignoreForDirty],
  );

  const clearErrors = useCallback(() => {
    setFieldErrors({});
    setError(null);
  }, []);

  const applyFieldErrors = useCallback((errors: FieldErrors) => {
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("يرجى تصحيح الحقول المحددة أدناه");
    }
  }, []);

  const guardedBack = useCallback(
    (onBack: () => void) => {
      if (isDirty && !window.confirm(UNSAVED_CONFIRM_MSG)) return;
      onBack();
    },
    [isDirty],
  );

  const resetConfirm = useCallback(() => setPendingConfirm(false), []);

  const setDataAndClear = useCallback(
    (updater: (d: RegistrationFormData) => RegistrationFormData) => {
      setData(updater);
      setPendingConfirm(false);
      setError(null);
    },
    [],
  );

  return {
    data,
    setData,
    setDataAndClear,
    fieldErrors,
    setFieldErrors,
    error,
    setError,
    pendingConfirm,
    setPendingConfirm,
    patch,
    isDirty,
    clearErrors,
    applyFieldErrors,
    guardedBack,
    resetConfirm,
  };
}
