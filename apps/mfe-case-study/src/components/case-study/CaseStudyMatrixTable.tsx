"use client";

import {
  CASE_STUDY_SECTION_QUESTIONS,
  caseStudyAnswerKey,
  type CaseStudyFormAnswer,
  type CaseStudyQuestionSection,
} from "../../lib/prototype/case-study-form-data";
import type { PartyQuestionContribution } from "../../lib/prototype/case-study-party-answers";
import {
  answerToYn,
  contributionsToPartyAnswers,
  getMatrixConsensus,
  getMatrixRowStatus,
  PARTY_MATRIX_ORDER,
  PARTY_MATRIX_SHORT,
  type MatrixYn,
  ynToAnswer,
} from "./case-study-matrix-utils";

function IconCheck({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconX({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconAlert({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconInfo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 10v6M12 7h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconFile({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconCheckCheck({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 12l4 4L18 6M10 12l2 2"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PartyBadge({ short, value }: { short: string; value: MatrixYn }) {
  const label = value === "Y" ? "نعم" : "لا";
  return (
    <span className={`cs-matrix-party-badge cs-matrix-party-badge--${value.toLowerCase()}`}>
      <span className="cs-matrix-party-badge-name">{short}</span>
      <span className="cs-matrix-party-badge-val" aria-hidden="true">
        {value === "Y" ? <IconCheck size={11} /> : <IconX size={11} />}
      </span>
      <span className="cs-matrix-party-badge-label">{label}</span>
    </span>
  );
}

function OfficialAnswerCell({
  value,
  target,
  disabled,
  onPick,
  showAdopt,
  onAdopt,
}: {
  value: MatrixYn | null;
  target: MatrixYn;
  disabled?: boolean;
  onPick: (next: MatrixYn | null) => void;
  showAdopt?: boolean;
  onAdopt?: () => void;
}) {
  const on = value === target;
  const adoptLabel =
    target === "Y" ? "اعتماد إجابة الأطراف (نعم)" : "اعتماد إجابة الأطراف (لا)";

  return (
    <div className="cs-matrix-official-cell">
      <button
        type="button"
        className={`cs-matrix-official-cb cs-matrix-official-cb--${target.toLowerCase()}${on ? " checked" : ""}${disabled ? " cs-matrix-official-cb--locked" : ""}`}
        aria-pressed={on}
        aria-label={target === "Y" ? "نعم" : "لا"}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          onPick(on ? null : target);
        }}
      >
        {on ? (target === "Y" ? <IconCheck size={13} /> : <IconX size={13} />) : null}
      </button>
      {showAdopt && onAdopt ? (
        <button
          type="button"
          className="cs-matrix-adopt-pill"
          onClick={onAdopt}
        >
          <IconCheck size={11} />
          {adoptLabel}
        </button>
      ) : null}
    </div>
  );
}

export function CaseStudyMatrixTable({
  section,
  sectionTitle,
  sectionIndex,
  sectionTotal,
  answers,
  onAnswer,
  canEditKey,
  visibleKey,
  partyByKey,
  showPartyColumn = true,
  partyContribCount = 0,
  onRefreshParty,
}: {
  section: CaseStudyQuestionSection;
  sectionTitle: string;
  sectionIndex: number;
  sectionTotal: number;
  answers: Record<string, CaseStudyFormAnswer | null>;
  onAnswer: (key: string, value: CaseStudyFormAnswer | null) => void;
  canEditKey?: (key: string) => boolean;
  visibleKey?: (key: string) => boolean;
  partyByKey?: Record<string, PartyQuestionContribution[]>;
  showPartyColumn?: boolean;
  partyContribCount?: number;
  onRefreshParty?: () => void;
}) {
  const questions = CASE_STUDY_SECTION_QUESTIONS[section];
  const visibleRows = questions
    .map((q, i) => ({ q, i, key: caseStudyAnswerKey(section, i) }))
    .filter((row) => (visibleKey ? visibleKey(row.key) : true));

  if (visibleRows.length === 0) {
    return (
      <p className="po-properties-hint">
        لا توجد أسئلة مسندة لدورك في هذا القسم.
      </p>
    );
  }

  return (
    <div className="cs-matrix">
      <div className="cs-matrix-card-hd">
        <span className="cs-matrix-card-icon" aria-hidden="true">
          <IconFile />
        </span>
        <h3 className="cs-matrix-card-title">{sectionTitle}</h3>
        <span className="cs-matrix-card-meta">
          {visibleRows.length} سؤالاً · القسم {sectionIndex} من {sectionTotal}
        </span>
      </div>

      {showPartyColumn ? (
        <>
          <div className="cs-matrix-info">
            <IconInfo />
            <p>
              <strong>مسؤولية الأخصائي:</strong> راجِع إجابات الأطراف الظاهرة لكل
              سؤال (للاستدلال فقط)، ثم حدِّد <strong>الإجابة المعتمدة</strong>{" "}
              الرسمية. إجابات الأطراف للقراءة فقط، والأعمدة المعتمدة وحدها قابلة
              للتعديل.
            </p>
            {partyContribCount > 0 && onRefreshParty ? (
              <button
                type="button"
                className="btn btn-sm cs-matrix-refresh-btn"
                onClick={onRefreshParty}
              >
                تحديث إجابات الأطراف ({partyContribCount})
              </button>
            ) : null}
          </div>

          <div className="cs-matrix-legend">
            <span>
              <i className="cs-matrix-legend-swatch cs-matrix-legend-swatch--yes" />
              نعم / مطابق
            </span>
            <span>
              <i className="cs-matrix-legend-swatch cs-matrix-legend-swatch--no" />
              لا / غير مطابق
            </span>
            <span>
              <IconCheckCheck size={13} /> اتفاق الأطراف
            </span>
            <span>
              <IconAlert size={12} /> تعارض
            </span>
          </div>
        </>
      ) : null}

      <div className="cs-matrix-table-wrap">
        <table className="cs-matrix-table">
          <colgroup>
            <col className="cs-matrix-col-question" />
            {showPartyColumn ? <col className="cs-matrix-col-parties" /> : null}
            <col className="cs-matrix-col-official" />
            <col className="cs-matrix-col-official" />
          </colgroup>
          <thead>
            <tr>
              <th className="cs-matrix-th-question">السؤال</th>
              {showPartyColumn ? (
                <th className="cs-matrix-th-parties">
                  إجابات الأطراف{" "}
                  <span className="cs-matrix-th-muted">(استدلال)</span>
                </th>
              ) : null}
              <th className="cs-matrix-th-official">نعم</th>
              <th className="cs-matrix-th-official">لا</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(({ q, key }, index) => {
              const official = answerToYn(answers[key]);
              const editable = canEditKey ? canEditKey(key) : true;
              const partyAnswers = showPartyColumn
                ? contributionsToPartyAnswers(partyByKey?.[key] ?? [])
                : {};
              const status = showPartyColumn
                ? getMatrixRowStatus(partyAnswers)
                : "pending";
              const consensus = showPartyColumn
                ? getMatrixConsensus(partyAnswers)
                : null;
              const hasPartyAnswers = Object.keys(partyAnswers).length > 0;
              const rowClass = [
                status === "conflict" ? "cs-matrix-row--conflict" : "",
                status === "pending" && showPartyColumn
                  ? "cs-matrix-row--pending"
                  : "",
              ]
                .filter(Boolean)
                .join(" ");

              const setOfficial = (next: MatrixYn | null) => {
                onAnswer(key, ynToAnswer(next));
              };

              return (
                <tr key={key} className={rowClass || undefined}>
                  <td className="cs-matrix-td-question">
                    <span className="cs-matrix-q-num">{index + 1}.</span>
                    <span className="cs-matrix-q-text">{q}</span>
                    {showPartyColumn && status === "conflict" ? (
                      <span className="cs-matrix-row-tag cs-matrix-row-tag--conflict">
                        <IconAlert size={9} /> تعارض
                      </span>
                    ) : null}
                    {showPartyColumn && status === "pending" ? (
                      <span className="cs-matrix-row-tag cs-matrix-row-tag--pending">
                        بانتظار إجابة
                      </span>
                    ) : null}
                  </td>

                  {showPartyColumn ? (
                    <td className="cs-matrix-td-parties">
                      {hasPartyAnswers ? (
                        <div className="cs-matrix-party-badges">
                          {PARTY_MATRIX_ORDER.filter((k) => partyAnswers[k]).map(
                            (k) => (
                              <PartyBadge
                                key={k}
                                short={PARTY_MATRIX_SHORT[k]}
                                value={partyAnswers[k]!}
                              />
                            ),
                          )}
                        </div>
                      ) : (
                        <span className="cs-matrix-no-party">
                          — لم يُسجَّل أي طرف إجابة بعد —
                        </span>
                      )}
                    </td>
                  ) : null}

                  <td className="cs-matrix-td-official">
                    <OfficialAnswerCell
                      value={official}
                      target="Y"
                      disabled={!editable}
                      onPick={setOfficial}
                      showAdopt={
                        showPartyColumn &&
                        status === "consensus" &&
                        consensus === "Y" &&
                        official !== "Y"
                      }
                      onAdopt={() => setOfficial("Y")}
                    />
                  </td>
                  <td className="cs-matrix-td-official">
                    <OfficialAnswerCell
                      value={official}
                      target="N"
                      disabled={!editable}
                      onPick={setOfficial}
                      showAdopt={
                        showPartyColumn &&
                        status === "consensus" &&
                        consensus === "N" &&
                        official !== "N"
                      }
                      onAdopt={() => setOfficial("N")}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
