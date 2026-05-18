"use client";

import { useMemo, useState } from "react";
import type { StaffUser } from "@/lib/prototype/constants";
import { userListItemToStaff } from "@/lib/users-api";
import type { SubmitRegistrationFn } from "./RegisterUserFlow";
import {
  CRM_HINTS,
  CRM_STEPS,
  REGIONS,
  SECTORS,
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

const CRM_DEFAULTS = {
  clientStatus: "lead",
  entitySubtype: "individual",
  clientType: "direct",
};
const REVIEW_STEP = 4;

export function CrmRegistrationFlow({
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
  } = useRegistrationDraft(
    {
      clientStatus: "lead",
      entitySubtype: "individual",
      clientType: "direct",
    },
    CRM_DEFAULTS,
  );

  const clientStatus = data.clientStatus ?? "lead";
  const entitySubtype = data.entitySubtype ?? "individual";
  const clientType = data.clientType ?? "direct";
  const isCompany = entitySubtype === "company";

  const isSuccess = step > CRM_STEPS.length;
  const title = useMemo(() => {
    if (isSuccess) return "تم التسجيل بنجاح";
    return CRM_STEPS[step - 1] ?? "";
  }, [step, isSuccess]);

  function validateStep(): boolean {
    clearErrors();
    let errors: FieldErrors = {};

    if (step === 2) {
      const keys = [
        "crm_name",
        "crm_email",
        "crm_phone",
        "crm_username",
        "crm_pwd",
        "crm_pwd2",
      ];
      if (isCompany) keys.unshift("crm_orgname");
      errors = mergeFieldErrors(
        errors,
        collectRequiredErrors(data, keys),
        validatePasswordPairFields(
          "crm_pwd",
          "crm_pwd2",
          data.crm_pwd,
          data.crm_pwd2,
        ),
      );
      const em = validateEmail(data.crm_email ?? "");
      if (em) errors.crm_email = em;
      if (existingEmails.has((data.crm_email ?? "").trim().toLowerCase())) {
        errors.crm_email = "هذا البريد مستخدم مسبقاً";
      }
    }

    if (step === 3 && isCompany) {
      errors = mergeFieldErrors(
        errors,
        collectRequiredErrors(data, ["crm_contactPerson"]),
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
      const result = await submitRegistration("crm", data);
      if (!result.ok) {
        applyFieldErrors(result.errors);
        setPendingConfirm(false);
        return;
      }
      const user = userListItemToStaff(result.user);
      setSavedUser(user);
      onComplete(user);
      setStep(CRM_STEPS.length + 1);
      setPendingConfirm(false);
    } catch {
      setError("تعذر حفظ المستخدم. تحقق من الاتصال بالخادم.");
      setPendingConfirm(false);
    } finally {
      setSaving(false);
    }
  }

  function handleNext() {
    if (step >= 2 && step <= REVIEW_STEP && !validateStep()) return;

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
        source="crm"
        steps={CRM_STEPS}
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
          source="crm"
          data={data}
          user={savedUser}
          onBackToList={onBack}
          onAddAnother={onAddAnother}
        />
      </RegistrationWizardShell>
    );
  }

  const statusLbl =
    clientStatus === "lead"
      ? "عميل محتمل (Lead)"
      : "عميل فعلي";
  const typeLbl =
    clientStatus === "active"
      ? clientType === "contract"
        ? "بعقد"
        : "مباشر"
      : "—";

  return (
    <RegistrationWizardShell
      source="crm"
      steps={CRM_STEPS}
      step={step}
      title={title}
      hint={CRM_HINTS[step - 1] ?? ""}
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
            title="حالة العميل"
            subtitle="تحدد دورة حياة العميل في النظام"
          >
            <TypePills
              options={[
                { value: "lead", label: "عميل محتمل (Lead)" },
                { value: "active", label: "عميل فعلي" },
              ]}
              value={clientStatus}
              onChange={(v) =>
                setData((d) => ({
                  ...d,
                  clientStatus: v,
                  clientType: v === "lead" ? "" : d.clientType || "direct",
                }))
              }
            />
            {clientStatus === "lead" ? (
              <div className="reg-info-box warn">
                العميل المحتمل يتحول تلقائياً لعميل فعلي عند شراء الخدمة
              </div>
            ) : null}
            {clientStatus === "active" ? (
              <>
                <div className="reg-sec-div">تصنيف العميل الفعلي</div>
                <TypePills
                  options={[
                    { value: "direct", label: "عميل مباشر — عرض سعر" },
                    { value: "contract", label: "عميل بعقد — خدمة مستمرة" },
                  ]}
                  value={clientType}
                  onChange={(v) => patch("clientType", v)}
                />
              </>
            ) : null}
          </RegistrationFormCard>
          <RegistrationFormCard title="نوع الكيان" subtitle="فرد أو شركة">
            <TypePills
              options={[
                { value: "individual", label: "فرد" },
                { value: "company", label: "شركة / مؤسسة" },
              ]}
              value={entitySubtype}
              onChange={(v) => patch("entitySubtype", v)}
            />
          </RegistrationFormCard>
        </>
      ) : null}

      {step === 2 ? (
        <RegistrationFormCard
          title={`البيانات الأساسية — ${isCompany ? "شركة / مؤسسة" : "فرد"}`}
        >
          <div className="reg-fg2">
            {isCompany ? (
              <>
                <RegField
                  id="crm_orgname"
                  label="اسم الشركة / المؤسسة"
                  required
                  value={data.crm_orgname ?? ""}
                  error={fieldErrors.crm_orgname}
                  onChange={(v) => patch("crm_orgname", v)}
                />
                <RegField
                  id="crm_crn"
                  label="رقم السجل التجاري"
                  value={data.crm_crn ?? ""}
                  onChange={(v) => patch("crm_crn", v)}
                />
              </>
            ) : null}
            <RegField
              id="crm_name"
              label={isCompany ? "اسم المسؤول الرئيسي" : "الاسم الكامل"}
              required
              value={data.crm_name ?? ""}
              error={fieldErrors.crm_name}
              onChange={(v) => patch("crm_name", v)}
            />
            {!isCompany ? (
              <RegField
                id="crm_idno"
                label="رقم الهوية الوطنية"
                value={data.crm_idno ?? ""}
                onChange={(v) => patch("crm_idno", v)}
              />
            ) : null}
            <RegField
              id="crm_email"
              label="البريد الإلكتروني"
              required
              type="email"
              dir="ltr"
              value={data.crm_email ?? ""}
              error={fieldErrors.crm_email}
              onChange={(v) => patch("crm_email", v)}
            />
            <RegField
              id="crm_phone"
              label="رقم الجوال"
              required
              type="tel"
              placeholder="05xxxxxxxx"
              value={data.crm_phone ?? ""}
              error={fieldErrors.crm_phone}
              onChange={(v) => patch("crm_phone", v)}
            />
            <RegField
              id="crm_username"
              label="اسم المستخدم"
              required
              value={data.crm_username ?? ""}
              error={fieldErrors.crm_username}
              onChange={(v) => patch("crm_username", v)}
            />
            <RegField
              id="crm_pwd"
              label="كلمة المرور"
              required
              type="password"
              value={data.crm_pwd ?? ""}
              error={fieldErrors.crm_pwd}
              onChange={(v) => patch("crm_pwd", v)}
            />
            <RegField
              id="crm_pwd2"
              label="تأكيد كلمة المرور"
              required
              type="password"
              value={data.crm_pwd2 ?? ""}
              error={fieldErrors.crm_pwd2}
              onChange={(v) => patch("crm_pwd2", v)}
            />
          </div>
        </RegistrationFormCard>
      ) : null}

      {step === 3 ? (
        <>
          <RegistrationFormCard title="البيانات الإضافية">
            <div className="reg-fg2">
              <RegSelect
                id="crm_region"
                label="المدينة / المنطقة"
                options={REGIONS}
                value={data.crm_region ?? ""}
                onChange={(v) => patch("crm_region", v)}
              />
              <RegSelect
                id="crm_sector"
                label="القطاع"
                options={SECTORS}
                value={data.crm_sector ?? ""}
                onChange={(v) => patch("crm_sector", v)}
              />
              <RegField
                id="crm_address"
                label="العنوان"
                value={data.crm_address ?? ""}
                onChange={(v) => patch("crm_address", v)}
              />
              <RegField
                id="crm_rep"
                label="المسؤول الميداني المرتبط"
                placeholder="اسم الموظف الداخلي"
                value={data.crm_rep ?? ""}
                onChange={(v) => patch("crm_rep", v)}
              />
              {isCompany ? (
                <RegField
                  id="crm_vatreg"
                  label="الرقم الضريبي"
                  value={data.crm_vatreg ?? ""}
                  onChange={(v) => patch("crm_vatreg", v)}
                />
              ) : null}
            </div>
          </RegistrationFormCard>
          {isCompany ? (
            <RegistrationFormCard title="جهة التواصل في الشركة">
              <div className="reg-fg2">
                <RegField
                  id="crm_contactPerson"
                  label="اسم المسؤول"
                  required
                  value={data.crm_contactPerson ?? ""}
                  error={fieldErrors.crm_contactPerson}
                  onChange={(v) => patch("crm_contactPerson", v)}
                />
                <RegField
                  id="crm_contactRole"
                  label="المنصب"
                  placeholder="مدير المشتريات..."
                  value={data.crm_contactRole ?? ""}
                  onChange={(v) => patch("crm_contactRole", v)}
                />
                <RegField
                  id="crm_contactPhone"
                  label="رقم الجوال"
                  type="tel"
                  value={data.crm_contactPhone ?? ""}
                  onChange={(v) => patch("crm_contactPhone", v)}
                />
              </div>
            </RegistrationFormCard>
          ) : null}
        </>
      ) : null}

      {step === REVIEW_STEP ? (
        <>
          {pendingConfirm ? <RegistrationConfirmBanner /> : null}
        <RegistrationFormCard title="مراجعة البيانات">
          <SummaryGrid
            rows={[
              { l: "حالة العميل", v: statusLbl },
              { l: "تصنيف العميل", v: typeLbl },
              {
                l: "نوع الكيان",
                v: isCompany ? "شركة / مؤسسة" : "فرد",
              },
              {
                l: "الاسم / الشركة",
                v: data.crm_orgname || data.crm_name || "",
              },
              { l: "البريد الإلكتروني", v: data.crm_email ?? "" },
              { l: "رقم الجوال", v: data.crm_phone ?? "" },
              { l: "اسم المستخدم", v: data.crm_username ?? "" },
              { l: "المنطقة", v: data.crm_region ?? "" },
            ]}
          />
          <div className="reg-info-box gold" style={{ marginTop: 12 }}>
            سيتم إرسال بيانات الدخول إلى{" "}
            <strong>{data.crm_email || "—"}</strong> بعد الحفظ
          </div>
        </RegistrationFormCard>
        </>
      ) : null}

      {error ? <div className="reg-w-alert on">{error}</div> : null}
    </RegistrationWizardShell>
  );
}

