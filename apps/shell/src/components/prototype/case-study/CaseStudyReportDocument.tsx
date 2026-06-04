import { CaseStudyApprovalSection } from "@/components/prototype/case-study/CaseStudyApprovalSection";
import type { CaseStudyReportModel } from "@/lib/prototype/case-study-report-model";

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
      <header className="cs-report-header">
        <div className="cs-report-header-main">
          <div className="cs-report-brand">
            <span className="cs-report-brand-mark" aria-hidden>
              إ
            </span>
            <div>
              <h1 className="cs-report-title">{model.title}</h1>
              <p className="cs-report-subtitle">{model.providerName}</p>
            </div>
          </div>
        </div>
        <table className="cs-report-meta-table">
          <tbody>
            <tr>
              <th>اسم مزود الخدمة</th>
              <td>{model.providerName}</td>
              <th>رقم الطلب</th>
              <td>{model.requestNumber}</td>
            </tr>
            <tr>
              <th>تاريخ الطلب</th>
              <td>{model.requestDate}</td>
              <th>رقم الصك</th>
              <td>{model.deedNumber}</td>
            </tr>
            {model.propertyLocation || model.propertyType ? (
              <tr>
                {model.propertyLocation ? (
                  <>
                    <th>الموقع</th>
                    <td>{model.propertyLocation}</td>
                  </>
                ) : (
                  <>
                    <th />
                    <td />
                  </>
                )}
                {model.propertyType ? (
                  <>
                    <th>نوع العقار</th>
                    <td>{model.propertyType}</td>
                  </>
                ) : (
                  <>
                    <th />
                    <td />
                  </>
                )}
              </tr>
            ) : null}
            {model.assignmentSpecialist && model.assignmentSpecialist !== "—" ? (
              <tr>
                <th>أخصائي الإسناد</th>
                <td colSpan={3}>{model.assignmentSpecialist}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </header>

      {model.sections.map((section) => (
        <section key={section.id} className="cs-report-section">
          <h2 className="cs-report-section-title">{section.title}</h2>
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
        </section>
      ))}

      <section className="cs-report-section cs-report-section--approval">
        <h2 className="cs-report-section-title">الاعتماد والتوقيع</h2>
        <CaseStudyApprovalSection approval={model.approval} variant="report" />
      </section>
    </article>
  );
}
