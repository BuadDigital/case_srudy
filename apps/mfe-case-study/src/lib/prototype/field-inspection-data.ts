export const FIELD_INSPECTION_CONDITION_OPTIONS = [
  "ممتاز",
  "جيد",
  "متوسط",
  "يحتاج صيانة",
  "مهجور",
] as const;

export const FIELD_INSPECTION_ACCESS_OPTIONS = [
  "سهل",
  "متوسط",
  "صعب",
  "غير ممكن",
] as const;

export const FIELD_INSPECTION_PROPERTY_TYPE_OPTIONS = [
  "شقة",
  "أرض",
  "فيلا",
  "عمارة",
  "محل تجاري",
] as const;

export const FIELD_INSPECTION_MARKET_ACTIVITY_OPTIONS = [
  "نشط جداً",
  "نشط",
  "متوسط",
  "ضعيف",
  "نادر",
] as const;

export const FIELD_INSPECTION_SIGNATORY_ROLE_OPTIONS = [
  "مالك",
  "وكيل",
  "مستأجر",
  "حارس",
] as const;

export const FIELD_INSPECTION_FACADE_OPTIONS = [
  "شمالية",
  "جنوبية",
  "شرقية",
  "غربية",
] as const;

export const FIELD_INSPECTION_DISTRICT_STATE_OPTIONS = [
  "قائم",
  "قيد الإنشاء",
  "مهجور",
] as const;

export type FieldInspectionFacade =
  (typeof FIELD_INSPECTION_FACADE_OPTIONS)[number];

export type FieldInspectionDistrictState =
  (typeof FIELD_INSPECTION_DISTRICT_STATE_OPTIONS)[number];

export type FieldInspectionYesNoChoice = "yes" | "no" | "";

export const FIELD_INSPECTION_PHOTO_SLOTS = [
  { key: "mainFacade", label: "واجهة رئيسية" },
  { key: "entrance", label: "المدخل" },
  { key: "interior", label: "الداخل" },
  { key: "surroundings", label: "المحيط" },
] as const;

export type FieldInspectionCondition =
  (typeof FIELD_INSPECTION_CONDITION_OPTIONS)[number];

export type FieldInspectionAccess =
  (typeof FIELD_INSPECTION_ACCESS_OPTIONS)[number];

export type FieldInspectionPropertyType =
  (typeof FIELD_INSPECTION_PROPERTY_TYPE_OPTIONS)[number];

export type FieldInspectionMarketActivity =
  (typeof FIELD_INSPECTION_MARKET_ACTIVITY_OPTIONS)[number];

export type FieldInspectionSignatoryRole =
  (typeof FIELD_INSPECTION_SIGNATORY_ROLE_OPTIONS)[number];

export type FieldInspectionRentalStatus = "yes" | "no" | "unknown" | "";

export type FieldInspectionPhotoKey =
  (typeof FIELD_INSPECTION_PHOTO_SLOTS)[number]["key"];

export type FieldInspectionSubmissionStatus = "draft" | "submitted";

export type FieldInspectionPropertyPhotos = Record<
  FieldInspectionPhotoKey,
  string
>;

