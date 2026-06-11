"use client";

import {
  EmptyState,
  FieldBox,
  FieldsGrid,
  SectionDivider,
  SectionHeader,
} from "./PropertyDetailFields";
import type { PropertyDetailPartySubmission } from "../../lib/prototype/property-detail-party-submissions";
import type { PropertyDetailPartyCard } from "../../lib/prototype/property-detail-parties";

export function PartyRoleDetailPanel({
  card,
  submission,
  loading,
}: {
  card: PropertyDetailPartyCard;
  submission: PropertyDetailPartySubmission | null;
  loading: boolean;
}) {
  return (
    <div
      className="pd-party-detail"
      role="region"
      aria-label={`بيانات ${card.role}`}
    >
      <SectionHeader>
        بيانات {card.role}
        {card.name && !card.unassigned ? (
          <span className="pd-party-detail-assignee"> — {card.name}</span>
        ) : null}
      </SectionHeader>

      {loading ? (
        <p className="pd-party-detail-loading">جاري التحميل…</p>
      ) : !submission || !submission.hasData ? (
        <EmptyState
          icon="📋"
          title={submission?.emptyReason ?? "لم يُقدَّم بعد"}
          sub={
            card.unassigned
              ? "لم يُعيَّن طرف لهذا الدور بعد."
              : "سيظهر هنا ما يقدّمه الطرف عند إكمال عمله."
          }
        />
      ) : (
        <>
          {submission.fields.length > 0 ? (
            <FieldsGrid>
              {submission.fields.map((field) => (
                <FieldBox
                  key={field.label}
                  label={field.label}
                  value={field.value}
                  ltr={field.ltr}
                />
              ))}
            </FieldsGrid>
          ) : null}

          {submission.remarks.length > 0 ? (
            <>
              <SectionDivider />
              <SectionHeader>ملاحظات</SectionHeader>
              <FieldsGrid cols={2}>
                {submission.remarks.map((remark) => (
                  <FieldBox
                    key={remark.label}
                    label={remark.label}
                    value={remark.value}
                    span={2}
                  />
                ))}
              </FieldsGrid>
            </>
          ) : null}

          {submission.answers.length > 0 ? (
            <>
              <SectionDivider />
              <SectionHeader>الإجابات المقدّمة</SectionHeader>
              <div className="pd-party-answers">
                {submission.answers.map((row, index) => (
                  <div
                    key={`${row.question}-${index}`}
                    className="pd-party-answer-row"
                  >
                    <div className="pd-party-answer-q">{row.question}</div>
                    <div className="pd-party-answer-a">{row.answer}</div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
