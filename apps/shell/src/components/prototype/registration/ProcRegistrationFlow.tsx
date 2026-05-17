"use client";

import { useMemo, useState } from "react";
import type { StaffUser } from "@/lib/prototype/constants";
import {
  mapRegistrationToStaff,
  type RegistrationFormData,
} from "@/lib/prototype/map-registration-to-staff";
import {
  PROC_STEPS_IND,
  PROC_STEPS_ORG,
  REGIONS,
  SECTORS,
  SERVICES,
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
  hasFieldErrors,
  mergeFieldErrors,
  type FieldErrors,
  validateEmail,
  validatePasswordPairFields,
} from "./registration-utils";
import { useRegistrationDraft } from "./useRegistrationDraft";

export function ProcRegistrationFlow({
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
    pendingConfirm,
    setPendingConfirm,
    patch,
    isDirty,
    clearErrors,
    applyFieldErrors,
    resetConfirm,
  } = useRegistrationDraft({ subtype: "" });

  const isOrg = data.subtype === "org";
  const steps = isOrg ? PROC_STEPS_ORG : PROC_STEPS_IND;
  const reviewStep = steps.length;

  const isSuccess = step > steps.length;
  const title = useMemo(() => {
    if (isSuccess) return "تم التسجيل بنجاح";
    return steps[step - 1] ?? "";
  }, [step, steps, isSuccess]);

  const hints = [
    "اختر نوع مقدم الخدمة",
    "البيانات الأساسية",
    isOrg ? "فريق الإدارة (اختياري لاحقاً)" : "بيانات الخدمة",
    isOrg ? "بيانات الفوترة" : "راجع ثم احفظ",
    "راجع ثم احفظ",
  ];

  function validateStep(): boolean {
    clearErrors();
    let errors: FieldErrors = {};

    if (step === 1) {
      if (!data.subtype) {
        errors.subtype = "يرجى اختيار نوع مقدم الخدمة";
      }
    }

    if (step === 2) {
      const keys = isOrg
        ? [
            "pc_orgname",
            "pc_crn",
            "pc_delegate",
            "pc_idno",
            "pc_email",
            "pc_phone",
            "pc_username",
            "pc_pwd",
            "pc_pwd2",
            "pc_service",
          ]
        : [
            "pc_name",
            "pc_idno",
            "pc_email",
            "pc_phone",
            "pc_username",
            "pc_pwd",
            "pc_pwd2",
          ];
      errors = mergeFieldErrors(
        errors,
        collectRequiredErrors(data, keys),
        validatePasswordPairFields(
          "pc_pwd",
          "pc_pwd2",
          data.pc_pwd,
          data.pc_pwd2,
        ),
      );
      const em = validateEmail(data.pc_email ?? "");
      if (em) errors.pc_email = em;
      if (existingEmails.has((data.pc_email ?? "").trim().toLowerCase())) {
        errors.pc_email = "هذا البريد مستخدم مسبقاً";
      }
    }

    if (!isOrg && step === 3) {
      errors = mergeFieldErrors(
        errors,
        collectRequiredErrors(data, ["pc_service"]),
      );
    }

    if (hasFieldErrors(errors)) {
      applyFieldErrors(errors);
      return false;
    }
    return true;
  }

  function saveUser() {
    setSaving(true);
    window.setTimeout(() => {
      const user = mapRegistrationToStaff("proc", data);
      setSavedUser(user);
      onComplete(user);
      setStep(steps.length + 1);
      setSaving(false);
      setPendingConfirm(false);
    }, 600);
  }

  function handleNext() {
    if (step <= reviewStep && !validateStep()) return;

    if (step === reviewStep) {
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
    step === reviewStep
      ? pendingConfirm
        ? REG_CONFIRM_SAVE
        : REG_SAVE
      : REG_NEXT;

  if (isSuccess && savedUser) {
    return (
      <RegistrationWizardShell
        source="proc"
        steps={steps}
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
          source="proc"
          data={data}
          user={savedUser}
          onBackToList={onBack}
          onAddAnother={onAddAnother}
        />
      </RegistrationWizardShell>
    );
  }

  const summaryRows = isOrg
    ? [
        { l: "اسم الجهة", v: data.pc_orgname ?? "" },
        { l: "رقم السجل", v: data.pc_crn ?? "" },
        { l: "المفوض", v: data.pc_delegate ?? "" },
        { l: "البريد", v: data.pc_email ?? "" },
        { l: "نوع الخدمة", v: data.pc_service ?? "" },
        { l: "الآيبان", v: data.pc_iban ?? "" },
      ]
    : [
        { l: "الاسم", v: data.pc_name ?? "" },
        { l: "البريد", v: data.pc_email ?? "" },
        { l: "نوع الخدمة", v: data.pc_service ?? "" },
        { l: "المنطقة", v: data.pc_region ?? "" },
      ];

  return (
    <RegistrationWizardShell
      source="proc"
      steps={steps}
      step={step}
      title={title}
      hint={hints[step - 1] ?? ""}
      saving={saving}
      isDirty={isDirty}
      showPrev={step > 1}
      nextLabel={nextLabel}
      onBack={onBack}
      onPrev={handlePrev}
      onNext={handleNext}
    >
      {step === 1 ? (
        <RegistrationFormCard
          title="نوع مقدم الخدمة"
          subtitle="يحدد هيكل التسجيل وآلية الفوترة"
        >
          <TypePills
            options={[
              { value: "individual", label: "فرد مستقل" },
              { value: "org", label: "جهة / مؤسسة" },
            ]}
            value={data.subtype ?? ""}
            error={fieldErrors.subtype}
            onChange={(v) => {
              setData((d) => ({ ...d, subtype: v }));
              setStep(1);
              resetConfirm();
            }}
          />
          {data.subtype === "individual" ? (
            <div className="reg-info-box">حساب شخصي واحد — الفوترة مباشرة للفرد</div>
          ) : null}
          {data.subtype === "org" ? (
            <div className="reg-info-box">
              حساب واحد للجهة — الفوترة على مستوى المؤسسة
            </div>
          ) : null}
        </RegistrationFormCard>
      ) : null}

      {step === 2 && !isOrg ? (
        <RegistrationFormCard title="بيانات الفرد المستقل">
          <div className="reg-fg2">
            <RegField
              id="pc_name"
              label="الاسم الكامل"
              required
              value={data.pc_name ?? ""}
              onChange={(v) => patch("pc_name", v)}
            />
            <RegField
              id="pc_idno"
              label="رقم الهوية الوطنية"
              required
              value={data.pc_idno ?? ""}
              onChange={(v) => patch("pc_idno", v)}
            />
            <RegField
              id="pc_email"
              label="البريد الإلكتروني"
              required
              type="email"
              dir="ltr"
              value={data.pc_email ?? ""}
              onChange={(v) => patch("pc_email", v)}
            />
            <RegField
              id="pc_phone"
              label="رقم الجوال"
              required
              type="tel"
              value={data.pc_phone ?? ""}
              onChange={(v) => patch("pc_phone", v)}
            />
            <RegField
              id="pc_username"
              label="اسم المستخدم"
              required
              value={data.pc_username ?? ""}
              onChange={(v) => patch("pc_username", v)}
            />
            <RegField
              id="pc_pwd"
              label="كلمة المرور"
              required
              type="password"
              value={data.pc_pwd ?? ""}
              onChange={(v) => patch("pc_pwd", v)}
            />
            <RegField
              id="pc_pwd2"
              label="تأكيد كلمة المرور"
              required
              type="password"
              value={data.pc_pwd2 ?? ""}
              onChange={(v) => patch("pc_pwd2", v)}
            />
          </div>
        </RegistrationFormCard>
      ) : null}

      {step === 2 && isOrg ? (
        <RegistrationFormCard title="بيانات الجهة">
          <div className="reg-fg2">
            <RegField
              id="pc_orgname"
              label="اسم الجهة / المؤسسة"
              required
              value={data.pc_orgname ?? ""}
              onChange={(v) => patch("pc_orgname", v)}
            />
            <RegField
              id="pc_crn"
              label="رقم السجل التجاري"
              required
              value={data.pc_crn ?? ""}
              onChange={(v) => patch("pc_crn", v)}
            />
            <RegField
              id="pc_delegate"
              label="اسم المفوض / المدير"
              required
              value={data.pc_delegate ?? ""}
              onChange={(v) => patch("pc_delegate", v)}
            />
            <RegField
              id="pc_idno"
              label="رقم هوية المفوض"
              required
              value={data.pc_idno ?? ""}
              onChange={(v) => patch("pc_idno", v)}
            />
            <RegField
              id="pc_email"
              label="البريد الإلكتروني الرسمي"
              required
              type="email"
              dir="ltr"
              value={data.pc_email ?? ""}
              onChange={(v) => patch("pc_email", v)}
            />
            <RegField
              id="pc_phone"
              label="رقم الجوال"
              required
              type="tel"
              value={data.pc_phone ?? ""}
              onChange={(v) => patch("pc_phone", v)}
            />
            <RegField
              id="pc_username"
              label="اسم المستخدم"
              required
              value={data.pc_username ?? ""}
              onChange={(v) => patch("pc_username", v)}
            />
            <RegField
              id="pc_pwd"
              label="كلمة المرور"
              required
              type="password"
              value={data.pc_pwd ?? ""}
              onChange={(v) => patch("pc_pwd", v)}
            />
            <RegField
              id="pc_pwd2"
              label="تأكيد كلمة المرور"
              required
              type="password"
              value={data.pc_pwd2 ?? ""}
              onChange={(v) => patch("pc_pwd2", v)}
            />
            <RegSelect
              id="pc_service"
              label="نوع الخدمة الرئيسية"
              required
              options={SERVICES}
              value={data.pc_service ?? ""}
              onChange={(v) => patch("pc_service", v)}
            />
            <RegSelect
              id="pc_sector"
              label="القطاع"
              options={SECTORS}
              value={data.pc_sector ?? ""}
              onChange={(v) => patch("pc_sector", v)}
            />
            <RegField
              id="pc_address"
              label="العنوان الرئيسي"
              value={data.pc_address ?? ""}
              onChange={(v) => patch("pc_address", v)}
              className="reg-sp2"
            />
            <RegSelect
              id="pc_region"
              label="المنطقة الجغرافية"
              options={REGIONS}
              value={data.pc_region ?? ""}
              onChange={(v) => patch("pc_region", v)}
            />
          </div>
        </RegistrationFormCard>
      ) : null}

      {step === 3 && !isOrg ? (
        <RegistrationFormCard title="الخدمة والتغطية والفوترة">
          <div className="reg-fg2">
            <RegSelect
              id="pc_service"
              label="نوع الخدمة"
              required
              options={SERVICES}
              value={data.pc_service ?? ""}
              onChange={(v) => patch("pc_service", v)}
            />
            <RegSelect
              id="pc_region"
              label="المنطقة الجغرافية"
              options={REGIONS}
              value={data.pc_region ?? ""}
              onChange={(v) => patch("pc_region", v)}
            />
            <RegField
              id="pc_bankname"
              label="اسم البنك"
              value={data.pc_bankname ?? ""}
              onChange={(v) => patch("pc_bankname", v)}
            />
            <RegField
              id="pc_iban"
              label="رقم الآيبان (IBAN)"
              placeholder="SA..."
              value={data.pc_iban ?? ""}
              onChange={(v) => patch("pc_iban", v)}
            />
          </div>
        </RegistrationFormCard>
      ) : null}

      {step === 3 && isOrg ? (
        <RegistrationFormCard
          title="فريق الإدارة والفرق"
          subtitle="يمكن إضافة أعضاء الفريق لاحقاً من لوحة الإدارة"
        >
          <div className="reg-info-box">
            بيانات فريق الإدارة والفرق التشغيلية تُكمَّل لاحقاً — يكفي الآن بيانات
            الجهة والفوترة.
          </div>
        </RegistrationFormCard>
      ) : null}

      {step === 4 && isOrg ? (
        <RegistrationFormCard title="بيانات الفوترة">
          <div className="reg-fg2">
            <RegField
              id="pc_bankname"
              label="اسم البنك"
              value={data.pc_bankname ?? ""}
              onChange={(v) => patch("pc_bankname", v)}
            />
            <RegField
              id="pc_iban"
              label="رقم الآيبان (IBAN)"
              value={data.pc_iban ?? ""}
              onChange={(v) => patch("pc_iban", v)}
            />
            <RegField
              id="pc_billingemail"
              label="بريد الفوترة"
              type="email"
              dir="ltr"
              value={data.pc_billingemail ?? ""}
              onChange={(v) => patch("pc_billingemail", v)}
            />
            <RegField
              id="pc_vatreg"
              label="الرقم الضريبي"
              value={data.pc_vatreg ?? ""}
              onChange={(v) => patch("pc_vatreg", v)}
            />
          </div>
        </RegistrationFormCard>
      ) : null}

      {step === reviewStep ? (
        <>
          {pendingConfirm ? <RegistrationConfirmBanner /> : null}
          <RegistrationFormCard title="مراجعة البيانات">
            <SummaryGrid rows={summaryRows} />
          </RegistrationFormCard>
        </>
      ) : null}

      {error ? <div className="reg-w-alert on">{error}</div> : null}
    </RegistrationWizardShell>
  );
}

