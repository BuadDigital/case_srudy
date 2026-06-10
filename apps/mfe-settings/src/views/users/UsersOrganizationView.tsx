"use client";

import type { OrgDepartment, OrgPerson } from "@platform/types";
import { useOrganizationQuery } from "../../query/settings-queries";

function roleLabel(systemRole: string) {
  if (systemRole === "CDO") return "مسؤول التحول الرقمي";
  if (systemRole === "HrAdmin") return "أخصائية موارد بشرية";
  if (systemRole === "ProcAdmin") return "مدير المالية والعقود";
  if (systemRole === "CrmAdmin") return "مدير علاقات العملاء";
  return systemRole;
}

function PersonCard({
  person,
  badge,
}: {
  person: OrgPerson;
  badge?: string;
}) {
  return (
    <div className="users-org-person">
      <div className="users-org-person-head">
        <span className="users-org-person-name">{person.displayName}</span>
        {badge ? <span className="badge b-int">{badge}</span> : null}
      </div>
      <div className="users-org-person-role">{roleLabel(person.systemRole)}</div>
      <div className="users-org-person-meta" dir="ltr">
        {person.email}
      </div>
      {person.jobTitle ? (
        <div className="users-org-person-sub">{person.jobTitle}</div>
      ) : null}
    </div>
  );
}

function DepartmentCard({ dept }: { dept: OrgDepartment }) {
  return (
    <section className="users-org-dept card" style={{ marginBottom: 12 }}>
      <div className="card-header">
        <span className="card-title">{dept.title}</span>
        {dept.isActive ? (
          <span className="badge b-done">مفعّل</span>
        ) : (
          <span className="badge b-prog">مرحلة مستقبلية</span>
        )}
      </div>
      <div className="card-body">
        <p className="users-org-dept-desc">{dept.description}</p>
        {dept.admin ? (
          <PersonCard person={dept.admin} />
        ) : (
          <p className="users-org-empty">لم يُعيَّن مدير بعد.</p>
        )}
      </div>
    </section>
  );
}

export function UsersOrganizationView() {
  const { data, isPending } = useOrganizationQuery();
  const overview = data?.overview;
  const loadError = data?.loadError ?? null;

  return (
    <>
      <div className="note users-org-banner">
        <strong>هيكل الإدارات ومديري الأنظمة</strong>
        <span>
          عرض فقط — إنشاء الموظفين والموردين والعملاء يتم من قبل مدير كل إدارة، وليس
          من شاشة CDO.
        </span>
      </div>

      {loadError ? (
        <div className="note note-danger" style={{ marginBottom: 12 }}>
          {loadError}
        </div>
      ) : null}

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-header">
          <span className="card-title">مسؤول التحول الرقمي (CDO)</span>
          <span className="badge b-cancel">اطلاع فقط</span>
        </div>
        <div className="card-body" data-pending={isPending}>
          {overview?.cdo ? (
            <PersonCard person={overview.cdo} badge="USR-001" />
          ) : !isPending ? (
            <p className="users-org-empty">—</p>
          ) : null}
        </div>
      </div>

      <div className="users-org-tree-label">الإدارات الفرعية</div>
      {isPending && !overview ? (
        <div className="card">
          <div className="card-body">
            <p style={{ margin: 0, color: "var(--text3)", fontSize: 12 }}>
              جاري التحميل…
            </p>
          </div>
        </div>
      ) : (
        overview?.departments.map((dept) => (
          <DepartmentCard key={dept.code} dept={dept} />
        ))
      )}
    </>
  );
}
