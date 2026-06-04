"use client";

import { useMemo, useState } from "react";
import type { CreateUserResult } from "@platform/api-client";
import type { RegistrationPayload } from "@platform/types";
import type { StaffUser } from "@/lib/prototype/constants";
import { userListItemToStaff } from "@/lib/users-api";
import type { RegistrationSource } from "@/lib/prototype/registration-data";
import { RegistrationFormCard } from "./RegistrationFormCard";
import { RegField } from "./FormFields";

export type SubmitRegistrationFn = (
  source: RegistrationSource,
  data: RegistrationPayload,
) => Promise<CreateUserResult>;

export function RegisterUserFlow({
  source,
  existingEmails,
  submitRegistration,
  onComplete,
  onBack,
  onAddAnother,
}: {
  source: RegistrationSource;
  existingEmails: Set<string>;
  submitRegistration: SubmitRegistrationFn;
  onComplete: (user: StaffUser) => void;
  onBack: () => void;
  onAddAnother: () => void;
}) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [doneUserName, setDoneUserName] = useState<string | null>(null);

  const sourceLabel = source === "hr" ? "موظف" : source === "proc" ? "مقدم خدمة" : "عميل";

  const canSubmit = useMemo(
    () => email.trim().length > 0 && phone.trim().length > 0 && !saving,
    [email, phone, saving],
  );

  function normalizePhoneDigits(value: string) {
    return value.replace(/\D/g, "").slice(0, 15);
  }

  function buildPayloadFromMinimal(
    selectedSource: RegistrationSource,
    nextEmail: string,
    nextPhone: string,
  ): RegistrationPayload {
    const cleanedEmail = nextEmail.trim().toLowerCase();
    const cleanedPhone = nextPhone.trim();
    const localPart = cleanedEmail.split("@")[0] || "user";
    const username = localPart.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 32) || "user";
    const password = "Aa123456!";

    if (selectedSource === "hr") {
      return {
        hr_empType: "داخلي",
        hr_dept: "الإدارة",
        hr_perms: "قارئ",
        hr_name: localPart,
        hr_phone: cleanedPhone,
        hr_email: cleanedEmail,
        hr_username: username,
        hr_pwd: password,
        hr_pwd2: password,
      };
    }

    if (selectedSource === "proc") {
      return {
        subtype: "ind",
        pc_name: localPart,
        pc_idno: "0000000000",
        pc_email: cleanedEmail,
        pc_phone: cleanedPhone,
        pc_username: username,
        pc_pwd: password,
        pc_pwd2: password,
        pc_service: "خدمة عامة",
      };
    }

    return {
      entitySubtype: "individual",
      clientStatus: "active",
      clientType: "direct",
      crm_name: localPart,
      crm_email: cleanedEmail,
      crm_phone: cleanedPhone,
      crm_username: username,
      crm_pwd: password,
      crm_pwd2: password,
    };
  }

  async function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    const cleanedEmail = email.trim().toLowerCase();
    const cleanedPhone = phone.trim();
    if (!cleanedEmail) nextErrors.email = "البريد الإلكتروني مطلوب";
    if (!cleanedPhone) nextErrors.phone = "رقم الجوال مطلوب";
    if (cleanedEmail && existingEmails.has(cleanedEmail)) {
      nextErrors.email = "هذا البريد مستخدم مسبقاً";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    setErrors({});
    const payload = buildPayloadFromMinimal(source, cleanedEmail, cleanedPhone);
    const result: CreateUserResult = await submitRegistration(source, payload);
    setSaving(false);
    if (!result.ok) {
      setErrors(result.errors ?? { _form: "تعذر إنشاء المستخدم" });
      return;
    }
    setDoneUserName(result.user.displayName);
    onComplete(userListItemToStaff(result.user));
  }

  if (doneUserName) {
    return (
      <RegistrationFormCard
        title={`تم تسجيل ${sourceLabel}`}
        subtitle="يمكنك إضافة مستخدم آخر بنفس الحقول المبسطة"
      >
        <div className="note note-success" style={{ marginBottom: 12 }}>
          تم إنشاء الحساب بنجاح: {doneUserName}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn btn-primary" onClick={onAddAnother}>
            + إضافة مستخدم آخر
          </button>
          <button type="button" className="btn btn-sm" onClick={onBack}>
            رجوع
          </button>
        </div>
      </RegistrationFormCard>
    );
  }

  return (
    <RegistrationFormCard
      title={`تسجيل ${sourceLabel}`}
      subtitle="حالياً: بريد إلكتروني + رقم جوال فقط"
    >
      {errors._form ? (
        <div className="note note-danger" style={{ marginBottom: 12 }}>
          {errors._form}
        </div>
      ) : null}
      <div className="reg-fg2">
        <RegField
          id="minimal_email"
          label="البريد الإلكتروني"
          required
          dir="ltr"
          value={email}
          error={errors.email}
          onChange={setEmail}
        />
        <RegField
          id="minimal_phone"
          label="رقم الجوال"
          required
          dir="ltr"
          inputMode="numeric"
          value={phone}
          error={errors.phone}
          onChange={(v) => setPhone(normalizePhoneDigits(v))}
        />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!canSubmit}
          onClick={() => void handleSubmit()}
        >
          {saving ? "جاري الحفظ..." : "حفظ"}
        </button>
        <button type="button" className="btn btn-sm" onClick={onBack} disabled={saving}>
          رجوع
        </button>
      </div>
    </RegistrationFormCard>
  );
}
