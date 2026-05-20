import type {
  AssignmentType,
  PoIntakeRecord,
  PoPropertyIntake,
} from "@/lib/prototype/po-intake-data";
import {
  classificationRequiresSurvey,
  computeBusinessDueDate,
  emptyProperty,
} from "@/lib/prototype/po-intake-data";
import { getPropertyFailure } from "@/lib/prototype/failures-storage";
import type { PoRow, PropertyRow } from "@/lib/prototype/constants";
import type {
  WorkOrderDto,
  WorkOrderPropertyDto,
} from "@platform/api-client";
import {
  addWorkOrderProperty,
  createWorkOrder,
  deleteWorkOrder,
  deleteWorkOrderProperty,
  findPriorDeed,
  getWorkOrder,
  listWorkOrders,
  updateWorkOrderHeader,
  updateWorkOrderProperty,
  workOrderExists,
} from "@platform/api-client";
import {
  apiErrorMessage,
  notifyWorkOrdersChanged,
  resolveApiError,
  workOrdersApiConfig,
} from "@/lib/work-orders-api-config";

const DRAFT_KEY = "evalPoIntakeDraft";

const PROPERTY_DEFAULTS = emptyProperty();

export type StorageError = {
  ok: false;
  error: string;
  errors?: Record<string, string>;
};

export type StorageOk<T> = { ok: true; data: T };

function normalizeProperty(prop: PoPropertyIntake): PoPropertyIntake {
  return {
    ...PROPERTY_DEFAULTS,
    ...prop,
    id: String(prop.id),
    contacts: prop.contacts?.length ? prop.contacts : [{ name: "", phone: "" }],
  };
}

function normalizePoRecord(record: PoIntakeRecord): PoIntakeRecord {
  const receivedFromEnfathTime = record.receivedFromEnfathTime ?? "";
  return {
    ...record,
    id: String(record.id),
    receivedFromEnfathTime,
    dueDateAt:
      record.dueDateAt ||
      computeBusinessDueDate(record.receivedFromEnfathAt, receivedFromEnfathTime),
    properties: (record.properties ?? []).map(normalizeProperty),
  };
}

function dtoToProperty(dto: WorkOrderPropertyDto): PoPropertyIntake {
  return normalizeProperty({
    id: String(dto.id ?? ""),
    identifierType:
      dto.identifierType === "real_estate_reg" ? "real_estate_reg" : "deed",
    deedNumber: dto.deedNumber,
    deedDate: dto.deedDate ?? "",
    ownerName: dto.ownerName ?? "",
    restrictions: dto.restrictions ?? "",
    boundariesMatch: dto.boundariesMatch ?? "",
    city: dto.city,
    district: dto.district,
    deedStatus: dto.deedStatus ?? "",
    area: dto.area ?? "",
    boundaries: dto.boundaries ?? "",
    court: dto.court ?? "",
    circuit: dto.circuit ?? "",
    classification: dto.classification,
    propertyType: dto.propertyType,
    assignmentDocFileName: dto.assignmentDocFileName ?? "",
    realEstateRegFileName: dto.realEstateRegFileName ?? "",
    contacts: dto.contacts ?? [],
  });
}

function dtoToRecord(dto: WorkOrderDto): PoIntakeRecord {
  return normalizePoRecord({
    id: String(dto.id),
    poNumber: dto.poNumber,
    assignmentType: dto.assignmentType as AssignmentType,
    receivedFromEnfathAt: dto.receivedFromEnfathAt,
    receivedFromEnfathTime: dto.receivedFromEnfathTime ?? "",
    internalAssignmentAt: dto.internalAssignmentAt,
    assignmentSpecialist: dto.assignmentSpecialist,
    dueDateAt: dto.dueDateAt,
    createdAtUtc: dto.createdAtUtc,
    properties: dto.properties.map(dtoToProperty),
  });
}

