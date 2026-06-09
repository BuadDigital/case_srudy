"use client";

import type { StaffUser } from "@platform/app-shared/prototype/constants";
import {
  registrationSuccessLabel,
  type RegistrationFormData,
} from "../prototype/map-registration-to-staff";
import type { RegistrationSource } from "../prototype/registration-data";

export function RegistrationSuccess({
  source,
  data,
  user,
  onBackToList,
  onAddAnother,
}: {
  source: RegistrationSource;
  data: RegistrationFormData;
  user: StaffUser;
  onBackToList: () => void;
  onAddAnother: () => void;
}) {
  const typeLabel = registrationSuccessLabel(source, data);
  const username =
    data.hr_username || data.pc_username || data.crm_username || "—";

  return (
    <div className="reg-success-wrap">
      <div className="reg-success-ico" aria-hidden />
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
        تم إنشاء الحساب بنجاح
      </h2>
      <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>
        تمت إضافة «{user.name}» إلى قائمة المستخدمين.
      </p>
      <div className="reg-success-info">
        <div className="reg-si-row">
          الاسم: <strong>{user.name}</strong>
        </div>
        <div className="reg-si-row">
          النوع: <strong>{typeLabel}</strong>
        </div>
        <div className="reg-si-row">
          البريد: <strong>{user.email}</strong>
        </div>
        <div className="reg-si-row">
          اسم المستخدم: <strong>{username}</strong>
        </div>
      </div>
      <div className="reg-success-btns">
        <button type="button" className="btn btn-primary" onClick={onBackToList}>
          العودة للقائمة
        </button>
        <button type="button" className="btn" onClick={onAddAnother}>
          + تسجيل مستخدم آخر
        </button>
      </div>
    </div>
  );
}


