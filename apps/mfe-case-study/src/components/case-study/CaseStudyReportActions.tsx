"use client";

import { useCallback, useEffect, useState } from "react";
import { CaseStudyReportDocument } from "./CaseStudyReportDocument";
import { buildCaseStudyReportPrintHtml } from "../../lib/prototype/case-study-report-html";
import type { CaseStudyReportModel } from "../../lib/prototype/case-study-report-model";

type Props = {
  model: CaseStudyReportModel;
};

export function CaseStudyReportActions({ model }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewOpen]);

  const printFromPreview = useCallback(() => {
    window.print();
  }, []);

  const openPrintWindow = useCallback(() => {
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) {
      window.alert("تعذّر فتح نافذة الطباعة — تحقق من إعدادات المنبثقات.");
      return;
    }
    w.document.open();
    w.document.write(
      buildCaseStudyReportPrintHtml(model, { origin: window.location.origin }),
    );
    w.document.close();
    w.focus();
  }, [model]);

  return (
    <>
      <div className="cs-form-report-actions">
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => setPreviewOpen(true)}
        >
          معاينة التقرير
        </button>
        <button type="button" className="btn btn-primary" onClick={openPrintWindow}>
          تحميل التقرير
        </button>
      </div>

      {previewOpen ? (
        <div
          className="cs-report-preview-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="معاينة تقرير دراسة الحالة"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="cs-report-preview-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cs-report-preview-toolbar no-print">
              <span className="cs-report-preview-title">معاينة التقرير النهائي</span>
              <div className="cs-report-preview-buttons">
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={printFromPreview}
                >
                  طباعة / PDF
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setPreviewOpen(false)}
                >
                  إغلاق
                </button>
              </div>
            </div>
            <div className="cs-report-preview-scroll">
              <CaseStudyReportDocument model={model} id="cs-report-print-root" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
