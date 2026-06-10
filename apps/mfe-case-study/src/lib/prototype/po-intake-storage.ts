import type {
  AssignmentType,
  PoIntakeRecord,
  PoPropertyIntake,
} from "./po-intake-data";
import { classificationRequiresSurvey, computeBusinessDueDate, emptyProperty, parsePropertyIdentifierType, poListStatusForAssignmentType,} from "./po-intake-data";
import {
  contactsForApi,
  propertyHasIncompleteContact,
} from "../domain/po-intake/property-validation";
import { deleteFailuresForPo, getPropertyFailure } from "@failures/mfe";
import {
  advanceTaskAfterBourseForProperty,
  advanceTaskAfterEnfath,
  deleteTasksForPo,
  deleteTasksForProperty,
  linkNewPropertyToTaskSlot,
  syncTaskSlotsForPo,
} from "./tasks-storage";
import type { PoRow, PropertyRow } from "@platform/app-shared/prototype/constants";
import type { PendingBoursePropertyDto,UpdatePropertyBourseRequest,WorkOrderDto,WorkOrderPropertyDto} from "@platform/api-client";
import {
  addWorkOrderProperty,
  completePropertyBourseData,
  createWorkOrder,
  deleteWorkOrder,
  deleteWorkOrderProperty,
  findPriorDeed,
  getWorkOrder,
  listPendingBourseProperties,
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
} from "../work-orders-api-config";

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
    contacts: prop.contacts?.length
      ? prop.contacts.map((c) => ({
          name: c.name ?? "",
          role: c.role ?? "",
          phone: c.phone ?? "",
        }))
      : [{ name: "", role: "", phone: "" }],
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
    identifierType: parsePropertyIdentifierType(dto.identifierType),
    deedNumber: dto.deedNumber,
    taskNumber: dto.taskNumber ?? "",
    deedDate: dto.deedDate ?? "",
    ownerName: dto.ownerName ?? "",
    restrictionsPresent: dto.restrictionsPresent ?? "",
    boundariesAvailability: dto.boundariesAvailability ?? "",
    boundariesExternalDocName: dto.boundariesExternalDocName ?? "",
    city: dto.city ?? "",
    district: dto.district ?? "",
    deedStatus: dto.deedStatus ?? "",
    area: dto.area ?? "",
    court: dto.court ?? "",
    circuit: dto.circuit ?? "",
    classification: dto.classification ?? "",
    propertyType: dto.propertyType ?? "",
    assignmentDocFileName: dto.assignmentDocFileName ?? "",
    delegationLetterFileName: dto.delegationLetterFileName ?? "",
    otherDocumentFileNames: dto.otherDocumentFileNames ?? [],
    realEstateRegFileName: dto.realEstateRegFileName ?? "",
    bourseDataCompleted: dto.bourseDataCompleted ?? false,
    contacts: (dto.contacts ?? []).map((c) => ({
      name: c.name ?? "",
      role: c.role ?? "",
      phone: c.phone ?? "",
    })),
  });
}

function dtoToRecord(dto: WorkOrderDto): PoIntakeRecord {
  return normalizePoRecord({
    id: String(dto.id),
    poNumber: dto.poNumber,
    assignmentType: dto.assignmentType as AssignmentType,
    promulgationDate: dto.promulgationDate,
    receivedFromEnfathAt: dto.receivedFromEnfathAt,
    receivedFromEnfathTime: dto.receivedFromEnfathTime ?? "",
    assignmentSpecialist: dto.assignmentSpecialist ?? "",
    assignmentSpecialistEmail: dto.assignmentSpecialistEmail ?? "",
    expectedPropertyCount: dto.expectedPropertyCount ?? 1,
    dueDateAt: dto.dueDateAt,
    createdAtUtc: dto.createdAtUtc,
    properties: dto.properties.map(dtoToProperty),
  });
}

export function propertyToEnfathDto(
  prop: PoPropertyIntake,
  options?: { forInsert?: boolean },
): WorkOrderPropertyDto {
  return {
    ...(options?.forInsert ? {} : { id: prop.id || undefined }),
    identifierType: prop.identifierType,
    deedNumber: prop.deedNumber.trim(),
    taskNumber: prop.taskNumber.trim() || undefined,
    deedDate: prop.deedDate || undefined,
    ownerName: prop.ownerName || undefined,
    city: prop.city.trim() || undefined,
    district: prop.district.trim() || undefined,
    classification: prop.classification.trim() || undefined,
    propertyType: prop.propertyType.trim() || undefined,
    court: prop.court || undefined,
    circuit: prop.circuit || undefined,
    assignmentDocFileName: prop.assignmentDocFileName || undefined,
    delegationLetterFileName: prop.delegationLetterFileName || undefined,
    otherDocumentFileNames:
      prop.otherDocumentFileNames.length > 0
        ? prop.otherDocumentFileNames
        : undefined,
    realEstateRegFileName: prop.realEstateRegFileName || undefined,
    bourseDataCompleted: prop.bourseDataCompleted,
    contacts: contactsForApi(prop.contacts),
  };
}

