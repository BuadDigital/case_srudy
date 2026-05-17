"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RegistrationPortal } from "@/components/prototype/registration/RegistrationPortal";
import { RegisterUserFlow } from "@/components/prototype/registration/RegisterUserFlow";
import type { StaffUser } from "@/lib/prototype/constants";
import type { RegistrationSource } from "@/lib/prototype/registration-data";
import {
  loadStaffUsers,
  saveStaffUsers,
} from "@/lib/prototype/staff-users";
import { usePrototype } from "@/contexts/PrototypeContext";

function staffContractLabel(t: "internal" | "freelance" | "external") {
  if (t === "internal") return "موظف داخلي";
  if (t === "freelance") return "متعاون";
  return "مزود خدمة";
}

function staffContractBadgeClass(t: "internal" | "freelance" | "external") {
  if (t === "internal") return "b-int";
  if (t === "freelance") return "b-free";
  return "b-ext";
}

type UsersMode = "list" | "portal" | "register";

function UsersToast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="note note-success reg-users-toast" role="status">
      {message}
    </div>
  );
}

export function UsersView() {
  const { role } = usePrototype();
  const viewOnly = role === "general-manager";

  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [mode, setMode] = useState<UsersMode>("list");
  const [registerSource, setRegisterSource] =
    useState<RegistrationSource | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setStaff(loadStaffUsers());
  }, []);

  const existingEmails = useMemo(
    () => new Set(staff.map((u) => u.email.toLowerCase())),
    [staff],
  );

  const handleAdd = useCallback((user: StaffUser) => {
    setStaff((prev) => {
      const next = [...prev, user];
      saveStaffUsers(next);
      return next;
    });
    setToast(`تمت إضافة «${user.name}» بنجاح.`);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(t);
  }, [toast]);

  if (mode === "portal") {
    return (
      <>
        <UsersToast message={toast} />
        <RegistrationPortal
          onSelect={(source) => {
            setRegisterSource(source);
            setMode("register");
          }}
          onBack={() => setMode("list")}
        />
      </>
    );
  }

  if (mode === "register" && registerSource) {
    return (
      <>
        <UsersToast message={toast} />
        <RegisterUserFlow
          source={registerSource}
          existingEmails={existingEmails}
          onComplete={handleAdd}
          onBack={() => setMode("list")}
          onAddAnother={() => {
            setToast(null);
            setMode("portal");
          }}
        />
      </>
    );
  }

  return (
    <>
      <UsersToast message={toast} />

      <div className="card">
        <div className="card-header">
          <span className="card-title">جميع المستخدمين ({staff.length})</span>
          {!viewOnly ? (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => setMode("portal")}
            >
              + إضافة مستخدم
            </button>
          ) : (
            <span className="badge b-cancel">اطلاع فقط</span>
          )}
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>الدور</th>
              <th>البريد الإلكتروني</th>
              <th>كلمة المرور</th>
              <th>نوع التعاقد</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 ? (
              <tr className="tbl-empty">
                <td
                  colSpan={6}
                  style={{ textAlign: "center", color: "var(--text3)" }}
                >
                  لا يوجد مستخدمون — أضف مستخدماً جديداً.
                </td>
              </tr>
            ) : (
              staff.map((u) => (
                <tr key={u.email}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td style={{ fontSize: 11, color: "var(--text2)" }}>{u.role}</td>
                  <td
                    style={{
                      direction: "ltr",
                      textAlign: "right",
                      fontSize: 11,
                      color: "var(--primary-light)",
                    }}
                  >
                    {u.email}
                  </td>
                  <td
                    style={{
                      direction: "ltr",
                      textAlign: "right",
                      fontSize: 11,
                      color: "var(--text2)",
                    }}
                  >
                    {u.password ?? "—"}
                  </td>
                  <td>
                    <span className={`badge ${staffContractBadgeClass(u.type)}`}>
                      {staffContractLabel(u.type)}
                    </span>
                  </td>
                  <td>
                    <span className="badge b-done">نشط</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