export function propertyToDto(prop: PoPropertyIntake): WorkOrderPropertyDto {
  return {
    id: prop.id || undefined,
    identifierType: prop.identifierType,
    deedNumber: prop.deedNumber.trim(),
    deedDate: prop.deedDate || undefined,
    ownerName: prop.ownerName || undefined,
    restrictions: prop.restrictions || undefined,
    boundariesMatch: prop.boundariesMatch || undefined,
    city: prop.city.trim(),
    district: prop.district.trim(),
    deedStatus: prop.deedStatus || undefined,
    area: prop.area || undefined,
    boundaries: prop.boundaries || undefined,
    court: prop.court || undefined,
    circuit: prop.circuit || undefined,
    classification: prop.classification.trim(),
    propertyType: prop.propertyType.trim(),
    assignmentDocFileName: prop.assignmentDocFileName || undefined,
    realEstateRegFileName: prop.realEstateRegFileName || undefined,
    contacts: prop.contacts
      .filter((c) => c.name.trim() || c.phone.trim())
      .map((c) => ({ name: c.name.trim(), phone: c.phone.trim() })),
  };
}

function listItemToPoRow(item: {
  poNumber: string;
  assignmentType: string;
  propertyCount: number;
  completedCount: number;
  status: string;
  receivedFromEnfathAt: string;
  dueDateAt: string;
  assignmentSpecialist: string;
}): PoRow {
  return {
    id: item.poNumber,
    type: item.assignmentType || "—",
    count: item.propertyCount,
    done: item.completedCount,
    status: item.status === "done" ? "done" : "progress",
    date: item.receivedFromEnfathAt,
    dueDate: item.dueDateAt,
    specialist: item.assignmentSpecialist,
  };
}

export async function loadPoRecords(): Promise<PoIntakeRecord[]> {
  const config = workOrdersApiConfig();
  if (!config) return [];

  const list = await listWorkOrders(config);
  if (!list.ok) return [];

  const details = await Promise.all(
    list.data.map((item) => getWorkOrder(config, item.poNumber)),
  );

  return details
    .filter((r): r is { ok: true; data: WorkOrderDto } => r.ok)
    .map((r) => dtoToRecord(r.data));
}

export async function savePoRecord(
  record: PoIntakeRecord,
): Promise<StorageOk<PoIntakeRecord> | StorageError> {
  const config = workOrdersApiConfig();
  if (!config) {
    return { ok: false, error: apiErrorMessage("auth") };
  }

  const result = await createWorkOrder(config, {
    poNumber: record.poNumber.trim(),
    assignmentType: record.assignmentType,
    receivedFromEnfathAt: record.receivedFromEnfathAt,
    receivedFromEnfathTime: record.receivedFromEnfathTime || undefined,
    internalAssignmentAt: record.internalAssignmentAt,
    assignmentSpecialist: record.assignmentSpecialist.trim(),
    properties: record.properties.map(propertyToDto),
  });

  if (!result.ok) {
    return {
      ok: false,
      error: resolveApiError(result.kind, result.errors),
      errors: result.errors,
    };
  }

  notifyWorkOrdersChanged();
  return { ok: true, data: dtoToRecord(result.data) };
}

export async function poRecordExists(poNumber: string): Promise<boolean> {
  const config = workOrdersApiConfig();
  if (!config) return false;
  const result = await workOrderExists(config, poNumber);
  return result.ok ? result.data : false;
}

export function poRecordToListRow(record: PoIntakeRecord): PoRow {
  return {
    id: record.poNumber,
    type: record.assignmentType ?? "—",
    count: record.properties.length,
    done: 0,
    status: "progress",
    date: record.receivedFromEnfathAt,
    dueDate: record.dueDateAt,
    specialist: record.assignmentSpecialist,
  };
}

function priorSurveyWaived(
  prop: PoPropertyIntake,
  priorByDeed: Map<string, string>,
): boolean {
  if (!classificationRequiresSurvey(prop.classification)) return true;
  const n = prop.deedNumber.trim();
  if (!n) return false;
  return priorByDeed.has(n);
}

