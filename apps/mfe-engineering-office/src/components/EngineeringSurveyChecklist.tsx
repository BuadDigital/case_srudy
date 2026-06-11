"use client";

import { ENGINEERING_SURVEY_CHECKLIST_ITEMS } from "../lib/engineering-survey-data";
import type { EngineeringSurveyChecklistRow } from "../lib/engineering-survey-data";
import { patchChecklistRow } from "../lib/engineering-survey-submission-storage";

export function EngineeringSurveyChecklist({
  rows,
  disabled,
  onChange,
}: {
  rows: EngineeringSurveyChecklistRow[];
  disabled?: boolean;
  onChange: (rows: EngineeringSurveyChecklistRow[]) => void;
}) {
  return (
    <div className="eng-office-checklist-wrap">
      <table className="tbl eng-office-q-table">
        <thead>
          <tr>
            <th className="eng-office-q-num">#</th>
            <th>البند</th>
            <th className="eng-office-q-yn">نعم / لا</th>
            <th className="eng-office-q-note">ملاحظة</th>
          </tr>
        </thead>
        <tbody>
          {ENGINEERING_SURVEY_CHECKLIST_ITEMS.map((label, index) => {
            const row = rows[index] ?? { answer: null, note: "" };
            return (
              <tr key={label}>
                <td className="eng-office-q-num">{index + 1}</td>
                <td className="eng-office-q-text">{label}</td>
                <td>
                  <div className="eng-office-q-radios">
                    {(["yes", "no"] as const).map((value) => (
                      <label key={value} className="eng-office-q-radio">
                        <input
                          type="radio"
                          name={`eng-q-${index}`}
                          checked={row.answer === value}
                          disabled={disabled}
                          onChange={() =>
                            onChange(
                              patchChecklistRow(rows, index, { answer: value }),
                            )
                          }
                        />
                        {value === "yes" ? "نعم" : "لا"}
                      </label>
                    ))}
                  </div>
                </td>
                <td>
                  <textarea
                    className="eng-office-q-textarea"
                    rows={2}
                    disabled={disabled}
                    value={row.note}
                    onChange={(e) =>
                      onChange(
                        patchChecklistRow(rows, index, { note: e.target.value }),
                      )
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
