import {
  listEngineeringSurveyDocuments,
  type EngineeringSurveyDocumentEntry,
} from "@engineering-office/mfe";
import { getCachedEvaluatorReport } from "@evaluator/mfe";
import {
  getCachedAssignmentDoc,
  getCachedDelegationDoc,
  isImageMime,
} from "./assignment-doc-attachments";
import type { PoPropertyIntake } from "./po-intake-data";
import {
  FIELD_INSPECTION_PHOTO_SLOTS,
  type FieldInspectionSubmission,
} from "./field-inspection-data";
import { loadFieldInspectionSubmission } from "./field-inspection-submission-storage";

export type PropertyDetailDocumentEntry = {
  id: string;
  name: string;
  fileName: string;
  source: string;
  kind: "pdf" | "file" | "image";
  dataUrl?: string;
};

function fileKind(fileName: string, mimeType?: string): "pdf" | "file" | "image" {
  if (mimeType && isImageMime(mimeType)) return "image";
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (/\.(jpe?g|png|gif|webp)$/i.test(lower)) return "image";
  return "file";
}

function pushEntry(
  list: PropertyDetailDocumentEntry[],
  entry: PropertyDetailDocumentEntry,
): void {
  if (!entry.fileName.trim()) return;
  if (list.some((d) => d.id === entry.id)) return;
  list.push(entry);
}

export function collectIntakeDocuments(input: {
  property: PoPropertyIntake;
  showDecree: boolean;
  poNumber: string;
}): PropertyDetailDocumentEntry[] {
  const { property, showDecree, poNumber } = input;
  const docs: PropertyDetailDocumentEntry[] = [];
  const source = "البيانات الأولية";

  if (property.realEstateRegFileName?.trim()) {
    pushEntry(docs, {
      id: "intake-reg",
      name: "السجل العقاري",
      fileName: property.realEstateRegFileName.trim(),
      source,
      kind: fileKind(property.realEstateRegFileName),
    });
  }

  if (showDecree && property.assignmentDocFileName?.trim()) {
    const cached = getCachedAssignmentDoc(poNumber, property.id);
    pushEntry(docs, {
      id: "intake-assignment",
      name: "قرار الإسناد",
      fileName: property.assignmentDocFileName.trim(),
      source,
      kind: fileKind(
        property.assignmentDocFileName,
        cached?.mimeType,
      ),
      dataUrl: cached?.dataUrl,
    });
  }

  if (property.delegationLetterFileName?.trim()) {
    const cached = getCachedDelegationDoc(poNumber, property.id);
    pushEntry(docs, {
      id: "intake-delegation",
      name: "خطاب التفويض",
      fileName: property.delegationLetterFileName.trim(),
      source,
      kind: fileKind(
        property.delegationLetterFileName,
        cached?.mimeType,
      ),
      dataUrl: cached?.dataUrl,
    });
  }

  if (
    property.boundariesAvailability === "doc" &&
    property.boundariesExternalDocName?.trim()
  ) {
    pushEntry(docs, {
      id: "intake-boundaries",
      name: "مستند الحدود",
      fileName: property.boundariesExternalDocName.trim(),
      source: "استعلام البورصة",
      kind: fileKind(property.boundariesExternalDocName),
    });
  }

  property.otherDocumentFileNames.forEach((name, i) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    pushEntry(docs, {
      id: `intake-other-${i}`,
      name: "مستند إضافي",
      fileName: trimmed,
      source,
      kind: fileKind(trimmed),
    });
  });

  return docs;
}

export function collectEngineeringDocuments(
  surveyTaskId: string | null | undefined,
): PropertyDetailDocumentEntry[] {
  if (!surveyTaskId) return [];
  return listEngineeringSurveyDocuments(surveyTaskId).map(mapEngineeringDoc);
}

function mapEngineeringDoc(
  doc: EngineeringSurveyDocumentEntry,
): PropertyDetailDocumentEntry {
  return {
    id: doc.id,
    name: doc.name,
    fileName: doc.sub,
    source: "المكتب الهندسي",
    kind: "pdf",
    dataUrl: doc.attachment.dataUrl,
  };
}

export function collectAppraisalDocuments(
  appraisalTaskId: string | null | undefined,
): PropertyDetailDocumentEntry[] {
  if (!appraisalTaskId) return [];
  const cached = getCachedEvaluatorReport(appraisalTaskId);
  if (!cached?.fileName?.trim()) return [];
  return [
    {
      id: "appraisal-report",
      name: "تقرير التقييم",
      fileName: cached.fileName.trim(),
      source: "المقيّم العقاري",
      kind: "pdf",
      dataUrl: cached.dataUrl,
    },
  ];
}