export async function findPriorDeedRegistration(
  deedNumber: string,
  excludePo?: string,
): Promise<{ poNumber: string } | null> {
  const config = workOrdersApiConfig();
  if (!config) return null;
  const result = await findPriorDeed(config, deedNumber, excludePo);
  if (!result.ok || !result.data) return null;
  return result.data;
}

export async function loadPoListRows(): Promise<PoRow[]> {
  const config = workOrdersApiConfig();
  if (!config) return [];
  const result = await listWorkOrders(config);
  if (!result.ok) return [];
  return result.data.map(listItemToPoRow);
}

function propertyRowId(poNumber: string, prop: PoPropertyIntake): string {
  const deed = prop.deedNumber.trim();
  if (deed) return deed;
  return `${poNumber}-${prop.id.slice(0, 8)}`;
}

export function poPropertyToPropertyRow(
  record: PoIntakeRecord,
  prop: PoPropertyIntake,
  priorByDeed: Map<string, string>,
): PropertyRow {
  const failure = getPropertyFailure(record.poNumber, prop.id);
  const underVerification = prop.deedStatus === "قيد التحقق";
  const isFailed =
    failure?.status === "approved" || prop.deedStatus === "موقوف";
  const area = prop.district
    ? `${prop.city} · ${prop.district}`
    : prop.city || "—";

  return {
    id: propertyRowId(record.poNumber, prop),
    po: record.poNumber,
    area,
    type: prop.propertyType || prop.classification || "—",
    key: false,
    survey: priorSurveyWaived(prop, priorByDeed) ? "done" : "new",
    val: "new",
    study: underVerification ? "progress" : "new",
    status: isFailed ? "fail" : underVerification ? "progress" : "new",
    specialist: record.assignmentSpecialist,
    preparer: "—",
  };
}

export async function loadPropertyRows(): Promise<PropertyRow[]> {
  const items = await loadPropertyListItems();
  return items.map(({ row }) => row);
}

export type PropertyListItem = {
  row: PropertyRow;
  poNumber: string;
  propertyId: string;
};

export async function loadPropertyListItems(): Promise<PropertyListItem[]> {
  const records = await loadPoRecords();
  const priorByDeed = new Map<string, string>();
  for (const record of records) {
    for (const prop of record.properties) {
      if (prop.identifierType === "deed" && prop.deedNumber.trim()) {
        priorByDeed.set(prop.deedNumber.trim(), record.poNumber);
      }
    }
  }

  return records.flatMap((record) =>
    record.properties.map((prop) => ({
      row: poPropertyToPropertyRow(record, prop, priorByDeed),
      poNumber: record.poNumber,
      propertyId: prop.id,
    })),
  );
}

export async function getPoRecord(
  poNumber: string,
): Promise<PoIntakeRecord | null> {
  const config = workOrdersApiConfig();
  if (!config) return null;
  const result = await getWorkOrder(config, poNumber);
  if (!result.ok) return null;
  return dtoToRecord(result.data);
}

export async function deletePoRecord(
  poNumber: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const config = workOrdersApiConfig();
  if (!config) return { ok: false, error: apiErrorMessage("auth") };

  const result = await deleteWorkOrder(config, poNumber);
  if (!result.ok) {
    return {
      ok: false,
      error: result.message ?? apiErrorMessage(result.kind),
    };
  }
  notifyWorkOrdersChanged();
  return { ok: true };
}

export async function updatePoRecord(
  record: PoIntakeRecord,
): Promise<StorageOk<PoIntakeRecord> | StorageError> {
  const config = workOrdersApiConfig();
  if (!config) return { ok: false, error: apiErrorMessage("auth") };

  const result = await updateWorkOrderHeader(config, record.poNumber, {
    assignmentType: record.assignmentType,
    receivedFromEnfathAt: record.receivedFromEnfathAt,
    receivedFromEnfathTime: record.receivedFromEnfathTime || undefined,
    internalAssignmentAt: record.internalAssignmentAt,
    assignmentSpecialist: record.assignmentSpecialist.trim(),
  });

  if (!result.ok) {
    return {
      ok: false,
      error: resolveApiError(result.kind, result.errors, "تعذّر حفظ التعديلات"),
      errors: result.errors,
    };
  }

  notifyWorkOrdersChanged();
  return { ok: true, data: dtoToRecord(result.data) };
}

