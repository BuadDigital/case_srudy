"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getAuthSession } from "@platform/auth-client";
import { usePrototype } from "@platform/app-shared/contexts/PrototypeContext";
import { PARTY_TASK_PAGES } from "@platform/app-shared/prototype/party-task-pages";
import { isSuperAdmin } from "@platform/app-shared/prototype/prototype-role-access";
import type { RoleId } from "@platform/types";
import { PoNumber } from "../components/ui/PoNumber";
import { RemainingTimeCell } from "../components/ui/RemainingTimeCell";
import { RowMoreMenu } from "../components/ui/RowMoreMenu";
import type { RowMoreMenuItem } from "../components/ui/RowMoreMenu";
import { StatValue } from "../components/ui/StatValue";
import {
  formatPropertyDeedDisplay,
  type PoIntakeRecord,
} from "../lib/prototype/po-intake-data";
import { resolveRemainingTime } from "../lib/prototype/my-task-row";
import { poPropertiesPath, poPropertyPath } from "../lib/po-routes";
import {
  propertySuspensionKey,
  type SuspendedTransaction,
} from "../lib/prototype/suspended-transactions-storage";
import { tasksForPartyAssignee } from "../lib/prototype/tasks-storage";
import { usePoRecordsQuery, useWorkflowTasksQuery } from "../query/case-study-queries";
import { useSuspendedTransactionsQuery } from "../query/suspended-transactions-queries";

const PARTY_ASSIGNMENT_ROLE_IDS = new Set(
  Object.values(PARTY_TASK_PAGES).map((def) => def.roleId),
);

function isCaseStudyStaff(role: RoleId) {
  return (
    isSuperAdmin(role) ||
    role === "case-specialist" ||
    role === "section-supervisor" ||
    role === "general-manager"
  );
}

function deedLabel(
  item: SuspendedTransaction,
  record: PoIntakeRecord | undefined,
): string {
  const property =
    record?.properties.find((p) => p.id === item.propertyId) ?? null;
  if (property) {
    const label = formatPropertyDeedDisplay(property);
    if (label !== "—") return label;
  }
  return item.deedNumber.trim() || item.title.trim() || "—";
}

function buildSuspendedRowMoreItems(
  item: SuspendedTransaction,
  router: ReturnType<typeof useRouter>,
): RowMoreMenuItem[] {
  const po = item.poNumber.trim();
  const propertyId = item.propertyId.trim();
  return [
    {
      id: "property-detail",
      label: "تفاصيل العقار",
      onClick: () => router.push(poPropertyPath(po, propertyId)),
    },
    {
      id: "po-properties",
      label: "عقارات أمر العمل",
      onClick: () => router.push(poPropertiesPath(po)),
    },
  ];
}