export function propertyToDto(prop: PoPropertyIntake): WorkOrderPropertyDto {
  return {
    ...propertyToEnfathDto(prop),
    restrictionsPresent: prop.restrictionsPresent || undefined,
    boundariesAvailability: prop.boundariesAvailability || undefined,
    boundariesExternalDocName: prop.boundariesExternalDocName || undefined,
    deedStatus: prop.deedStatus || undefined,
    area: prop.area || undefined,
    city: prop.city.trim(),
    district: prop.district.trim(),
    classification: prop.classification.trim(),
    propertyType: prop.propertyType.trim(),
  };
}

export function propertyToBourseRequest(
  prop: PoPropertyIntake,
): UpdatePropertyBourseRequest {
  return {
    city: prop.city.trim(),
    district: prop.district.trim(),
    classification: prop.classification.trim(),
    propertyType: prop.propertyType.trim(),
    area: prop.area || undefined,
    deedStatus: prop.deedStatus || undefined,
    restrictionsPresent: prop.restrictionsPresent || undefined,
    boundariesAvailability: prop.boundariesAvailability || undefined,
    boundariesExternalDocName: prop.boundariesExternalDocName || undefined,
  };
}

function listItemToPoRow(item: {
  poNumber: string;
  assignmentType: string;
  propertyCount: number;
  expectedPropertyCount: number;
  completedCount: number;
  status: string;
  receivedFromEnfathAt: string;
  dueDateAt: string;
  assignmentSpecialist?: string;
}): PoRow {
  return {
    id: item.poNumber,
    type: item.assignmentType || "—",
    count: item.expectedPropertyCount || item.propertyCount || 0,
    done: item.completedCount,
    status: poListStatusForAssignmentType(
      item.assignmentType,
      item.status === "done" ? "done" : "progress",
    ),
    date: item.receivedFromEnfathAt,
    dueDate: item.dueDateAt,
    specialist: item.assignmentSpecialist?.trim() || "—",
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
    promulgationDate: record.promulgationDate,
    receivedFromEnfathTime: record.receivedFromEnfathTime || undefined,
    assignmentSpecialist: record.assignmentSpecialist.trim() || undefined,
    assignmentSpecialistEmail: record.assignmentSpecialistEmail.trim() || undefined,
    expectedPropertyCount: record.expectedPropertyCount,
    properties: record.properties.map((p) =>
      propertyToEnfathDto(p, { forInsert: true }),
    ),
  });

  if (!result.ok) {
    return {
      ok: false,
      error: resolveApiError(result.kind, result.errors),
      errors: result.errors,
    };
  }

  notifyWorkOrdersChanged();
  const saved = dtoToRecord(result.data);
  await syncTaskSlotsForPo(saved);
  return { ok: true, data: saved };
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
    count: record.expectedPropertyCount ?? record.properties.length,
    done: record.properties.filter((p) => p.bourseDataCompleted).length,
    status: poListStatusForAssignmentType(record.assignmentType, "progress"),
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

export async function findPriorDeedFull(
  deedNumber: string,
  excludePo?: string,
): Promise<import("@platform/api-client").PriorDeedRegistrationDto | null> {
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
  const boursePending = !prop.bourseDataCompleted;
  const underVerification = prop.deedStatus === "قيد التحقق";
  const isFailed =
    failure?.status === "approved" || prop.deedStatus === "موقوف";
  const incomplete = propertyHasIncompleteContact(prop);
  const area = boursePending
    ? "بانتظار البورصة"
    : prop.district
      ? `${prop.city} · ${prop.district}`
      : prop.city || "—";

  return {
    id: propertyRowId(record.poNumber, prop),
    po: record.poNumber,
    area,
    type: boursePending
      ? "—"
      : prop.propertyType || prop.classification || "—",
    key: false,
    survey: boursePending
      ? "new"
      : priorSurveyWaived(prop, priorByDeed)
        ? "done"
        : "new",
    val: "new",
    study: boursePending
      ? "progress"
      : underVerification
        ? "progress"
        : "new",
    status: boursePending
      ? "progress"
      : isFailed
        ? "fail"
        : incomplete
          ? "incomplete"
          : underVerification
            ? "progress"
            : "new",
    specialist: record.assignmentSpecialist,
  };
}

export async function loadPendingBourseItems(): Promise<
  PendingBoursePropertyDto[]
