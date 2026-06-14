"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePrototype } from "@platform/app-shared/contexts/PrototypeContext";
import { ROLES } from "@platform/app-shared/prototype/constants";
import { prototypeKeys } from "@platform/app-shared/query/prototype-keys";
import { isSuperAdmin } from "@platform/app-shared/prototype/prototype-role-access";
import type { RoleId } from "@platform/types";
import { StatValue } from "@case-study/mfe";
import { formatDateAr, formatPoDisplay } from "@case-study/mfe";
import { poPropertyPath } from "@case-study/mfe/lib/po-routes";
import { suspendPropertyTransaction } from "@case-study/mfe/lib/prototype/suspend-property-transaction";
import { usePoRecordsQuery } from "@case-study/mfe/query/case-study-queries";
import { failureProblemTypeLabel } from "../lib/failure-types-data";
import { approveFailure, resolveFailure, returnFailure, submitFailureForReview, upgradeFailureToInternal } from "../lib/failures-repository";
import { failureSeverityLabel, failureStatusLabel } from "../lib/failures-local-storage";
import { countOpenFailures, isActiveFailureStatus } from "../lib/failures-types";
import { useFailuresQuery } from "../query/failures-queries";

function isCaseEditor(role: RoleId) {
  return isSuperAdmin(role) || role === "case-specialist";
}

function isSupervisor(role: RoleId) {
  return isSuperAdmin(role) || role === "section-supervisor";
}

type ResolveDraft = { reason: string; instructions: string };