export function SuspendedTransactionsView() {
  const router = useRouter();
  const { role, viewerEmail } = usePrototype();
  const { data: items = [], isFetched } = useSuspendedTransactionsQuery();
  const { data: poRecords = [] } = usePoRecordsQuery();
  const { data: tasks = [] } = useWorkflowTasksQuery();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const poByNumber = useMemo(() => {
    const map = new Map<string, PoIntakeRecord>();
    for (const record of poRecords) map.set(record.poNumber.trim(), record);
    return map;
  }, [poRecords]);

  const visibleItems = useMemo(() => {
    if (isSuperAdmin(role) || !PARTY_ASSIGNMENT_ROLE_IDS.has(role)) return items;
    const email = viewerEmail ?? getAuthSession()?.user.email;
    const mine = tasksForPartyAssignee(role, tasks, undefined, email);
    const keys = new Set(
      mine
        .filter((t) => t.propertyId)
        .map((t) => propertySuspensionKey(t.poNumber, t.propertyId!)),
    );
    return items.filter((item) =>
      keys.has(propertySuspensionKey(item.poNumber, item.propertyId)),
    );
  }, [items, role, tasks, viewerEmail]);

  const stats = useMemo(() => {
    let onTime = 0;
    let overdue = 0;
    for (const item of visibleItems) {
      const record = poByNumber.get(item.poNumber.trim());
      const remaining = resolveRemainingTime(record?.dueDateAt ?? "", now);
      if (remaining.status === "overdue") overdue += 1;
      else if (remaining.status === "active") onTime += 1;
    }
    return {
      suspended: visibleItems.length,
      onTime,
      overdue,
      total: visibleItems.length,
    };
  }, [visibleItems, poByNumber, now]);

  const sortedItems = useMemo(() => {
    return [...visibleItems].sort((a, b) =>
      b.suspendedAt.localeCompare(a.suspendedAt),
    );
  }, [visibleItems]);

  const staff = isCaseStudyStaff(role);
  const isLoading = !isFetched;

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card red">
          <div className="stat-label">معاملات معلقة</div>
          <StatValue value={isFetched ? stats.suspended : undefined} />
        </div>
        <div className="stat-card warn">
          <div className="stat-label">متأخرة عن الاستحقاق</div>
          <StatValue value={isFetched ? stats.overdue : undefined} />
        </div>
        <div className="stat-card green">
          <div className="stat-label">ضمن المهلة</div>
          <StatValue value={isFetched ? stats.onTime : undefined} />
        </div>
        <div className="stat-card">
          <div className="stat-label">الإجمالي</div>
          <StatValue value={isFetched ? stats.total : undefined} />
        </div>
      </div>

      {!staff ? (
        <div className="note note-info">
          المعاملة معلّقة — لا يمكن متابعة العمل حتى رفع التعليق من مشرف دراسة
          الحالة.
        </div>
      ) : null}
      {staff ? (
        <div className="note note-success" style={{ marginBottom: 12 }}>
          مسار التعليق: مراجعة المشرف → تعليق المعاملة → إيقاف جميع الأطراف —
          المؤقت يستمر حتى موعد الاستحقاق.
        </div>
      ) : null}

      <div className="po-properties-page pd-page">
        <article className="po-properties-shell po-properties-shell--compact po-bourse-queue-box">
          <header className="po-properties-hero po-properties-hero--compact po-bourse-queue-hero">
            <div className="po-properties-hero-main">
              <div className="po-properties-meta">
                {!isLoading && sortedItems.length > 0 ? (
                  <span className="po-properties-meta-count">
                    {sortedItems.length}{" "}
                    {sortedItems.length === 1 ? "معاملة" : "معاملات"}
                  </span>
                ) : null}
              </div>
            </div>
          </header>

          {isLoading ? (
            <p className="po-properties-loading">جاري تحميل المعاملات…</p>
          ) : sortedItems.length === 0 ? (
            <div className="po-properties-empty">
              <p>لا توجد معاملات معلقة.</p>
              <p className="po-properties-hint" style={{ marginTop: 8 }}>
                تظهر هنا بعد تعليق المعاملة من إدارة التعذرات.
              </p>
            </div>
          ) : (
            <>
              <div className="po-properties-tbl-wrap">
                <table
                  className="tbl po-properties-tbl po-properties-tbl--compact po-properties-tbl--primary-data"
                  data-pending={isLoading}
                >
                  <colgroup>
                    <col className="po-col-property-slot" />
                    <col className="po-col-po" />
                    <col className="po-col-assign-type" />
                    <col className="po-col-assign-spec" />
                    <col className="po-col-remaining" />
                    <col className="po-col-more" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="po-pd-th-center">رقم الصك</th>
                      <th className="po-pd-th-center">أمر العمل</th>
                      <th className="po-pd-th-center">نوع الإسناد</th>
                      <th className="po-pd-assign-spec">أخصائي الإسناد</th>
                      <th className="po-pd-th-center">الحالة</th>
                      <th
                        className="po-properties-th-more"
                        aria-label="المزيد"
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedItems.map((item) => {
                      const record = poByNumber.get(item.poNumber.trim());
                      const remaining = resolveRemainingTime(
                        record?.dueDateAt ?? "",
                        now,
                      );
                      const assignmentType =
                        record?.assignmentType?.trim() || "—";
                      const assignmentSpecialist =
                        record?.assignmentSpecialist?.trim() || "—";
                      const moreItems = buildSuspendedRowMoreItems(item, router);

                      return (
                        <tr
                          key={item.id}
                          className="po-properties-row"
                          onClick={() =>
                            router.push(
                              poPropertyPath(
                                item.poNumber,
                                item.propertyId,
                              ),
                            )
                          }
                        >
                          <td className="po-pd-td-center">
                            <span className="id-cell po-num-ltr">
                              {deedLabel(item, record)}
                            </span>
                          </td>
                          <td className="po-properties-cell-muted po-pd-td-center">
                            <PoNumber value={item.poNumber} link />
                          </td>
                          <td className="po-properties-cell-muted po-pd-td-center">
                            {assignmentType}
                          </td>
                          <td
                            className="po-properties-cell-muted po-pd-assign-spec"
                            title={assignmentSpecialist}
                          >
                            {assignmentSpecialist}
                          </td>
                          <td className="po-pd-td-remaining">
                            <RemainingTimeCell state={remaining} />
                          </td>
                          <td className="po-properties-cell-more">
                            <RowMoreMenu items={moreItems} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="po-properties-hint">
                اضغط الصف لعرض تفاصيل العقار — ⋮ عقارات أمر العمل · تفاصيل
                العقار.
              </p>
            </>
          )}
        </article>
      </div>
    </>
  );
}
