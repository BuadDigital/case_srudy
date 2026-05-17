"use client";

import { useMemo, useState } from "react";
import type { StaffUser } from "@/lib/prototype/constants";
import {
  mapRegistrationToStaff,
  type RegistrationFormData,
} from "@/lib/prototype/map-registration-to-staff";
import {
  EMP_TYPES,
  HR_HINTS,
  HR_STEPS,
  JOB_TITLES,
  ORG,
  PERMS,
} from "@/lib/prototype/registration-data";
import { RegField, RegSelect } from "./FormFields";
import { RegistrationConfirmBanner } from "./RegistrationConfirmBanner";
import { RegistrationFormCard } from "./RegistrationFormCard";
import { RegistrationSuccess } from "./RegistrationSuccess";
import { RegistrationWizardShell } from "./RegistrationWizardShell";
import { SummaryGrid } from "./SummaryGrid";
import { TypePills } from "./TypePills";
import {
  REG_CONFIRM_SAVE,
  REG_NEXT,
  REG_SAVE,
} from "./registration-labels";
import {
  collectRequiredErrors,
  fieldRequired,
  hasFieldErrors,
  mergeFieldErrors,
  type FieldErrors,
  validateEmail,
  validatePasswordPairFields,
} from "./registration-utils";
import { useRegistrationDraft } from "./useRegistrationDraft";

const REVIEW_STEP = HR_STEPS.length;