> {
  const config = workOrdersApiConfig();
  if (!config) return [];
  const result = await listPendingBourseProperties(config);
  return result.ok ? result.data : [];
}

export async function completePropertyBourse(
  poNumber: string,
  propertyId: string,
  property: PoPropertyIntake,
): Promise<StorageOk<PoPropertyIntake> | StorageError> {
  const config = workOrdersApiConfig();
  if (!config) return { ok: false, error: apiErrorMessage("auth") };

  const result = await completePropertyBourseData(
    config,
    poNumber,
    propertyId,
    propertyToBourseRequest(property),
  );
  if (!result.ok) {
    return {
      ok: false,
      error: resolveApiError(result.kind, result.errors),
      errors: result.errors,
    };
  }

  notifyWorkOrdersChanged();
  const saved = dtoToProperty(result.data);
  await advanceTaskAfterBourseForProperty(poNumber, propertyId, saved);
  return { ok: true, data: saved };
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
  await deleteTasksForPo(poNumber);
  deleteFailuresForPo(poNumber);
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
    promulgationDate: record.promulgationDate,
    receivedFromEnfathTime: record.receivedFromEnfathTime || undefined,
    assignmentSpecialist: record.assignmentSpecialist.trim() || undefined,
    assignmentSpecialistEmail: record.assignmentSpecialistEmail.trim() || undefined,
    expectedPropertyCount: record.expectedPropertyCount,
  });

  if (!result.ok) {
    return {
      ok: false,
      error: resolveApiError(result.kind, result.errors, "تعذّر حفظ التعديلات"),
      errors: result.errors,
    };
  }

  notifyWorkOrdersChanged();
  const saved = dtoToRecord(result.data);
  const full = await getPoRecord(record.poNumber);
  if (full) {
    await syncTaskSlotsForPo({
      ...full,
      expectedPropertyCount: saved.expectedPropertyCount,
      assignmentType: saved.assignmentType,
      promulgationDate: saved.promulgationDate,
      assignmentSpecialist: saved.assignmentSpecialist,
      assignmentSpecialistEmail: saved.assignmentSpecialistEmail,
    });
  } else {
    await syncTaskSlotsForPo({ ...record, ...saved, properties: record.properties });
  }
  return { ok: true, data: saved };
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
  options?: { assignToTaskId?: string },
): Promise<StorageOk<PoPropertyIntake> | StorageError> {
  const config = workOrdersApiConfig();
  if (!config) return { ok: false, error: apiErrorMessage("auth") };

  const result = await addWorkOrderProperty(
    config,
    poNumber,
    propertyToEnfathDto(property, { forInsert: true }),
  );
  if (!result.ok) {
    return {
      ok: false,
      error: resolveApiError(result.kind, result.errors),
      errors: result.errors,
    };
  }

  notifyWorkOrdersChanged();
  const prop = dtoToProperty(result.data);
  const record = await getPoRecord(poNumber);
  if (options?.assignToTaskId) {
    await advanceTaskAfterEnfath(options.assignToTaskId, prop);
  } else if (record) {
    await linkNewPropertyToTaskSlot(record, prop);
  }
  return { ok: true, data: prop };
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
  const record = await getPoRecord(poNumber);
  await deleteTasksForProperty(
    poNumber,
    propertyId,
    record?.expectedPropertyCount ?? 1,
  );
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

  const dto = property.bourseDataCompleted
    ? propertyToDto({ ...property, id: propertyId })
    : propertyToEnfathDto({ ...property, id: propertyId });

  const result = await updateWorkOrderProperty(
    config,
    poNumber,
    propertyId,
    dto,
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
  promulgationDate: string;
  assignmentSpecialist: string;
  assignmentSpecialistEmail: string;
  expectedPropertyCount: number;
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
  fields: Omit<
    PoIntakeRecord,
    | "id"
    | "dueDateAt"
    | "receivedFromEnfathAt"
    | "receivedFromEnfathTime"
    | "createdAtUtc"
  > & {
    id?: string;
    receivedFromEnfathAt?: string;
    receivedFromEnfathTime?: string;
  },
): PoIntakeRecord {
  const received =
    fields.receivedFromEnfathAt?.trim() || fields.promulgationDate;
  return {
    id:
      fields.id ??
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `po-${Date.now()}`),
    ...fields,
    properties: fields.properties ?? [],
    receivedFromEnfathAt: received,
    dueDateAt: computeBusinessDueDate(
      received,
      fields.receivedFromEnfathTime ?? "",
    ),
    receivedFromEnfathTime: fields.receivedFromEnfathTime ?? "",
    createdAtUtc: new Date().toISOString(),
  };
}