export function FailuresView() {
  const queryClient = useQueryClient();
  const { role } = usePrototype();
  const ce = isCaseEditor(role);
  const ca = isSupervisor(role);
  const { data: items = [], isFetched, refetch } = useFailuresQuery();
  const { data: poRecords = [] } = usePoRecordsQuery();
  const assignmentSpecialistByPo = useMemo(() => {
    const map = new Map<string, string>();
    for (const record of poRecords) {
      const name = record.assignmentSpecialist?.trim();
      if (name) map.set(record.poNumber.trim(), name);
    }
    return map;
  }, [poRecords]);
  const [supervisorNote, setSupervisorNote] = useState<Record<string, string>>({});
  const [resolveDraft, setResolveDraft] = useState<Record<string, ResolveDraft>>(
    {},
  );
  const [resolveOpen, setResolveOpen] = useState<Record<string, boolean>>({});

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: prototypeKeys.failures() });
    void queryClient.invalidateQueries({
      queryKey: prototypeKeys.suspendedTransactions(),
    });
    void queryClient.invalidateQueries({
      queryKey: prototypeKeys.workflowTasks(),
    });
    void refetch();
  }, [queryClient, refetch]);

  const stats = useMemo(() => {
    const open = countOpenFailures(items);
    const review = items.filter((f) => f.status === "review").length;
    const approved = items.filter((f) => f.status === "approved").length;
    const resolved = items.filter((f) => f.status === "resolved").length;
    return { open, review, approved, resolved };
  }, [items]);

  const sortedItems = useMemo(() => {
    return [...items]
      .filter((f) => f.status !== "suspended")
      .sort((a, b) => {
        const aActive = isActiveFailureStatus(a.status);
        const bActive = isActiveFailureStatus(b.status);
        if (aActive !== bActive) return aActive ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [items]);

  function handleSubmit(id: string) {
    void submitFailureForReview(id).then(() => refresh());
  }

  function handleUpgrade(id: string) {
    void upgradeFailureToInternal(id).then(() => refresh());
  }

  function handleApprove(id: string) {
    void approveFailure(id, supervisorNote[id] ?? "").then(() => refresh());
  }

  function handleReturn(id: string) {
    void returnFailure(id, supervisorNote[id] ?? "").then(() => refresh());
  }

  async function handleSuspend(id: string) {
    const failure = items.find((f) => f.id === id);
    if (!failure) return;
    const ok = await suspendPropertyTransaction({
      failure,
      supervisorNote: supervisorNote[id] ?? "",
      suspendedBy: ROLES[role]?.name ?? "مشرف",
    });
    if (ok) refresh();
  }

  function handleResolve(id: string) {
    const draft = resolveDraft[id] ?? { reason: "", instructions: "" };
    if (!draft.reason.trim() || !draft.instructions.trim()) return;
    void resolveFailure(id, {
      resolutionReason: draft.reason,
      continueInstructions: draft.instructions,
    }).then(() => {
      setResolveOpen((o) => ({ ...o, [id]: false }));
      refresh();
    });
  }

  function toggleResolve(id: string) {
    setResolveOpen((o) => ({ ...o, [id]: !o[id] }));
  }

  function patchResolveDraft(id: string, patch: Partial<ResolveDraft>) {
    setResolveDraft((d) => {
      const current = d[id] ?? { reason: "", instructions: "" };
      return { ...d, [id]: { ...current, ...patch } };
    });
  }

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card red">
          <div className="stat-label">تعذرات مفتوحة</div>
          <StatValue value={isFetched ? stats.open : undefined} />
        </div>
        <div className="stat-card warn">
          <div className="stat-label">عند مشرف دراسة الحالة</div>
          <StatValue value={isFetched ? stats.review : undefined} />
        </div>
        <div className="stat-card green">
          <div className="stat-label">معتمدة / تم الحل</div>
          <StatValue
            value={
              isFetched ? stats.approved + stats.resolved : undefined
            }
          />
        </div>
        <div className="stat-card">
          <div className="stat-label">الإجمالي</div>
          <StatValue value={isFetched ? items.length : undefined} />
        </div>
      </div>

      {!ce && !ca ? (
        <div className="note note-info">
          {role === "general-manager"
            ? "أنت في وضع الاطلاع — صلاحية التعديل للمشرف والأخصائي"
            : role === "cdo"
              ? "صلاحيات كاملة — يمكنك اعتماد التعذرات وإنشاؤها"
              : "أنت في وضع المراقبة — لا تملك صلاحية تعديل التعذرات"}
        </div>
      ) : null}
      {ca ? (
        <div className="note note-success">
          مسار التعذر: رفع (احتمال / داخلي) → معالجة الأخصائي → مراجعة المشرف
          مع أخصائي الإسناد → اعتماد التعذر أو تعليق المعاملة.
        </div>
      ) : null}

      {sortedItems.length === 0 ? (
        <article className="page-shell">
          <p
            className="page-gutter"
            style={{ paddingBlock: 24, textAlign: "center", color: "var(--text3)" }}
          >
            لا توجد تعذرات — سجّل تعذراً من شاشة العقارات.
          </p>
        </article>
      ) : (
        sortedItems.map((f) => {
          const active = isActiveFailureStatus(f.status);
          const displayTitle = failureProblemTypeLabel(f.problemTypeId, f.title);
          const canSpecialistAct =
            ce &&
            active &&
            (f.status === "internal" || f.status === "returned");
          const canSupervisorAct = ca && active && f.status === "review";
          const canResolve = canSpecialistAct && f.status !== "approved";
          const draft = resolveDraft[f.id] ?? { reason: "", instructions: "" };

          return (
            <div
              key={f.id}
              className="fail-card"
              style={active ? undefined : { opacity: 0.72 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 6,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  {f.deedNumber || displayTitle}{" "}
                  <span style={{ fontSize: 11, color: "var(--text3)" }}>
                    · {formatPoDisplay(f.poNumber)}
                  </span>
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="badge b-cancel">
                    {failureSeverityLabel(f.severity)}
                  </span>
                  <span className="badge b-cancel">
                    {failureStatusLabel(f.status)}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text3)" }}>
                    <bdi dir="ltr" className="po-property-detail-ltr-val">
                      {formatDateAr(f.updatedAt.slice(0, 10))}
                    </bdi>
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                {displayTitle}
              </div>
              {f.internalNote ? (
                <div
                  style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}
                >
                  <strong>ملاحظات:</strong> {f.internalNote}
                </div>
              ) : null}
              {f.finalNote ? (
                <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>
                  <strong>قرار المشرف:</strong> {f.finalNote}
                </div>
              ) : null}
              {f.resolutionReason ? (
                <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>
                  <strong>سبب الحل:</strong> {f.resolutionReason}
                  {f.continueInstructions ? (
                    <>
                      <br />
                      <strong>توجيه استمرار العمل:</strong>{" "}
                      {f.continueInstructions}
                    </>
                  ) : null}
                </div>
              ) : null}
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 5 }}>
                الرافع: {f.raisedByRole || "—"} · الأخصائي: {f.specialist}
                {f.status === "review" ? (
                  <>
                    {" "}
                    · أخصائي الإسناد:{" "}
                    {assignmentSpecialistByPo.get(f.poNumber.trim()) || "—"}
                  </>
                ) : null}
              </div>
              {f.propertyId ? (
                <div style={{ marginTop: 8 }}>
                  <Link
                    href={poPropertyPath(f.poNumber, f.propertyId)}
                    className="btn btn-sm"
                  >
                    عرض العقار
                  </Link>
                </div>
              ) : null}

              {canSpecialistAct ? (
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  {f.severity === "suspected" ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-accent"
                      onClick={() => handleUpgrade(f.id)}
                    >
                      تأكيد تعذر داخلي
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => handleSubmit(f.id)}
                    >
                      تصعيد على المشرف
                    </button>
                  )}
                  {canResolve ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-success"
                      onClick={() => toggleResolve(f.id)}
                    >
                      {resolveOpen[f.id] ? "إلغاء الحل" : "تم الحل"}
                    </button>
                  ) : null}
                </div>
              ) : null}

              {canSupervisorAct ? (
                <div style={{ marginTop: 10 }}>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="ملاحظة الاعتماد أو الإعادة"
                    value={supervisorNote[f.id] ?? ""}
                    onChange={(e) =>
                      setSupervisorNote((n) => ({
                        ...n,
                        [f.id]: e.target.value,
                      }))
                    }
                    style={{ width: "100%", marginBottom: 8, fontSize: 12 }}
                  />
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-sm btn-success"
                      onClick={() => handleApprove(f.id)}
                    >
                      اعتماد التعذر
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => handleReturn(f.id)}
                    >
                      إعادة للأخصائي
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-accent"
                      onClick={() => void handleSuspend(f.id)}
                    >
                      تعليق المعاملة
                    </button>
                  </div>
                </div>
              ) : null}

              {resolveOpen[f.id] && canResolve && !canSupervisorAct ? (
                <div
                  style={{
                    marginTop: 10,
                    padding: 12,
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    background: "#FAFBFC",
                  }}
                >
                  <div className="reg-fg-full" style={{ marginBottom: 8 }}>
                    <label className="reg-fl" htmlFor={`resolve_reason_${f.id}`}>
                      سبب الحل *
                    </label>
                    <textarea
                      id={`resolve_reason_${f.id}`}
                      className="form-control"
                      rows={2}
                      value={draft.reason}
                      onChange={(e) =>
                        patchResolveDraft(f.id, { reason: e.target.value })
                      }
                      style={{ width: "100%", fontSize: 12 }}
                    />
                  </div>
                  <div className="reg-fg-full" style={{ marginBottom: 8 }}>
                    <label
                      className="reg-fl"
                      htmlFor={`resolve_instructions_${f.id}`}
                    >
                      توجيه استمرار العمل *
                    </label>
                    <textarea
                      id={`resolve_instructions_${f.id}`}
                      className="form-control"
                      rows={2}
                      value={draft.instructions}
                      onChange={(e) =>
                        patchResolveDraft(f.id, {
                          instructions: e.target.value,
                        })
                      }
                      style={{ width: "100%", fontSize: 12 }}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-success"
                    disabled={
                      !draft.reason.trim() || !draft.instructions.trim()
                    }
                    onClick={() => handleResolve(f.id)}
                  >
                    تأكيد الحل وإغلاق التعذر
                  </button>
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </>
  );
}
