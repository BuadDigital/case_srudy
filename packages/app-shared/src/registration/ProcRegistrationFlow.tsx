"use client";

import { useMemo, useState } from "react";
import type { ProcOpsUnit, ProcMgmtMember } from "./ProcOrgTeamsEditor";
import {
  ProcOrgTeamsEditor,
  defaultProcMgmtTeam,
  defaultProcOpsUnits,
} from "./ProcOrgTeamsEditor";
import type { StaffUser } from "@platform/app-shared/prototype/constants";
import { userListItemToStaff } from "../users/user-mappers";
import type { SubmitRegistrationFn } from "./RegisterUserFlow";
import {
  PROC_STEPS_IND,
  PROC_STEPS_ORG,
  REGIONS,
  SECTORS,
  SERVICES,
} from "../prototype/registration-data";
import { RegField, RegSelect } from "./FormFields";
import { RegistrationConfirmBanner } from "./RegistrationConfirmBanner";
import { RegistrationFormCard } from "./RegistrationFormCard";
import { RegistrationSuccess } from "./RegistrationSuccess";
import { RegistrationWizardShell } from "./RegistrationWizardShell";
import { SummaryGrid } from "./SummaryGrid";
import { TypePills } from "./TypePills";
import {
  RegErrorAlert,
  RegGrid2,
  RegInfoBox,
} from "./registration-layout";
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
  const [mgmtTeam, setMgmtTeam] = useState<ProcMgmtMember[]>(defaultProcMgmtTeam);
  const [opsUnits, setOpsUnits] = useState<ProcOpsUnit[]>(defaultProcOpsUnits);

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
    isOrg ? "فريق الإدارة والفرق التشغيلية" : "بيانات الخدمة والفوترة",
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

  async function saveUser() {
    setSaving(true);
    try {
      const result = await submitRegistration("proc", data);
      if (!result.ok) {
        applyFieldErrors(result.errors);
        setPendingConfirm(false);
        return;
      }
      const user = userListItemToStaff(result.user);
      setSavedUser(user);
      onComplete(user);
      setStep(steps.length + 1);
      setPendingConfirm(false);
    } catch {
      setError("تعذر حفظ المستخدم. تحقق من الاتصال بالخادم.");
      setPendingConfirm(false);
    } finally {
      setSaving(false);
    }
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

  const filledMgmt = mgmtTeam.filter((m) => m.name.trim()).length;
  const filledOps = opsUnits.filter((u) => u.name.trim()).length;

  const summaryRows = isOrg
    ? [
        { l: "اسم الجهة", v: data.pc_orgname ?? "" },
        { l: "رقم السجل", v: data.pc_crn ?? "" },
        { l: "المفوض", v: data.pc_delegate ?? "" },
        { l: "البريد", v: data.pc_email ?? "" },
        { l: "نوع الخدمة", v: data.pc_service ?? "" },
        { l: "فريق الإدارة", v: filledMgmt ? `${filledMgmt} عضو` : "—" },
        { l: "الفرق التشغيلية", v: filledOps ? `${filledOps} فريق` : "—" },
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
            <RegInfoBox>حساب شخصي واحد — الفوترة مباشرة للفرد</RegInfoBox>
          ) : null}
          {data.subtype === "org" ? (
            <RegInfoBox>
              حساب واحد للجهة — الفوترة على مستوى المؤسسة
            </RegInfoBox>
          ) : null}
        </RegistrationFormCard>
      ) : null}

      {step === 2 && !isOrg ? (
        <RegistrationFormCard title="بيانات الفرد المستقل">
          <RegGrid2>
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
          </RegGrid2>
        </RegistrationFormCard>
      ) : null}

      {step === 2 && isOrg ? (
        <RegistrationFormCard title="بيانات الجهة">
          <RegGrid2>
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
              className="col-span-2 max-sm:col-span-1"
            />
            <RegSelect
              id="pc_region"
              label="المنطقة الجغرافية"
              options={REGIONS}
              value={data.pc_region ?? ""}
              onChange={(v) => patch("pc_region", v)}
            />
          </RegGrid2>
        </RegistrationFormCard>
      ) : null}

      {step === 3 && !isOrg ? (
        <RegistrationFormCard title="الخدمة والتغطية والفوترة">
          <RegGrid2>
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
          </RegGrid2>
        </RegistrationFormCard>
      ) : null}

      {step === 3 && isOrg ? (
        <ProcOrgTeamsEditor
          mgmtTeam={mgmtTeam}
          opsUnits={opsUnits}
          onMgmtChange={setMgmtTeam}
          onOpsChange={setOpsUnits}
        />
      ) : null}

      {step === 4 && isOrg ? (
        <RegistrationFormCard title="بيانات الفوترة">
          <RegGrid2>
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
          </RegGrid2>
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

      <RegErrorAlert error={error} />
    </RegistrationWizardShell>
  );
}