export type FieldInspectionSubmission = {
  taskId: string;
  propertyId: string;
  poNumber: string;
  propertyDisplayId: string;
  propertyType: FieldInspectionPropertyType | "";
  areaDistrict: string;
  actualAreaSqm: string;
  structuralCondition: FieldInspectionCondition | "";
  hasMovableItems: boolean | null;
  isCurrentlyRented: FieldInspectionRentalStatus;
  accessDifficulty: FieldInspectionAccess | "";
  avgPricePerSqm: string;
  marketActivityLevel: FieldInspectionMarketActivity | "";
  marketNotes: string;
  responsiblePersonName: string;
  responsiblePersonRole: FieldInspectionSignatoryRole | "";
  signedDocumentPhotos: string[];
  propertyPhotos: FieldInspectionPropertyPhotos;
  generalNotes: string;
  /** حقول الرفع لإنفاذ — المعاين (أصيل) */
  inspectionDate: string;
  facade: FieldInspectionFacade | "";
  streetWidthM: string;
  builtAreaSqm: string;
  propertyUsage: string;
  streetName: string;
  mainStreetName: string;
  mapLatitude: string;
  mapLongitude: string;
  roomCount: string;
  hallCount: string;
  unitCount: string;
  bathroomCount: string;
  propertyAgeYears: string;
  showroomCount: string;
  towerCount: string;
  wellCount: string;
  hasKitchen: FieldInspectionYesNoChoice;
  hasCarEntrance: FieldInspectionYesNoChoice;
  hasBasement: FieldInspectionYesNoChoice;
  hasElevator: FieldInspectionYesNoChoice;
  hasPool: FieldInspectionYesNoChoice;
  districtState: FieldInspectionDistrictState | "";
  availableServices: string;
  surroundingAmenities: string;
  propertyDescription: string;
  districtProsCons: string;
  accessRouteDescription: string;
  assetNotes: string;
  buildingFloors: string;
  basementTotalSqm: string;
  annexTotalSqm: string;
  buildingsTotalSqm: string;
  exteriorPhotosPdf: string;
  interiorPhotosPdf: string;
  status: FieldInspectionSubmissionStatus;
  submittedAtUtc: string | null;
  updatedAtUtc: string;
};

export function emptyFieldInspectionPhotos(): FieldInspectionPropertyPhotos {
  return {
    mainFacade: "",
    entrance: "",
    interior: "",
    surroundings: "",
  };
}

export function createFieldInspectionDraft(input: {
  taskId: string;
  propertyId: string;
  poNumber: string;
  propertyDisplayId?: string;
}): FieldInspectionSubmission {
  const now = new Date().toISOString();
  return {
    taskId: input.taskId,
    propertyId: input.propertyId,
    poNumber: input.poNumber,
    propertyDisplayId: input.propertyDisplayId?.trim() ?? "",
    propertyType: "",
    areaDistrict: "",
    actualAreaSqm: "",
    structuralCondition: "",
    hasMovableItems: null,
    isCurrentlyRented: "",
    accessDifficulty: "",
    avgPricePerSqm: "",
    marketActivityLevel: "",
    marketNotes: "",
    responsiblePersonName: "",
    responsiblePersonRole: "",
    signedDocumentPhotos: ["", "", ""],
    propertyPhotos: emptyFieldInspectionPhotos(),
    generalNotes: "",
    inspectionDate: "",
    facade: "",
    streetWidthM: "",
    builtAreaSqm: "",
    propertyUsage: "",
    streetName: "",
    mainStreetName: "",
    mapLatitude: "",
    mapLongitude: "",
    roomCount: "",
    hallCount: "",
    unitCount: "",
    bathroomCount: "",
    propertyAgeYears: "",
    showroomCount: "",
    towerCount: "",
    wellCount: "",
    hasKitchen: "",
    hasCarEntrance: "",
    hasBasement: "",
    hasElevator: "",
    hasPool: "",
    districtState: "",
    availableServices: "",
    surroundingAmenities: "",
    propertyDescription: "",
    districtProsCons: "",
    accessRouteDescription: "",
    assetNotes: "",
    buildingFloors: "",
    basementTotalSqm: "",
    annexTotalSqm: "",
    buildingsTotalSqm: "",
    exteriorPhotosPdf: "",
    interiorPhotosPdf: "",
    status: "draft",
    submittedAtUtc: null,
    updatedAtUtc: now,
  };
}

export function isFieldInspectionFormLocked(
  status: FieldInspectionSubmissionStatus,
): boolean {
  return status === "submitted";
}

export function fieldInspectionStatusLabel(
  status: FieldInspectionSubmissionStatus,
): string {
  if (status === "submitted") return "مُرسَل";
  return "قيد العمل";
}

export function fieldInspectionRentalStatusLabel(
  value: FieldInspectionRentalStatus,
): string {
  if (value === "yes") return "نعم";
  if (value === "no") return "لا";
  if (value === "unknown") return "غير معروف";
  return "—";
}

export function fieldInspectionYesNoLabel(value: boolean | null): string {
  if (value === true) return "نعم";
  if (value === false) return "لا";
  return "—";
}
