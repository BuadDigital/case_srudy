"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { prototypeKeys } from "@platform/app-shared/query/prototype-keys";
import { failureProblemTypeLabel } from "../../lib/failure-types-data";
import { createFailure } from "../../lib/failures-repository";
import {
  failureSeverityLabel,
  failureStatusLabel,
} from "../../lib/failures-local-storage";
import type { FailureSeverity } from "../../lib/failures-types";
import { isActiveFailureStatus } from "../../lib/failures-types";
import { useFailuresQuery } from "../../query/failures-queries";
import { FailureRaiseFields } from "./FailureRaiseFields";

/** §2 — رفع تعذر من واجهة الطرف (معاين، مقيم، …). */
export function FailureRaisePanel({
  poNumber,
  propertyId,
  deedNumber,
  specialist,
  raisedByRole,
  onSubmitted,
}: {
  poNumber: string;
  propertyId: string;
  deedNumber: string;
  specialist: string;
  raisedByRole: string;
  onSubmitted?: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: failures = [] } = useFailuresQuery();
  const [open, setOpen] = useState(false);
  const [severity, setSeverity] = useState<FailureSeverity>("internal");
  const [problemTypeId, setProblemTypeId] = useState("");
  const [note, setNote] = useState("");

  const activeFailure = useMemo(
    () =>
      failures.find(
        (f) =>
          f.poNumber === poNumber &&
          f.propertyId === propertyId &&
          isActiveFailureStatus(f.status),
      ) ?? null,
    [failures, poNumber, propertyId],
  );

  function handleSubmit() {
    if (!problemTypeId || activeFailure) return;
    void createFailure({
      poNumber,
      propertyId,
      deedNumber,
      problemTypeId,
      severity,
      raisedByRole,
      internalNote: note,
      specialist,
    }).then(() => {
      void queryClient.invalidateQueries({ queryKey: prototypeKeys.failures() });
      setOpen(false);
      setProblemTypeId("");
      setNote("");
      onSubmitted?.();
    });
  }

  if (activeFailure && !open) {
    const title = failureProblemTypeLabel(
      activeFailure.problemTypeId,
      activeFailure.title,
    );
    return (
      <FailureCard>
        <div className="note note-warn" style={{ marginBottom: 0 }}>
          <strong>تعذر مسجّل على هذا العقار:</strong> {title}
          <div style={{ fontSize: 12, marginTop: 6, color: "var(--text2)" }}>
            {failureSeverityLabel(activeFailure.severity)} ·{" "}
            {failureStatusLabel(activeFailure.status)}
          </div>
          <div style={{ marginTop: 10 }}>
            <Link href="/failures" className="btn btn-sm">
              إدارة التعذرات
            </Link>
          </div>
        </div>
      </FailureCard>
    );
  }

  return (
    <FailureCard>
      {!open ? (
        <button
          type="button"
          className="btn btn-danger-outline btn-sm"
          onClick={() => setOpen(true)}
        >
          تسجيل تعذر على العقار
        </button>
      ) : (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600 }}>رفع تعذر</span>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setOpen(false)}
            >
              إلغاء
            </button>
          </div>
          <FailureRaiseFields
            idPrefix={`raise-${propertyId}`}
            severity={severity}
            onSeverityChange={setSeverity}
            problemTypeId={problemTypeId}
            onProblemTypeIdChange={setProblemTypeId}
            note={note}
            onNoteChange={setNote}
          />
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!problemTypeId}
            onClick={handleSubmit}
          >
            {severity === "internal" ? "حفظ تعذر داخلي" : "تسجيل احتمال تعذر"}
          </button>
        </div>
      )}
    </FailureCard>
  );
}

function FailureCard({ children }: { children: ReactNode }) {
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-header">
        <span className="card-title">التعذرات</span>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}
