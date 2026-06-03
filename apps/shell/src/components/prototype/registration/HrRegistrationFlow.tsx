"use client";

import { useMemo, useState } from "react";
import type { StaffUser } from "@/lib/prototype/constants";
import { userListItemToStaff } from "@/lib/users-api";
import type { SubmitRegistrationFn } from "./RegisterUserFlow";
import {
  HR_HINTS,
  HR_STEPS,
} from "@/lib/prototype/registration-data";
import { RegField } from "./FormFields";
import { RegistrationConfirmBanner } from "./RegistrationConfirmBanner";
import { RegistrationFormCard } from "./RegistrationFormCard";
import { RegistrationSuccess } from "./RegistrationSuccess";
import { RegistrationWizardShell } from "./RegistrationWizardShell";
import { SummaryGrid } from "./SummaryGrid";
import {
  REG_CONFIRM_SAVE,
  REG_NEXT,
  REG_SAVE,
} from "./registration-labels";
import {
  collectRequiredErrors,
  hasFieldErrors,
  mergeFieldErrors,
  type FieldErrors,
} from "./registration-utils";
import { useRegistrationDraft } from "./useRegistrationDraft";

const MINIMAL_HR_STEPS = ["بيانات الحساب", "مراجعة وحفظ"];
const MINIMAL_HR_HINTS = [
  "أدخل اسم المستخدم ورقم الجوال",
  "راجع البيانات قبل الحفظ",
];
const REVIEW_STEP = MINIMAL_HR_STEPS.length;
const DEFAULT_HR_PASSWORD = "Ejada@123";