export function collectFieldInspectionDocuments(
  inspectionTaskId: string | null | undefined,
): PropertyDetailDocumentEntry[] {
  if (!inspectionTaskId) return [];
  const submission = loadFieldInspectionSubmission(inspectionTaskId);
  if (!submission) return [];
  return collectFieldInspectionDocumentsFromSubmission(submission);
}

export function collectFieldInspectionDocumentsFromSubmission(
  submission: FieldInspectionSubmission,
): PropertyDetailDocumentEntry[] {
  const docs: PropertyDetailDocumentEntry[] = [];
  const source = "المعاين الميداني";

  submission.signedDocumentPhotos.forEach((fileName, i) => {
    const trimmed = fileName.trim();
    if (!trimmed) return;
    pushEntry(docs, {
      id: `inspection-signed-${i}`,
      name: `مستند موقّع ${i + 1}`,
      fileName: trimmed,
      source,
      kind: fileKind(trimmed),
    });
  });

  for (const slot of FIELD_INSPECTION_PHOTO_SLOTS) {
    const fileName = submission.propertyPhotos[slot.key]?.trim() ?? "";
    if (!fileName) continue;
    pushEntry(docs, {
      id: `inspection-photo-${slot.key}`,
      name: slot.label,
      fileName,
      source,
      kind: fileKind(fileName),
    });
  }

  return docs;
}

export function collectAllPropertyDetailDocuments(input: {
  property: PoPropertyIntake;
  showDecree: boolean;
  poNumber: string;
  surveyTaskId?: string | null;
  appraisalTaskId?: string | null;
  inspectionTaskId?: string | null;
}): PropertyDetailDocumentEntry[] {
  return collectPropertyDetailDocumentSections(input).flatMap(
    (section) => section.documents,
  );
}

export type PropertyDetailDocumentSection = {
  id: string;
  title: string;
  documents: PropertyDetailDocumentEntry[];
};

/** Display order for مستندات العقار — one section per upload source. */
export const PROPERTY_DETAIL_DOCUMENT_SECTIONS: {
  id: string;
  title: string;
}[] = [
  { id: "intake", title: "البيانات الأولية" },
  { id: "bourse", title: "استعلام البورصة" },
  { id: "engineering", title: "المكتب الهندسي" },
  { id: "appraisal", title: "المقيّم العقاري" },
  { id: "inspection", title: "المعاين الميداني" },
];

const SECTION_TITLE_BY_ID = Object.fromEntries(
  PROPERTY_DETAIL_DOCUMENT_SECTIONS.map((s) => [s.id, s.title]),
) as Record<string, string>;

function sectionIdForSource(source: string): string {
  if (source === "البيانات الأولية") return "intake";
  if (source === "استعلام البورصة") return "bourse";
  if (source === "المكتب الهندسي") return "engineering";
  if (source === "المقيّم العقاري") return "appraisal";
  if (source === "المعاين الميداني") return "inspection";
  return "other";
}

export function collectPropertyDetailDocumentSections(input: {
  property: PoPropertyIntake;
  showDecree: boolean;
  poNumber: string;
  surveyTaskId?: string | null;
  appraisalTaskId?: string | null;
  inspectionTaskId?: string | null;
}): PropertyDetailDocumentSection[] {
  const all = [
    ...collectIntakeDocuments(input),
    ...collectEngineeringDocuments(input.surveyTaskId),
    ...collectAppraisalDocuments(input.appraisalTaskId),
    ...collectFieldInspectionDocuments(input.inspectionTaskId),
  ];

  const bySectionId = new Map<string, PropertyDetailDocumentEntry[]>();
  for (const def of PROPERTY_DETAIL_DOCUMENT_SECTIONS) {
    bySectionId.set(def.id, []);
  }

  for (const doc of all) {
    const sectionId = sectionIdForSource(doc.source);
    const bucket = bySectionId.get(sectionId);
    if (bucket) bucket.push(doc);
  }

  return PROPERTY_DETAIL_DOCUMENT_SECTIONS.map((def) => ({
    id: def.id,
    title: def.title,
    documents: bySectionId.get(def.id) ?? [],
  }));
}

export function countPropertyDetailDocuments(
  sections: PropertyDetailDocumentSection[],
): number {
  return sections.reduce((total, section) => total + section.documents.length, 0);
}

export function sectionTitleForPreviewHint(source: string): boolean {
  return source === SECTION_TITLE_BY_ID.engineering || source === SECTION_TITLE_BY_ID.appraisal;
}

export function openPropertyDetailDocumentPreview(
  entry: PropertyDetailDocumentEntry,
): void {
  if (!entry.dataUrl) return;
  window.open(entry.dataUrl, "_blank", "noopener,noreferrer");
}

export function downloadPropertyDetailDocument(
  entry: PropertyDetailDocumentEntry,
): void {
  if (!entry.dataUrl) return;
  const link = document.createElement("a");
  link.href = entry.dataUrl;
  link.download = entry.fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}
