"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RegistrationPortal } from "@platform/app-shared/registration/RegistrationPortal";
import { RegisterUserFlow } from "@platform/app-shared/registration/RegisterUserFlow";
import type { StaffUser } from "@platform/app-shared/prototype/constants";
import type { RegistrationSource } from "@platform/app-shared/prototype/registration-data";
import { submitRegistration } from "../lib/users-api";
import { prototypeKeys } from "@platform/app-shared/query/prototype-keys";
import { UsersOrganizationView } from "./users/UsersOrganizationView";
import { useStaffUsersQuery } from "../query/settings-queries";
import { usePrototype } from "@platform/app-shared/contexts/PrototypeContext";

type UsersMode = "list" | "portal" | "register";

function UsersToast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="note note-success reg-users-toast" role="status">
      {message}
    </div>
  );
}

function preferredSourceForRole(
  role: ReturnType<typeof usePrototype>["role"],
): RegistrationSource | null {
  if (role === "hr-admin") return "hr";
  if (role === "proc-admin") return "proc";
  if (role === "crm-admin") return "crm";
  return null;
}

function addButtonLabel(
  preferredSource: RegistrationSource | null,
): string {
  if (preferredSource === "hr") return "+ تسجيل موظف";
  if (preferredSource === "proc") return "+ تسجيل مقدم خدمة";
  if (preferredSource === "crm") return "+ تسجيل عميل";
  return "+ إضافة مستخدم";
}

function usersTitleForSource(preferredSource: RegistrationSource | null): string {
  if (preferredSource === "hr") return "موظفو الموارد البشرية";
  if (preferredSource === "proc") return "مستخدمو المالية والعقود";
  if (preferredSource === "crm") return "مستخدمو علاقات العملاء";
  return "جميع المستخدمين";
}

function usersEmptyForSource(preferredSource: RegistrationSource | null): string {
  if (preferredSource === "hr")
    return "لا يوجد موظفون في الموارد البشرية — أعد تشغيل API لتحميل البيانات المُهيّأة، أو أضف موظفاً جديداً.";
  if (preferredSource === "proc")
    return "لا يوجد مستخدمون في المالية والعقود — أضف مستخدماً جديداً.";
  if (preferredSource === "crm")
    return "لا يوجد مستخدمون في علاقات العملاء — أضف مستخدماً جديداً.";
  return "لا يوجد مستخدمون — أضف مستخدماً جديداً.";
}

export function UsersView() {
  const queryClient = useQueryClient();
  const { role } = usePrototype();
  const isCdo = role === "cdo";

  if (isCdo) {
    return <UsersOrganizationView />;
  }

  return <UsersStaffListView role={role} queryClient={queryClient} />;
}

function UsersStaffListView({
  role,
  queryClient,
}: {
  role: ReturnType<typeof usePrototype>["role"];
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const viewOnly = role === "general-manager";
  const preferredSource = preferredSourceForRole(role);

  const { data: staffResult } = useStaffUsersQuery();
  const staff = useMemo(() => staffResult?.users ?? [], [staffResult?.users]);
  const loadError = staffResult?.loadError ?? null;
  const dataReady = staffResult !== undefined;
  const [mode, setMode] = useState<UsersMode>("list");
  const [registerSource, setRegisterSource] =
    useState<RegistrationSource | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const refreshList = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: prototypeKeys.staffUsers() });
  }, [queryClient]);

  const existingEmails = useMemo(
    () => new Set(staff.map((u) => u.email.toLowerCase())),
    [staff],
  );

  const handleAdd = useCallback(
    (user: StaffUser) => {
      void refreshList();
      setToast(`تمت إضافة «${user.name}» بنجاح.`);
    },
    [refreshList],
  );

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    // Department admins should never enter source-selector mode.
    if (!preferredSource) return;
    if (mode === "portal") {
      setRegisterSource(preferredSource);
      setMode("register");
    }
  }, [mode, preferredSource]);

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
          submitRegistration={submitRegistration}
          onComplete={handleAdd}
          onBack={() => {
            void refreshList();
            setMode("list");
          }}
          onAddAnother={() => {
            setToast(null);
            if (preferredSource) {
              setRegisterSource(preferredSource);
              setMode("register");
            } else {
              setMode("portal");
            }
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
          <span className="card-title">
            {usersTitleForSource(preferredSource)}
            {dataReady ? ` (${staff.length})` : null}
          </span>
          {!viewOnly ? (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => {
                if (preferredSource) {
                  setRegisterSource(preferredSource);
                  setMode("register");
                  return;
                }
                setMode("portal");
              }}
            >
              {addButtonLabel(preferredSource)}
            </button>
          ) : (
            <span className="badge b-cancel">اطلاع فقط</span>
          )}
        </div>
        {loadError ? (
          <div className="note note-danger" style={{ margin: "0 0 12px" }}>
            {loadError}
          </div>
        ) : null}
        <table className="tbl users-tbl" data-pending={!dataReady}>
          <thead>
            <tr>
              <th>الاسم</th>
              <th>المسمى / نوع التوظيف</th>
              <th>البريد الإلكتروني</th>
              <th>رقم الجوال</th>
            </tr>
          </thead>
          <tbody>
            {dataReady && loadError ? (
              <tr className="tbl-empty">
                <td colSpan={4} style={{ textAlign: "center", color: "var(--text3)" }}>
                  —
                </td>
              </tr>
            ) : dataReady && staff.length === 0 ? (
              <tr className="tbl-empty">
                <td
                  colSpan={4}
                  style={{ textAlign: "center", color: "var(--text3)" }}
                >
                  {usersEmptyForSource(preferredSource)}
                </td>
              </tr>
            ) : dataReady ? (
              staff.map((u) => {
                const empType = u.details?.find(
                  (d) => d.label === "نوع التوظيف",
                )?.value;
                const roleLabel = empType ? `${u.role} · ${empType}` : u.role;
                return (
                <tr key={u.id} className="users-row-main">
                  <td style={{ fontSize: 11, fontWeight: 600 }}>{u.name}</td>
                  <td style={{ fontSize: 11, color: "var(--text2)" }}>{roleLabel}</td>
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
                    {u.phone ?? "—"}
                  </td>
                </tr>
                );
              })
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}