export function HrRegistrationFlow({
  existingEmails,
  submitRegistration,
  onComplete,
  onBack,
  onAddAnother,
}: {
  existingEmails: Set<string>;
  submitRegistration: SubmitRegistrationFn;
  onComplete: (user: StaffUser) => void;
  onBack: () => void;
  onAddAnother: () => void;
}) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [savedUser, setSavedUser] = useState<StaffUser | null>(null);

  const {
    data,
    setData,
    fieldErrors,
    error,
    setError,
    pendingConfirm,
    setPendingConfirm,
    patch,
    isDirty,
    clearErrors,
    applyFieldErrors,
    resetConfirm,
  } = useRegistrationDraft({});

  const isSuccess = step > MINIMAL_HR_STEPS.length;
  const title = useMemo(() => {
    if (isSuccess) return "تم التسجيل بنجاح";
    return MINIMAL_HR_STEPS[step - 1] ?? "";
  }, [step, isSuccess]);

  function generatedEmail(username: string) {
    return `${username.toLowerCase()}@ejadah.dev`;
  }

  function payloadFromMinimalInput() {
    const username = (data.hr_username ?? "").trim();
    const phone = (data.hr_phone ?? "").trim();
    const displayName = username || "موظف";
    const email = generatedEmail(username);
    return {
      hr_empType: "دوام كامل",
      hr_dept: "إدارة التقييم العقاري",
      hr_section: "قسم دراسة الحالة",
      hr_jobTitle: "أخصائي دراسة حالة",
      hr_perms: "قارئ",
      hr_name: displayName,
      hr_phone: phone,
      hr_email: email,
      hr_username: username,
      hr_pwd: DEFAULT_HR_PASSWORD,
      hr_pwd2: DEFAULT_HR_PASSWORD,
    };
  }

  function validateStep(): boolean {
    clearErrors();
    let errors: FieldErrors = {};

    if (step === 1) {
      errors = mergeFieldErrors(
        errors,
        collectRequiredErrors(data, ["hr_username", "hr_phone"]),
      );
      const username = (data.hr_username ?? "").trim();
      if (username && !/^[A-Za-z0-9._-]{3,40}$/.test(username)) {
        errors.hr_username =
          "اسم المستخدم يقبل أحرف إنجليزية/أرقام و . _ - فقط (3-40)";
      }
      const email = generatedEmail(username);
      if (username && existingEmails.has(email)) {
        errors.hr_email = "هذا البريد مستخدم مسبقاً";
      }
    }

    if (hasFieldErrors(errors)) {
      applyFieldErrors(errors);
      return false;
    }
    setError(null);
    return true;
  }

  async function saveUser() {
    setSaving(true);
    try {
      const payload = payloadFromMinimalInput();
      const result = await submitRegistration("hr", payload);
      if (!result.ok) {
        applyFieldErrors(result.errors);
        setPendingConfirm(false);
        return;
      }
      const user = userListItemToStaff(result.user);
      setSavedUser(user);
      onComplete(user);
      setStep(MINIMAL_HR_STEPS.length + 1);
      setPendingConfirm(false);
    } catch {
      setError("تعذر حفظ المستخدم. تحقق من الاتصال بالخادم.");
      setPendingConfirm(false);
    } finally {
      setSaving(false);
    }
  }

  function handleNext() {
    if (step <= REVIEW_STEP && !validateStep()) return;

    if (step === REVIEW_STEP) {
      if (!pendingConfirm) {
        setPendingConfirm(true);
        return;
      }
      saveUser();
      return;
    }

    resetConfirm();
    setStep((s) => s + 1);
  }

  function handlePrev() {
    resetConfirm();
    setStep((s) => s - 1);
  }

  const nextLabel =
    step === REVIEW_STEP
      ? pendingConfirm
        ? REG_CONFIRM_SAVE
        : REG_SAVE
      : REG_NEXT;

  if (isSuccess && savedUser) {
    return (
      <RegistrationWizardShell
        source="hr"
        steps={MINIMAL_HR_STEPS}
        step={step}
        title={title}
        hint=""
        success
        showPrev={false}
        nextLabel=""
        onBack={onBack}
        onPrev={() => {}}
        onNext={() => {}}
      >
        <RegistrationSuccess
          source="hr"
          data={data}
          user={savedUser}
          onBackToList={onBack}
          onAddAnother={onAddAnother}
        />
      </RegistrationWizardShell>
    );
  }

  return (
    <RegistrationWizardShell
      source="hr"
      steps={MINIMAL_HR_STEPS}
      step={step}
      title={title}
      hint={MINIMAL_HR_HINTS[step - 1] ?? HR_HINTS[step - 1] ?? ""}
      saving={saving}
      isDirty={isDirty}
      showPrev={step > 1}
      nextLabel={nextLabel}
      onBack={onBack}
      onPrev={handlePrev}
      onNext={handleNext}
    >
      {step === 1 ? (
        <RegistrationFormCard title="بيانات الموظف الأساسية">
          <div className="reg-fg2">
            <RegField
              id="hr_username"
              label="اسم المستخدم"
              required
              value={data.hr_username ?? ""}
              error={fieldErrors.hr_username ?? fieldErrors.hr_email}
              onChange={(v) => patch("hr_username", v)}
            />
            <RegField
              id="hr_phone"
              label="رقم الجوال"
              required
              type="tel"
              placeholder="05xxxxxxxx"
              value={data.hr_phone ?? ""}
              error={fieldErrors.hr_phone}
              onChange={(v) => patch("hr_phone", v)}
            />
          </div>
          <div className="reg-info-box" style={{ marginTop: 12 }}>
            يتم توليد البريد تلقائياً بصيغة
            {" "}
            <span dir="ltr">
              {generatedEmail((data.hr_username ?? "").trim() || "username")}
            </span>
            {" "}
            وكلمة مرور مؤقتة من النظام.
          </div>
        </RegistrationFormCard>
      ) : null}

      {step === REVIEW_STEP ? (
        <>
          {pendingConfirm ? <RegistrationConfirmBanner /> : null}
          <RegistrationFormCard
            title="مراجعة البيانات"
            subtitle="تحقق من البيانات قبل الحفظ"
          >
            <SummaryGrid
              rows={[
                { l: "اسم المستخدم", v: data.hr_username ?? "" },
                { l: "رقم الجوال", v: data.hr_phone ?? "" },
                {
                  l: "البريد الإلكتروني (تلقائي)",
                  v: generatedEmail((data.hr_username ?? "").trim()),
                },
                { l: "الصلاحية الافتراضية", v: "قارئ" },
              ]}
            />
          </RegistrationFormCard>
        </>
      ) : null}

      {error ? <div className="reg-w-alert on">{error}</div> : null}
    </RegistrationWizardShell>
  );
}

