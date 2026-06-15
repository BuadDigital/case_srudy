import {
  formatDateAr,
  formatPropertyLocation,
  formatPropertyTypeLine,
  type PoIntakeRecord,
  type PoPropertyIntake,
} from "./po-intake-data";
import type { PropertyDetailPartySubmission } from "./property-detail-party-submissions";
import type {
  PropertyDetailDocumentEntry,
  PropertyDetailDocumentSection,
} from "./property-detail-documents";
import type {
  InfathFieldState,
  InfathFieldType,
  InfathRoleKey,
  InfathUploadAttachment,
  InfathUploadField,
  InfathUploadModel,
  InfathUploadSection,
  InfathUploadStats,
} from "./infath-upload-types";
import {
  INFAZ_UPLOAD_UNRESOLVED_POINTS,
} from "./infath-upload-types";
import { INFATH_FIELD_LABELS as L } from "./infath-field-labels";

function partyField(
  party: PropertyDetailPartySubmission | null | undefined,
  label: string,
): string {
  return party?.fields.find((f) => f.label === label)?.value?.trim() ?? "";
}

function partyRemark(
  party: PropertyDetailPartySubmission | null | undefined,
  label: string,
): string {
  return party?.remarks.find((r) => r.label === label)?.value?.trim() ?? "";
}

function txt(
  id: string,
  label: string,
  value: string,
  role: InfathRoleKey,
  type: InfathFieldType = "text",
  state: InfathFieldState = "",
): InfathUploadField {
  return { id, label, value: value.trim(), role, type, state };
}

function area(
  id: string,
  label: string,
  value: string,
  role: InfathRoleKey,
  state: InfathFieldState = "",
): InfathUploadField {
  return txt(id, label, value, role, "area", state);
}

function sel(
  id: string,
  label: string,
  value: string,
  role: InfathRoleKey,
  state: InfathFieldState = "",
): InfathUploadField {
  return txt(id, label, value, role, "sel", state);
}

function auto(
  id: string,
  label: string,
  value: string,
  role: InfathRoleKey = "SY",
): InfathUploadField {
  return txt(id, label, value, role, "auto");
}

function ref(id: string, label: string, value: string): InfathUploadField {
  return txt(id, label, value, "SY", "ref");
}

function file(
  id: string,
  label: string,
  value: string,
  role: InfathRoleKey,
): InfathUploadField {
  return txt(id, label, value, role, "file");
}