export async function findPropertyInRecord(
  poNumber: string,
  propertyId: string,
): Promise<{ record: PoIntakeRecord; property: PoPropertyIntake } | null> {
  const record = await getPoRecord(poNumber);
  if (!record) return null;
  const property = record.properties.find((p) => p.id === propertyId);
  if (!property) return null;
  return { record, property };
}

export async function deedExistsInPo(
  poNumber: string,
  deedNumber: string,
  excludePropertyId?: string,
): Promise<boolean> {
  const record = await getPoRecord(poNumber);
  if (!record) return false;
  const n = deedNumber.trim();
  return record.properties.some(
    (p) => p.deedNumber.trim() === n && p.id !== excludePropertyId,
  );
}

export async function addPropertyToPo(
  poNumber: string,
  property: PoPropertyIntake,
): Promise<StorageOk<PoPropertyIntake> | StorageError> {
  const config = workOrdersApiConfig();
  if (!config) return { ok: false, error: apiErrorMessage("auth") };

  const result = await addWorkOrderProperty(
    config,
    poNumber,
    propertyToDto(property),
  );
  if (!result.ok) {
    return {
      ok: false,
      error: resolveApiError(result.kind, result.errors),
      errors: result.errors,
    };
  }

  notifyWorkOrdersChanged();
  return { ok: true, data: dtoToProperty(result.data) };
}

export async function removePropertyFromPo(
  poNumber: string,
  propertyId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const config = workOrdersApiConfig();
  if (!config) return { ok: false, error: apiErrorMessage("auth") };

  const result = await deleteWorkOrderProperty(config, poNumber, propertyId);
  if (!result.ok) {
    return {
      ok: false,
      error: result.message ?? apiErrorMessage(result.kind),
    };
  }
  notifyWorkOrdersChanged();
  return { ok: true };
}

export async function updatePropertyInPo(
  poNumber: string,
  propertyId: string,
  property: PoPropertyIntake,
): Promise<StorageOk<PoPropertyIntake> | StorageError> {
  const config = workOrdersApiConfig();
  if (!config) return { ok: false, error: apiErrorMessage("auth") };

  const result = await updateWorkOrderProperty(
    config,
    poNumber,
    propertyId,
    propertyToDto({ ...property, id: propertyId }),
  );
  if (!result.ok) {
    return {
      ok: false,
      error: resolveApiError(result.kind, result.errors),
      errors: result.errors,
    };
  }

  notifyWorkOrdersChanged();
  return { ok: true, data: dtoToProperty(result.data) };
}

export type PoIntakeDraftPayload = {
  step: number;
  poNumber: string;
  assignmentType: PoIntakeRecord["assignmentType"] | "";
  receivedFromEnfathAt: string;
  receivedFromEnfathTime: string;
  internalAssignmentAt: string;
  assignmentSpecialist: string;
  properties: PoIntakeRecord["properties"];
  currentProperty: PoIntakeRecord["properties"][number];
};

export function loadPoDraft(): PoIntakeDraftPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PoIntakeDraftPayload;
  } catch {
    return null;
  }
}

export function savePoDraft(draft: PoIntakeDraftPayload): void {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearPoDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}

export function buildPoRecord(
  fields: Omit<PoIntakeRecord, "id" | "dueDateAt" | "createdAtUtc"> & {
    id?: string;
  },
): PoIntakeRecord {
  return {
    id:
      fields.id ??
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `po-${Date.now()}`),
    ...fields,
    dueDateAt: computeBusinessDueDate(
      fields.receivedFromEnfathAt,
      fields.receivedFromEnfathTime ?? "",
    ),
    receivedFromEnfathTime: fields.receivedFromEnfathTime ?? "",
    createdAtUtc: new Date().toISOString(),
  };
}
