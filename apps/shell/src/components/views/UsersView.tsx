"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RegistrationPortal } from "@/components/prototype/registration/RegistrationPortal";
import { RegisterUserFlow } from "@/components/prototype/registration/RegisterUserFlow";
import type { StaffUser, StaffUserDetail } from "@/lib/prototype/constants";
import type { RegistrationSource } from "@/lib/prototype/registration-data";
import { submitRegistration } from "@/lib/users-api";
import { prototypeKeys } from "@/lib/query/prototype-keys";
import { UsersOrganizationView } from "@/components/views/users/UsersOrganizationView";
import { useStaffUsersQuery } from "@/lib/query/prototype-queries";
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

function registrationSourceLabel(source?: StaffUser["source"]) {
  if (source === "hr") return "موارد بشرية";
  if (source === "proc") return "مقدم خدمة";
  if (source === "crm") return "عميل";
  return "—";
}

function formatCreatedAt(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isLtrValue(label: string) {
  return /بريد|آيبان|iban|email|معرّف|اسم المستخدم/i.test(label);
}

function groupDetailSections(details: StaffUserDetail[]) {
  const sections: { title: string; fields: StaffUserDetail[] }[] = [];
  const indexByTitle = new Map<string, number>();

  for (const field of details) {
    const title = field.section || "عام";
    const idx = indexByTitle.get(title);
    if (idx === undefined) {
      indexByTitle.set(title, sections.length);
      sections.push({ title, fields: [field] });
    } else {
      sections[idx].fields.push(field);
    }
  }

  return sections;
}

function ExpandChevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M4 2.5 8.5 6 4 9.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserDetailPanel({ user }: { user: StaffUser }) {
  const details = user.details ?? [];
  const created = formatCreatedAt(user.createdAt);
  const sections = groupDetailSections(details);

  if (sections.length === 0 && !created) {
    return (
      <div className="users-detail-panel">
        <p style={{ margin: 0, fontSize: 12, color: "var(--text3)" }}>
          لا توجد تفاصيل إضافية.
        </p>
      </div>
    );
  }

  return (
    <div className="users-detail-panel">
      <div className="users-detail-head">
        <span className="users-detail-title">تفاصيل إضافية</span>
        {user.source ? (
          <span className="users-detail-chip">
            {registrationSourceLabel(user.source)}
          </span>
        ) : null}
        {user.userName ? (
          <span className="users-detail-chip users-detail-chip-muted" dir="ltr">
            @{user.userName}
          </span>
        ) : null}
        {created ? (
          <span className="users-detail-chip">{created}</span>
        ) : null}
      </div>
      <div className="users-detail-sections">
        {sections.map((section) => (
          <section key={section.title} className="users-detail-section">
            <h4 className="users-detail-section-title">{section.title}</h4>
            <div className="users-detail-grid">
              {section.fields.map((field) => (
                <div
                  key={`${section.title}-${field.label}-${field.value}`}
                  className="users-detail-item"
                >
                  <label>{field.label}</label>
                  <span dir={isLtrValue(field.label) ? "ltr" : undefined}>
                    {field.value}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
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

  const { data: staffResult } = useStaffUsersQuery();
  const staff = useMemo(() => staffResult?.users ?? [], [staffResult?.users]);
  const loadError = staffResult?.loadError ?? null;
  const dataReady = staffResult !== undefined;
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

  const toggleExpanded = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
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
          submitRegistration={submitRegistration}
          onComplete={handleAdd}
          onBack={() => {
            void refreshList();
            setMode("list");
          }}
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
          <span className="card-title">
            جميع المستخدمين
            {dataReady ? ` (${staff.length})` : null}
          </span>
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
        {loadError ? (
          <div className="note note-danger" style={{ margin: "0 0 12px" }}>
            {loadError}
          </div>
        ) : null}
        <table className="tbl users-tbl" data-pending={!dataReady}>
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
            {dataReady && loadError ? (
              <tr className="tbl-empty">
                <td colSpan={6} style={{ textAlign: "center", color: "var(--text3)" }}>
                  —
                </td>
              </tr>
            ) : dataReady && staff.length === 0 ? (
              <tr className="tbl-empty">
                <td
                  colSpan={6}
                  style={{ textAlign: "center", color: "var(--text3)" }}
                >
                  لا يوجد مستخدمون — أضف مستخدماً جديداً.
                </td>
              </tr>
            ) : dataReady ? (
              staff.flatMap((u) => {
                const isOpen = expandedId === u.id;
                const rows = [
                  <tr key={u.id} className="users-row-main">
                    <td>
                      <div className="users-name-cell">
                        <button
                          type="button"
                          className="users-expand-btn"
                          aria-expanded={isOpen}
                          aria-label={
                            isOpen
                              ? `إخفاء تفاصيل ${u.name}`
                              : `عرض تفاصيل ${u.name}`
                          }
                          onClick={() => toggleExpanded(u.id)}
                        >
                          <ExpandChevron />
                        </button>
                        <span className="users-name-text">{u.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 11, color: "var(--text2)" }}>
                      {u.role}
                    </td>
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
                      —
                    </td>
                    <td>
                      <span
                        className={`badge ${staffContractBadgeClass(u.type)}`}
                      >
                        {staffContractLabel(u.type)}
                      </span>
                    </td>
                    <td>
                      <span className="badge b-done">نشط</span>
                    </td>
                  </tr>,
                ];

                if (isOpen) {
                  rows.push(
                    <tr key={`${u.id}-detail`} className="users-detail-row">
                      <td colSpan={6}>
                        <UserDetailPanel user={u} />
                      </td>
                    </tr>,
                  );
                }

                return rows;
              })
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}

