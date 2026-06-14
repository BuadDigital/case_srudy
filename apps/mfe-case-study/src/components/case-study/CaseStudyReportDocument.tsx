import type { CaseStudyReportModel } from "../../lib/prototype/case-study-report-model";

type Props = {
  model: CaseStudyReportModel;
  id?: string;
  className?: string;
};

function ReportMark({ checked }: { checked: boolean }) {
  return (
    <span className={`cs-report-mark${checked ? " checked" : ""}`}>
      {checked ? "✓" : ""}
    </span>
  );
}

export function CaseStudyReportDocument({ model, id, className }: Props) {
  return (
    <article
      id={id}
      className={`cs-report-doc${className ? ` ${className}` : ""}`}
      dir="rtl"
      lang="ar"
    >
      {model.sections.map((section) => (
        <details key={section.id} className="cs-report-section" open>
          <summary className="cs-report-section-title">{section.title}</summary>
          <div className="cs-report-section-body">
            <table className="cs-report-table">
              <thead>
                <tr>
                  <th>الأسئلة</th>
                  <th className="center">{section.colAHeader}</th>
                  <th className="center">{section.colBHeader}</th>
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row, i) => (
                  <tr key={`${section.id}-${i}`}>
                    <td className="question">{row.question}</td>
                    <td className="center">
                      <ReportMark checked={row.markA} />
                    </td>
                    <td className="center">
                      <ReportMark checked={row.markB} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {section.extras?.map((line) => (
              <p key={line} className="cs-report-extra-line">
                {line}
              </p>
            ))}
            {section.remarks ? (
              <div className="cs-report-remarks">
                <span className="cs-report-remarks-label">ملاحظات:</span>
                <p>{section.remarks}</p>
              </div>
            ) : null}
          </div>
        </details>
      ))}
    </article>
  );
}
