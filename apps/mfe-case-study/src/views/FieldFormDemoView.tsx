"use client";

import { useState } from "react";
import { createFieldInspectionDraft } from "../lib/prototype/field-inspection-data";
import { FieldFormView } from "./FieldFormView";

/** Standalone demo route (`/field-form`) — local state only, no task/API wiring. */
export function FieldFormDemoView() {
  const [draft, setDraft] = useState(() =>
    createFieldInspectionDraft({
      taskId: "demo",
      propertyId: "demo-property",
      poNumber: "PO-DEMO",
      propertyDisplayId: "E-4402",
    }),
  );

  return (
    <FieldFormView
      value={draft}
      onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
      onSaveDraft={() => {
        setDraft((prev) => ({
          ...prev,
          updatedAtUtc: new Date().toISOString(),
        }));
      }}
      onSubmit={() => {
        setDraft((prev) => ({
          ...prev,
          status: "submitted",
          submittedAtUtc: new Date().toISOString(),
          updatedAtUtc: new Date().toISOString(),
        }));
      }}
    />
  );
}
