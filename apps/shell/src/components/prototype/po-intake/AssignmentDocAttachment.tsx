"use client";

/* data: URLs from local file cache — next/image does not apply */
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import {
  getCachedAssignmentDoc,
  isImageMime,
  type CachedAssignmentDoc,
} from "@/lib/prototype/assignment-doc-attachments";

export function AssignmentDocAttachment({
  poNumber,
  propertyId,
  fileName,
  variant = "detail",
}: {
  poNumber: string;
  propertyId: string;
  fileName?: string;
  variant?: "inline" | "detail" | "thumb" | "card" | "panel";
}) {
  const cached = useMemo(
    () => getCachedAssignmentDoc(poNumber, propertyId),
    [poNumber, propertyId],
  );

  const displayName = fileName?.trim() || cached?.fileName || "";
  if (!displayName) {
    return <span className="po-attach-missing">غير مرفق</span>;
  }

  const doc: CachedAssignmentDoc = {
    fileName: displayName,
    mimeType: cached?.mimeType ?? guessMime(displayName),
    dataUrl: cached?.dataUrl,
  };

  return (
    <div
      className={`po-attach${variant === "thumb" ? " po-attach--thumb" : ""}${variant === "detail" ? " po-attach--detail" : ""}${variant === "card" ? " po-attach--card" : ""}${variant === "panel" ? " po-attach--panel" : ""}`}
    >
      <AttachmentPreview doc={doc} variant={variant} />
      <div className="po-attach-meta">
        <span className="po-attach-name" title={doc.fileName}>
          {doc.fileName}
        </span>
        {doc.dataUrl && isImageMime(doc.mimeType) ? (
          <span className="po-attach-note">اضغط على الصورة للتكبير</span>
        ) : null}
        {!doc.dataUrl && isImageMime(doc.mimeType) ? (
          <span className="po-attach-note">
            المعاينة غير متوفرة — أعد الرفع من نفس المتصفح
          </span>
        ) : null}
        {!doc.dataUrl && !isImageMime(doc.mimeType) ? (
          <span className="po-attach-note">
            مستند PDF — يُخزَّن اسم الملف فقط في النموذج الأولي
          </span>
        ) : null}
      </div>
    </div>
  );
}

function AttachmentPreview({
  doc,
  variant,
}: {
  doc: CachedAssignmentDoc;
  variant: "inline" | "detail" | "thumb" | "card" | "panel";
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (doc.dataUrl && isImageMime(doc.mimeType)) {
    const imgClass =
      variant === "thumb"
        ? "po-attach-img po-attach-img--thumb"
        : variant === "card"
          ? "po-attach-img po-attach-img--card"
          : variant === "panel"
            ? "po-attach-img po-attach-img--panel"
            : "po-attach-img";

    return (
      <>
        <button
          type="button"
          className="po-attach-img-link"
          onClick={() => setLightboxOpen(true)}
          title={`عرض ${doc.fileName}`}
          aria-label={`عرض مرفق قرار الإسناد: ${doc.fileName}`}
        >
          <img src={doc.dataUrl} alt="" className={imgClass} />
        </button>

        {lightboxOpen ? (
          <div
            className="po-attach-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={doc.fileName}
            onClick={() => setLightboxOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setLightboxOpen(false);
            }}
          >
            <div
              className="po-attach-lightbox-panel"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="po-attach-lightbox-hd">
                <span className="po-attach-lightbox-title">{doc.fileName}</span>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setLightboxOpen(false)}
                >
                  إغلاق
                </button>
              </div>
              <img
                src={doc.dataUrl}
                alt={`مرفق قرار الإسناد: ${doc.fileName}`}
                className="po-attach-lightbox-img"
              />
            </div>
          </div>
        ) : null}
      </>
    );
  }

  const isPdf =
    doc.mimeType === "application/pdf" ||
    doc.fileName.toLowerCase().endsWith(".pdf");

  return (
    <div
      className={`po-attach-file-icon${isPdf ? " is-pdf" : ""}`}
      aria-hidden
    >
      {isPdf ? "PDF" : "📎"}
    </div>
  );
}

function guessMime(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}