function parseNumber(raw: string): number | null {
  const n = Number.parseFloat(raw.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

function findDoc(
  sections: PropertyDetailDocumentSection[],
  matchers: (name: string) => boolean,
): PropertyDetailDocumentEntry | null {
  for (const section of sections) {
    for (const doc of section.documents) {
      if (matchers(doc.name) || matchers(doc.fileName)) return doc;
    }
  }
  return null;
}

function buildAttachments(
  sections: PropertyDetailDocumentSection[],
  government: PropertyDetailPartySubmission | null | undefined,
  keysReceived: boolean,
): InfathUploadAttachment[] {
  const caseStudy = findDoc(sections, (n) => n.includes("دراسة"));
  const appraisal = findDoc(sections, (n) => n.includes("تقييم"));
  const survey = findDoc(sections, (n) => n.includes("رفع") || n.includes("مساح"));
  const deed = findDoc(sections, (n) => n.includes("صك") || n.includes("سجل"));

  const items: InfathUploadAttachment[] = [
    {
      id: "case-study",
      name: "نموذج دراسة الحالة",
      infathTarget: "نموذج دراسة الحالة",
      status: caseStudy?.dataUrl ? "ready" : "missing",
      document: caseStudy,
    },
    {
      id: "appraisal",
      name: "تقرير التقييم المعتمد",
      infathTarget: "مرفق التقييم المعتمد",
      status: appraisal?.dataUrl ? "ready" : "missing",
      document: appraisal,
    },
    {
      id: "survey",
      name: "تقرير الرفع المساحي",
      infathTarget: "مرفق الرفع المساحي",
      status: survey?.dataUrl ? "ready" : "conditional",
      conditional: true,
      document: survey,
    },
    {
      id: "deed",
      name: "صك ملكية الأصل",
      infathTarget: "صورة صك ملكية الأصل",
      status: deed ? "ready" : "missing",
      document: deed,
    },
  ];

  if (keysReceived) {
    items.push({
      id: "keys-proof",
      name: "إثبات استلام المفتاح",
      infathTarget: "إثبات استلام المفتاح",
      status: "conditional",
      conditional: true,
      document: null,
    });
  }

  return items;
}

export function isInfathFieldCopyable(field: InfathUploadField): boolean {
  return (
    Boolean(field.value) &&
    (field.type === "text" || field.type === "area")
  );
}

function computeStats(sections: InfathUploadSection[]): InfathUploadStats {
  let conflicts = 0;
  let missing = 0;
  let unresolved = 0;
  let attachments = 0;

  for (const section of sections) {
    for (const field of [...section.fields, ...section.areas]) {
      const state = field.state ?? "";
      const hasValue = Boolean(field.value);
      if (state === "cf") conflicts += 1;
      if (state === "ms" || !hasValue) missing += 1;
      if (state === "un") unresolved += 1;
      if (field.type === "file" && hasValue) attachments += 1;
    }
  }

  return { conflicts, missing, unresolved, attachments };
}

export function countInfathCopyableFields(model: InfathUploadModel): number {
  let total = 0;
  for (const section of model.sections) {
    for (const field of [...section.fields, ...section.areas]) {
      if (isInfathFieldCopyable(field)) total += 1;
    }
  }
  return total;
}

export function buildInfathUploadModel(input: {
  record: PoIntakeRecord;
  property: PoPropertyIntake;
  parties: Record<string, PropertyDetailPartySubmission | undefined> | null;
  documentSections: PropertyDetailDocumentSection[];
}): InfathUploadModel {
  const { record, property, parties, documentSections } = input;
  const inspection = parties?.inspection ?? null;
  const survey = parties?.survey ?? null;
  const appraisal = parties?.appraisal ?? null;
  const government = parties?.government ?? null;
  const specialist = parties?.specialist ?? null;

  const deed = property.deedNumber.trim() || "—";
  const reportNumber = `INF-${record.poNumber.trim()}-${deed}`;
  const coords =
    partyField(inspection, L.mapCoords) ||
    partyField(survey, "الإحداثيات") ||
    "";

  const inspectionDate = partyField(inspection, L.inspectionDate);
  const appraisalDate = partyField(appraisal, L.appraisalDate) || partyField(appraisal, "تاريخ الإرسال");
  const visitDate = partyField(government, "تاريخ الزيارة");
  const visitDateForReport = inspectionDate || visitDate;
  const appraisalPrice = partyField(appraisal, "سعر التقييم");
  const landValue = partyField(appraisal, L.landValue);
  const buildingValue = partyField(appraisal, L.buildingValue);
  const forcedDiscountRaw = partyField(appraisal, L.forcedDiscount);
  const appraisalNotes = partyRemark(appraisal, "ملاحظات المقيّم");
  const keysStatus = partyField(government, "حالة المفاتيح");
  const keysReceived =
    keysStatus.includes("استلام") || keysStatus.includes("تم استلام");
  const specialistRemarks =
    partyRemark(specialist, "ملاحظات") ||
    specialist?.remarks.map((r) => r.value).join("\n") ||
    "";

  const landArea = property.area.trim()
    ? `${property.area.trim()} م²`
    : partyField(inspection, "المساحة الفعلية");

  const forcedDiscountPct = parseNumber(forcedDiscountRaw.replace("%", "")) ?? 10;
  const totalValue =
    parseNumber(landValue) != null && parseNumber(buildingValue) != null
      ? (parseNumber(landValue) ?? 0) + (parseNumber(buildingValue) ?? 0)
      : parseNumber(appraisalPrice);
  const forcedSale =
    totalValue != null
      ? formatMoney(Math.round(totalValue * (1 - forcedDiscountPct / 100)))
      : "";

  const deedAreaNum = parseNumber(property.area);
  const siteAreaNum = parseNumber(partyField(inspection, "المساحة الفعلية"));
  const areaDiff =
    deedAreaNum != null && siteAreaNum != null
      ? deedAreaNum === siteAreaNum
        ? "لا"
        : "نعم"
      : "";

  const sections: InfathUploadSection[] = [
    {
      id: "report-meta",
      num: "١",
      title: "بيانات التقرير",
      fields: [
        txt(
          "visit-date",
          L.inspectionDate,
          visitDateForReport,
          "MA",
          "text",
          visitDateForReport ? "" : "un",
        ),
        txt("appraisal-date", L.appraisalDate, appraisalDate, "EV"),
        sel("method", L.valuationMethod, partyField(appraisal, L.valuationMethod) || "طريقة البيوع المقارنة", "EV"),
        txt("appraiser-title", L.appraiserAddress, partyField(appraisal, L.appraiserAddress), "SY", "text", partyField(appraisal, L.appraiserAddress) ? "" : "un"),
        txt("appraiser-phone", L.appraiserPhone, partyField(appraisal, L.appraiserPhone), "SY", "text", partyField(appraisal, L.appraiserPhone) ? "" : "un"),
        txt("issue-date", L.reportIssueDate, partyField(appraisal, L.reportIssueDate) || appraisalDate, "EV"),
      ],
      areas: [],
    },
    {
      id: "scope",
      num: "٢",
      title: "نطاق العمل",
      fields: [
        auto("report-no", "رقم التقرير", reportNumber),
        sel("value-basis", "أساس القيمة", "القيمة السوقية", "EV"),
      ],
      areas: [],
    },
    {
      id: "asset",
      num: "٣",
      title: "بيانات الأصل",
      fields: [
        sel(
          "asset-type",
          L.assetSubject,
          partyField(inspection, L.assetSubject) || partyField(inspection, "نوع العقار") || property.classification,
          "MA",
        ),
        sel("facade", L.facade, partyField(inspection, L.facade), "MA", "un"),
        txt("build-license", L.buildLicense, property.buildLicenseNumber?.trim() ?? "", "BR", "text", property.buildLicenseNumber?.trim() ? "" : "ms"),
        txt("street-width", L.streetWidth, partyField(inspection, L.streetWidth), "MA", "text", partyField(inspection, L.streetWidth) ? "" : "ms"),
        txt("built-area", L.builtArea, partyField(inspection, L.builtArea), "MA", "text", partyField(inspection, L.builtArea) ? "" : "ms"),
        txt("subdivision", L.subdivisionRecord, property.subdivisionRecordNumber?.trim() ?? "", "BR", "text", property.subdivisionRecordNumber?.trim() ? "" : "ms"),
        sel(
          "usage",
          L.propertyUsage,
          partyField(inspection, L.propertyUsage) || property.propertyType || formatPropertyTypeLine(property),
          "MA",
        ),
        txt("street-name", L.streetName, partyField(inspection, L.streetName), "MA"),
        sel(
          "zone-status",
          L.zoneStatus,
          partyField(government, L.zoneStatus) || (property.deedStatus ? "غير موقوفة" : ""),
          "GR",
        ),
        txt("main-street", L.mainStreet, partyField(inspection, L.mainStreet), "MA"),
        txt("map", L.mapCoords, coords, "MA", "text", coords ? "" : "ms"),
        txt("rooms", L.roomCount, partyField(inspection, L.roomCount), "MA"),
        txt("halls", L.hallCount, partyField(inspection, L.hallCount), "MA"),
        txt("units", L.unitCount, partyField(inspection, L.unitCount), "MA"),
        txt("baths", L.bathroomCount, partyField(inspection, L.bathroomCount), "MA"),
        txt("age", L.propertyAge, partyField(inspection, L.propertyAge), "MA"),
        txt("showrooms", L.showroomCount, partyField(inspection, L.showroomCount), "MA"),
        txt("towers", L.towerCount, partyField(inspection, L.towerCount), "MA"),
        txt("wells", L.wellCount, partyField(inspection, L.wellCount), "MA"),
        sel("kitchen", "مطبخ", "", "MA"),
        sel("car-entrance", "مدخل السيارة", "", "MA"),
        sel("basement", "يوجد قبو", "", "MA"),
        sel("elevator", "يوجد مصعد", "", "MA"),
        sel("pool", "يوجد مسبح", "", "MA"),
        sel(
          "build-state",
          L.buildState,
          partyField(inspection, L.buildState) || partyField(inspection, "الحالة الإنشائية"),
          "MA",
        ),
        sel(
          "occupancy",
          L.occupancyState,
          partyField(inspection, L.occupancyState) || partyField(inspection, "العقار مؤجر"),
          "MA",
        ),
        sel("district-state", L.districtState, partyField(inspection, L.districtState), "MA"),
        sel(
          "movables",
          L.movables,
          partyField(inspection, L.movables) || partyField(inspection, "منقولات داخل العقار"),
          "MA",
        ),
        sel(
          "demand",
          L.demandLevel,
          partyField(appraisal, L.demandLevel) || partyField(inspection, "نشاط السوق"),
          "EV",
        ),
        sel("services", L.services, partyField(inspection, L.services), "MA"),
        sel("amenities", L.amenities, partyField(inspection, L.amenities), "MA"),
      ],
      areas: [
        area("desc", L.propertyDescription, partyRemark(inspection, L.propertyDescription), "MA"),
        area("pros-cons", L.districtProsCons, partyRemark(inspection, L.districtProsCons) || partyRemark(inspection, "ملاحظات سوقية"), "MA"),
        area("access", L.accessRoute, partyRemark(inspection, L.accessRoute) || partyField(inspection, "إمكانية الوصول"), "MA"),
        area("asset-notes", L.assetNotes, partyRemark(inspection, L.assetNotes) || partyRemark(inspection, "ملاحظات عامة"), "MA"),
      ],
      badge: "مصدر الأصيل غير محسوم",
    },
    {
      id: "boundaries",
      num: "٤",
      title: "الحدود والأطوال للأصل",
      fields: [
        txt("land-area", "مساحة الأرض", landArea, "BR"),
        txt("north", L.northBoundary, partyField(survey, L.northBoundary), "EN"),
        txt("north-len", L.northLength, partyField(survey, L.northLength), "EN"),
        txt("south", L.southBoundary, partyField(survey, L.southBoundary), "EN"),
        txt("south-len", L.southLength, partyField(survey, L.southLength), "EN"),
        txt("east", L.eastBoundary, partyField(survey, L.eastBoundary), "EN"),
        txt("east-len", L.eastLength, partyField(survey, L.eastLength), "EN"),
        txt("west", L.westBoundary, partyField(survey, L.westBoundary), "EN"),
        txt("west-len", L.westLength, partyField(survey, L.westLength), "EN"),
        txt("floors", L.buildingFloors, partyField(inspection, L.buildingFloors), "MA", "text", partyField(inspection, L.buildingFloors) ? "" : "un"),
        txt("basement-total", L.basementTotal, partyField(inspection, L.basementTotal), "MA", "text", partyField(inspection, L.basementTotal) ? "" : "un"),
        txt("annex-total", L.annexTotal, partyField(inspection, L.annexTotal), "MA", "text", partyField(inspection, L.annexTotal) ? "" : "un"),
        txt("buildings-total", L.buildingsTotal, partyField(inspection, L.buildingsTotal), "MA", "text", partyField(inspection, L.buildingsTotal) ? "" : "un"),
      ],
      areas: [],
    },
    {
      id: "linked",
      num: "٥",
      title: "الأصول المرتبطة",
      fields: [
        sel("linked-q", L.linkedAssets, partyField(specialist, L.linkedAssets) || "لا", "SP"),
        txt("linked-deeds", L.linkedDeedNumbers, partyField(specialist, L.linkedDeedNumbers), "SY", "auto"),
      ],
      areas: [
        area("linked-notes", L.linkedAssetsNotes, partyRemark(specialist, L.linkedAssetsNotes), "SP"),
      ],
    },
    {
      id: "valuation",
      num: "٦",
      title: "تقدير القيمة",
      fields: [
        txt("land-value", L.landValue, landValue || appraisalPrice, "EV"),
        txt("build-value", L.buildingValue, buildingValue || "0", "EV"),
        auto(
          "total-value",
          L.totalValue,
          totalValue != null ? formatMoney(totalValue) : appraisalPrice,
        ),
        txt("forced-pct", L.forcedDiscount, forcedDiscountRaw || `${forcedDiscountPct}%`, "EV"),
        auto("forced-value", L.forcedSaleValue, forcedSale),
      ],
      areas: [],
    },
    {
      id: "photos",
      num: "٧",
      title: "صور الأصل",
      fields: [
        txt("site-text", L.siteLocation, coords || formatPropertyLocation(property), "MA"),
        file("ext-photo", L.exteriorPhotos, partyField(inspection, L.exteriorPhotos), "MA"),
        file("int-photo", L.interiorPhotos, partyField(inspection, L.interiorPhotos), "MA"),
        file("plan-photo", L.planPhoto, partyField(appraisal, L.planPhoto), "EN"),
        file(
          "deed-photo",
          L.deedPhoto,
          property.realEstateRegFileName?.trim() ?? "",
          "BR",
        ),
      ],
      areas: [],
    },
    {
      id: "workers",
      num: "٨",
      title: "بيانات العاملين على التقرير",
      badge: "تعبئة تلقائية غير محسومة",
      fields: [
        txt("worker-name", "الاسم", record.assignmentSpecialist.trim(), "UN", "text", "un"),
        txt("worker-license", "رقم الترخيص", "", "SY", "text", "un"),
        txt("worker-license-date", "تاريخ الترخيص", "", "SY", "text", "un"),
        file("worker-license-file", "مرفق الترخيص", "", "SY"),
      ],
      areas: [],
    },
    {
      id: "search-scope",
      num: "٩",
      title: "نطاق البحث",
      fields: [],
      areas: [area("search", L.searchScope, partyRemark(appraisal, L.searchScope) || appraisalNotes, "EV")],
    },
    {
      id: "keys",
      num: "١٠",
      title: "استلام المفاتيح",
      fields: [
        sel(
          "keys-received",
          L.keysReceived,
          partyField(government, L.keysReceived) || (keysReceived ? "نعم" : keysStatus ? "لا" : ""),
          "GR",
        ),
        ...(keysReceived
          ? [
              file(
                "keys-proof",
                L.keysProof,
                partyField(government, L.keysProof),
                "GR",
              ),
            ]
          : []),
      ],
      areas: [],
    },
    {
      id: "other",
      num: "١١",
      title: "معلومات أخرى",
      fields: [],
      areas: [area("other-notes", L.otherNotes, partyRemark(specialist, L.otherNotes) || specialistRemarks, "SP")],
    },
    {
      id: "closing",
      num: "١٢",
      title: "البيانات الختامية",
      fields: [],
      areas: [
        area(
          "closing-notes",
          L.closingNotes,
          partyRemark(specialist, L.closingNotes) || partyRemark(government, "ملاحظات المراجعة"),
          "SP",
        ),
      ],
    },
    {
      id: "appraisal-file",
      num: "١٣",
      title: "مرفق التقييم المعتمد",
      fields: [
        file(
          "signed-appraisal",
          "مرفق التقييم المعتمد",
          partyField(appraisal, "تقرير التقييم"),
          "EV",
        ),
      ],
      areas: [],
    },
    {
      id: "survey-conditional",
      num: "٤أ",
      title: "الرفع المساحي (شرطي)",
      conditional: true,
      fields: [
        txt("site-area", L.onSiteArea, partyField(survey, L.onSiteArea) || landArea, "EN"),
        ref("deed-area-ref", L.deedAreaRef, landArea),
        auto("area-diff", L.areaDiff, areaDiff),
        file(
          "survey-file",
          L.surveyFile,
          partyField(survey, L.surveyFile) || partyField(survey, "تقرير الرفع المساحي"),
          "EN",
        ),
      ],
      areas: [
        area(
          "survey-notes",
          L.surveyNotes,
          partyRemark(survey, L.surveyNotes) || partyRemark(survey, "ملاحظة الإرجاع"),
          "EN",
        ),
      ],
    },
  ];

  const attachments = buildAttachments(
    documentSections,
    government,
    keysReceived,
  );
  const stats = computeStats(sections);

  const model: InfathUploadModel = {
    sections,
    attachments,
    stats,
    copyableTotal: 0,
    unresolvedPoints: INFAZ_UPLOAD_UNRESOLVED_POINTS,
  };
  model.copyableTotal = countInfathCopyableFields(model);

  return model;
}

export async function copyInfathText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      /* fallback */
    }
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
  } catch {
    /* ignore */
  }
  document.body.removeChild(textarea);
}

export function downloadInfathDocument(
  doc: PropertyDetailDocumentEntry | null | undefined,
): void {
  if (!doc?.dataUrl) return;
  const anchor = document.createElement("a");
  anchor.href = doc.dataUrl;
  anchor.download = doc.fileName || doc.name;
  anchor.click();
}