export function HrRegistrationFlow({
  existingEmails,
  onComplete,
  onBack,
  onAddAnother,
}: {
  existingEmails: Set<string>;
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

  const dept = data.hr_dept ?? "";
  const section = data.hr_section ?? "";
  const subs = dept && ORG[dept] ? ORG[dept].subs : [];
  const titles =
    section && JOB_TITLES[section] ? JOB_TITLES[section] : [];

  const isSuccess = step > HR_STEPS.length;
  const title = useMemo(() => {
    if (isSuccess) return "تم التسجيل بنجاح";
    return HR_STEPS[step - 1] ?? "";
  }, [step, isSuccess]);

  function validateStep(): boolean {
    clearErrors();
    let errors: FieldErrors = {};

    if (step === 1) {
      if (!data.hr_empType) {
        errors.hr_empType = "يرجى اختيار نوع التوظيف";
      }
      const deptErr = fieldRequired(dept, "يرجى اختيار الإدارة");
      if (deptErr) errors.hr_dept = deptErr;
      errors = mergeFieldErrors(
        errors,
        collectRequiredErrors(data, ["hr_perms"], "يرجى اختيار مستوى الصلاحيات"),
      );
    }

    if (step === 2) {
      errors = mergeFieldErrors(
        errors,
        collectRequiredErrors(data, ["hr_name", "hr_phone"]),
      );
    }

    if (step === 3) {
      errors = mergeFieldErrors(
        errors,
        collectRequiredErrors(data, [
          "hr_email",
          "hr_username",
          "hr_pwd",
          "hr_pwd2",
        ]),
        validatePasswordPairFields(
          "hr_pwd",
          "hr_pwd2",
          data.hr_pwd,
          data.hr_pwd2,
        ),
      );
      const em = validateEmail(data.hr_email ?? "");
      if (em) errors.hr_email = em;
      if (existingEmails.has((data.hr_email ?? "").trim().toLowerCase())) {
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

  function saveUser() {
    setSaving(true);
    window.setTimeout(() => {
      const user = mapRegistrationToStaff("hr", data);
      setSavedUser(user);
      onComplete(user);
      setStep(HR_STEPS.length + 1);
      setSaving(false);
      setPendingConfirm(false);
    }, 600);
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
        steps={HR_STEPS}
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
      steps={HR_STEPS}
      step={step}
      title={title}
      hint={HR_HINTS[step - 1] ?? ""}
      saving={saving}
      isDirty={isDirty}
      showPrev={step > 1}
      nextLabel={nextLabel}
      onBack={onBack}
      onPrev={handlePrev}
      onNext={handleNext}
    >
      {step === 1 ? (
        <>
          <RegistrationFormCard
            title="نوع التوظيف"
            subtitle="يحدد آلية العقد والفوترة"
          >
            <TypePills
              options={EMP_TYPES.map((t) => ({ value: t, label: t }))}
              value={data.hr_empType ?? ""}
              onChange={(v) => patch("hr_empType", v)}
              error={fieldErrors.hr_empType}
            />
          </RegistrationFormCard>
          <RegistrationFormCard
            title="الهيكل التنظيمي"
            subtitle="الإدارة والقسم والمسمى الوظيفي"
          >
            <div className="reg-fg2" style={{ marginBottom: 12 }}>
              <RegSelect
                id="hr_dept"
                label="الإدارة"
                required
                options={Object.keys(ORG)}
                value={dept}
                error={fieldErrors.hr_dept}
                onChange={(v) => {
                  setData((d) => ({
                    ...d,
                    hr_dept: v,
                    hr_section: "",
                    hr_jobTitle: "",
                  }));
                }}
              />
              <RegSelect
                id="hr_section"
                label="القسم"
                options={subs}
                value={section}
                onChange={(v) => {
                  setData((d) => ({ ...d, hr_section: v, hr_jobTitle: "" }));
                }}
              />
            </div>
            <div className="reg-fg2" style={{ marginTop: 12 }}>
              <RegSelect
                id="hr_jobTitle"
                label="المسمى الوظيفي"
                options={titles}
                value={data.hr_jobTitle ?? ""}
                onChange={(v) => patch("hr_jobTitle", v)}
              />
              <RegSelect
                id="hr_perms"
                label="مستوى الصلاحيات"
                required
                options={PERMS}
                value={data.hr_perms ?? ""}
                error={fieldErrors.hr_perms}
                onChange={(v) => patch("hr_perms", v)}
              />
            </div>
          </RegistrationFormCard>
        </>
      ) : null}

      {step === 2 ? (
        <RegistrationFormCard title="البيانات الشخصية">
          <div className="reg-fg2">
            <RegField
              id="hr_name"
              label="الاسم الكامل"
              required
              value={data.hr_name ?? ""}
              error={fieldErrors.hr_name}
              onChange={(v) => patch("hr_name", v)}
            />
            <RegField
              id="hr_idno"
              label="رقم الهوية الوطنية"
              value={data.hr_idno ?? ""}
              onChange={(v) => patch("hr_idno", v)}
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
            <RegField
              id="hr_empNo"
              label="رقم الموظف"
              placeholder="اختياري"
              value={data.hr_empNo ?? ""}
              onChange={(v) => patch("hr_empNo", v)}
            />
            <RegField
              id="hr_joinDate"
              label="تاريخ الانضمام"
              type="date"
              value={data.hr_joinDate ?? ""}
              onChange={(v) => patch("hr_joinDate", v)}
            />
          </div>
        </RegistrationFormCard>
      ) : null}

      {step === 3 ? (
        <RegistrationFormCard title="بيانات حساب الدخول">
          <div className="reg-fg2">
            <RegField
              id="hr_email"
              label="البريد الإلكتروني"
              required
              type="email"
              dir="ltr"
              value={data.hr_email ?? ""}
              error={fieldErrors.hr_email}
              onChange={(v) => patch("hr_email", v)}
            />
            <RegField
              id="hr_username"
              label="اسم المستخدم"
              required
              value={data.hr_username ?? ""}
              error={fieldErrors.hr_username}
              onChange={(v) => patch("hr_username", v)}
            />
            <RegField
              id="hr_pwd"
              label="كلمة المرور الأولية"
              required
              type="password"
              value={data.hr_pwd ?? ""}
              error={fieldErrors.hr_pwd}
              onChange={(v) => patch("hr_pwd", v)}
            />
            <RegField
              id="hr_pwd2"
              label="تأكيد كلمة المرور"
              required
              type="password"
              value={data.hr_pwd2 ?? ""}
              error={fieldErrors.hr_pwd2}
              onChange={(v) => patch("hr_pwd2", v)}
            />
          </div>
          <div className="reg-info-box" style={{ marginTop: 12 }}>
            ستُرسل بيانات الدخول تلقائياً إلى البريد الإلكتروني بعد الحفظ
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
                { l: "نوع التوظيف", v: data.hr_empType ?? "" },
                { l: "الإدارة", v: dept },
                { l: "القسم", v: section },
                { l: "المسمى الوظيفي", v: data.hr_jobTitle ?? "" },
                { l: "الصلاحيات", v: data.hr_perms ?? "" },
                { l: "الاسم الكامل", v: data.hr_name ?? "" },
                { l: "رقم الهوية", v: data.hr_idno ?? "" },
                { l: "البريد الإلكتروني", v: data.hr_email ?? "" },
                { l: "رقم الجوال", v: data.hr_phone ?? "" },
                { l: "اسم المستخدم", v: data.hr_username ?? "" },
              ]}
            />
          </RegistrationFormCard>
        </>
      ) : null}

      {error ? <div className="reg-w-alert on">{error}</div> : null}
    </RegistrationWizardShell>
  );
}

