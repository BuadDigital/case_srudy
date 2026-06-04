import {
  CASE_STUDY_SIGNATURE_IMAGE,
  CASE_STUDY_STAMP_IMAGE,
} from "@/lib/prototype/case-study-form-data";
import type { CaseStudyReportModel } from "@/lib/prototype/case-study-report-model";

export type CaseStudyReportPrintOptions = {
  /** Site origin for absolute image URLs in the print window (e.g. https://localhost:3000). */
  origin?: string;
};

const PRINT_CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: "IBM Plex Sans Arabic", "Segoe UI", Tahoma, sans-serif;
  font-size: 11px;
  color: #1a2b3c;
  background: #fff;
  direction: rtl;
  padding: 16px 20px;
}
.cs-report-doc { max-width: 800px; margin: 0 auto; }
.cs-report-header { border: 1px solid #b8cde0; margin-bottom: 14px; }
.cs-report-brand { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: #0f3460; color: #fff; }
.cs-report-brand-mark { width: 32px; height: 32px; border-radius: 8px; background: #1abc9c; display: flex; align-items: center; justify-content: center; font-weight: 700; }
.cs-report-title { font-size: 15px; font-weight: 700; }
.cs-report-subtitle { font-size: 10px; opacity: 0.75; margin-top: 2px; }
.cs-report-meta-table { width: 100%; border-collapse: collapse; }
.cs-report-meta-table th, .cs-report-meta-table td { border: 1px solid #d5e3f0; padding: 6px 10px; font-size: 10px; text-align: right; }
.cs-report-meta-table th { background: #eef3f9; color: #4a6272; width: 18%; font-weight: 600; }
.cs-report-section { margin-bottom: 12px; page-break-inside: avoid; }
.cs-report-section-title { font-size: 12px; font-weight: 700; color: #fff; background: #0f3460; padding: 7px 12px; margin-bottom: 0; }
.cs-report-table { width: 100%; border-collapse: collapse; border: 1px solid #d5e3f0; border-top: none; }
.cs-report-table th, .cs-report-table td { border-bottom: 1px solid #d5e3f0; padding: 6px 10px; vertical-align: middle; }
.cs-report-table th { background: #eef3f9; color: #4a6272; font-size: 10px; text-align: right; }
.cs-report-table th.center, .cs-report-table td.center { text-align: center; width: 90px; }
.cs-report-table td.question { line-height: 1.45; }
.cs-report-mark { display: inline-flex; width: 18px; height: 18px; align-items: center; justify-content: center; border: 1.5px solid #b8cde0; border-radius: 3px; font-size: 11px; font-weight: 700; }
.cs-report-mark.checked { background: #0f3460; border-color: #0f3460; color: #fff; }
.cs-report-extra-line { padding: 6px 12px; border: 1px solid #d5e3f0; border-top: none; background: #f7f9fc; font-size: 10px; }
.cs-report-remarks { padding: 8px 12px; border: 1px solid #d5e3f0; border-top: none; background: #fef3d7; font-size: 10px; line-height: 1.5; }
.cs-report-remarks-label { font-weight: 700; display: block; margin-bottom: 4px; color: #784212; }
.cs-report-section--approval { page-break-inside: avoid; }
.cs-report-approval .note { padding: 8px 12px; background: #d6eaf8; border-right: 3px solid #2980b9; margin-bottom: 10px; line-height: 1.55; font-size: 10px; color: #1a5276; }
.cs-form-sig-table { width: 100%; border-collapse: collapse; }
.cs-form-sig-table th, .cs-form-sig-table td { border: 1px solid #d5e3f0; padding: 10px 8px; text-align: center; font-size: 10px; }
.cs-form-sig-table th { background: #eef3f9; color: #4a6272; }
.cs-form-sig-value { font-weight: 600; }
.cs-form-sig-img { display: block; margin: 0 auto; object-fit: contain; }
.cs-form-sig-img--signature { max-width: 110px; max-height: 52px; }
.cs-form-sig-img--stamp { max-width: 88px; max-height: 88px; }
@media print {
  body { padding: 0; }
  .cs-report-section { page-break-inside: avoid; }
}
`;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMark(checked: boolean): string {
  return `<span class="cs-report-mark${checked ? " checked" : ""}">${checked ? "✓" : ""}</span>`;
}

function assetUrl(path: string, origin?: string): string {
  if (!origin) return path;
  return `${origin.replace(/\/$/, "")}${path}`;
}

export function buildCaseStudyReportPrintHtml(
  model: CaseStudyReportModel,
  options?: CaseStudyReportPrintOptions,
): string {
  const origin = options?.origin;
  const signatureSrc = assetUrl(CASE_STUDY_SIGNATURE_IMAGE, origin);
  const stampSrc = assetUrl(CASE_STUDY_STAMP_IMAGE, origin);
  const sectionsHtml = model.sections
    .map((section) => {
      const rows = section.rows
        .map(
          (row) => `<tr>
            <td class="question">${escapeHtml(row.question)}</td>
            <td class="center">${renderMark(row.markA)}</td>
            <td class="center">${renderMark(row.markB)}</td>
          </tr>`,
        )
        .join("");
      const extras = (section.extras ?? [])
        .map((line) => `<p class="cs-report-extra-line">${escapeHtml(line)}</p>`)
        .join("");
      const remarks = section.remarks
        ? `<div class="cs-report-remarks"><span class="cs-report-remarks-label">ملاحظات:</span><p>${escapeHtml(section.remarks)}</p></div>`
        : "";
      return `<section class="cs-report-section">
        <h2 class="cs-report-section-title">${escapeHtml(section.title)}</h2>
        <table class="cs-report-table">
          <thead><tr>
            <th>الأسئلة</th>
            <th class="center">${escapeHtml(section.colAHeader)}</th>
            <th class="center">${escapeHtml(section.colBHeader)}</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        ${extras}${remarks}
      </section>`;
    })
    .join("");

  const locationRow =
    model.propertyLocation || model.propertyType
      ? `<tr>
          ${model.propertyLocation ? `<th>الموقع</th><td>${escapeHtml(model.propertyLocation)}</td>` : "<th></th><td></td>"}
          ${model.propertyType ? `<th>نوع العقار</th><td>${escapeHtml(model.propertyType)}</td>` : "<th></th><td></td>"}
        </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(model.title)} — ${escapeHtml(model.deedNumber)}</title>
<style>${PRINT_CSS}</style>
</head>
<body>
<article class="cs-report-doc">
  <header class="cs-report-header">
    <div class="cs-report-brand">
      <span class="cs-report-brand-mark">إ</span>
      <div>
        <h1 class="cs-report-title">${escapeHtml(model.title)}</h1>
        <p class="cs-report-subtitle">${escapeHtml(model.providerName)}</p>
      </div>
    </div>
    <table class="cs-report-meta-table">
      <tbody>
        <tr>
          <th>اسم مزود الخدمة</th><td>${escapeHtml(model.providerName)}</td>
          <th>رقم الطلب</th><td>${escapeHtml(model.requestNumber)}</td>
        </tr>
        <tr>
          <th>تاريخ الطلب</th><td>${escapeHtml(model.requestDate)}</td>
          <th>رقم الصك</th><td>${escapeHtml(model.deedNumber)}</td>
        </tr>
        ${locationRow}
        ${
          model.assignmentSpecialist && model.assignmentSpecialist !== "—"
            ? `<tr>
          <th>أخصائي الإسناد</th><td colspan="3">${escapeHtml(model.assignmentSpecialist)}</td>
        </tr>`
            : ""
        }
      </tbody>
    </table>
  </header>
  ${sectionsHtml}
  <section class="cs-report-section cs-report-section--approval">
    <h2 class="cs-report-section-title">الاعتماد والتوقيع</h2>
    <div class="cs-report-approval">
      <p class="note">${escapeHtml(model.approval.declarationText)}</p>
      <table class="cs-form-sig-table">
        <thead><tr>
          <th>رقم الصك</th><th>معتمد التقرير</th><th>التاريخ</th><th>التوقيع</th><th>ختم الشركة</th>
        </tr></thead>
        <tbody><tr>
          <td><span class="cs-form-sig-value">${escapeHtml(model.approval.deedNumber)}</span></td>
          <td><span class="cs-form-sig-value">${escapeHtml(model.approval.approverName)}</span></td>
          <td><span class="cs-form-sig-value">${escapeHtml(model.approval.reportDate)}</span></td>
          <td><img class="cs-form-sig-img cs-form-sig-img--signature" src="${escapeHtml(signatureSrc)}" alt="توقيع معتمد التقرير" /></td>
          <td><img class="cs-form-sig-img cs-form-sig-img--stamp" src="${escapeHtml(stampSrc)}" alt="ختم الشركة" /></td>
        </tr></tbody>
      </table>
    </div>
  </section>
</article>
<script>window.onload=function(){window.print();};</script>
</body>
</html>`;
}
