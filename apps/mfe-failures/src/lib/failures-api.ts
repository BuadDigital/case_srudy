import {
  approveFailure as apiApproveFailure,
  createFailure as apiCreateFailure,
  deleteFailuresForPo as apiDeleteFailuresForPo,
  dtoToFailureRecord,
  listFailures,
  reportBourseObstruction as apiReportBourseObstruction,
  resolveFailure as apiResolveFailure,
  returnFailure as apiReturnFailure,
  submitFailureForReview as apiSubmitFailureForReview,
  suspendFailure as apiSuspendFailure,
  upgradeFailureToInternal as apiUpgradeFailureToInternal,
  type FailureRecordDto,
  type FailuresApiConfig,
} from "@platform/api-client";
import {
  notifyWorkOrdersChanged,
  workOrdersApiConfig,
} from "@platform/app-shared/prototype/work-orders-api-config";
import { notifyTasksChanged } from "@case-study/mfe/lib/prototype/tasks-storage";
import {
  getCachedFailuresList,
  getCachedPropertyFailure,
  removeCachedFailuresForPo,
  setCachedFailuresList,
  upsertCachedFailure,
} from "./failures-cache";
import { notifyFailuresChanged } from "./failures-events";
import { localFailuresRepository } from "./failures-local-storage";
import type {
  BourseObstructionInput,
  CreateFailureInput,
  FailureRecord,
  FailureSeverity,
  FailureStatus,
  ResolveFailureInput,
} from "./failures-types";

export type { FailuresApiConfig };

export function failuresApiConfig(): FailuresApiConfig | null {
  return workOrdersApiConfig();
}

function mapDto(dto: FailureRecordDto): FailureRecord {
  const raw = dtoToFailureRecord(dto);
  return {
    ...raw,
    severity: raw.severity as FailureSeverity,
    status: raw.status as FailureStatus,
  };
}

function notifyDownstreamChanges(): void {
  notifyFailuresChanged();
  notifyWorkOrdersChanged();
  notifyTasksChanged();
}

function applyMutation(record: FailureRecord): FailureRecord {
  upsertCachedFailure(record);
  notifyDownstreamChanges();
  return record;
}

export async function loadFailuresFromBackend(): Promise<FailureRecord[]> {
  const config = failuresApiConfig();
  if (!config) {
    const local = localFailuresRepository.loadFailures();
    setCachedFailuresList(local);
    return local;
  }

  const result = await listFailures(config);
  if (result.ok) {
    const mapped = result.data.map(mapDto);
    setCachedFailuresList(mapped);
    return mapped;
  }

  const cached = getCachedFailuresList();
  if (cached.length > 0) return cached;

  const local = localFailuresRepository.loadFailures();
  setCachedFailuresList(local);
  return local;
}

export function getPropertyFailureFromCache(
  poNumber: string,
  propertyId: string,
): FailureRecord | null {
  const config = failuresApiConfig();
  if (!config) {
    return localFailuresRepository.getPropertyFailure(poNumber, propertyId);
  }
  return getCachedPropertyFailure(poNumber, propertyId);
}

export async function createFailureAsync(
  input: CreateFailureInput,
): Promise<FailureRecord> {
  const config = failuresApiConfig();
  if (!config) {
    const record = localFailuresRepository.createFailure(input);
    upsertCachedFailure(record);
    notifyFailuresChanged();
    return record;
  }

  const result = await apiCreateFailure(config, {
    poNumber: input.poNumber,
    propertyId: input.propertyId,
    deedNumber: input.deedNumber,
    problemTypeId: input.problemTypeId,
    severity: input.severity,
    raisedByRole: input.raisedByRole,
    title: input.title,
    internalNote: input.internalNote,
    specialist: input.specialist,
  });
  if (!result.ok) {
    throw new Error(`createFailure failed: ${result.kind}`);
  }
  return applyMutation(mapDto(result.data));
}

export async function reportBourseObstructionAsync(
  input: BourseObstructionInput,
): Promise<FailureRecord> {
  const config = failuresApiConfig();
  if (!config) {
    const record =
      localFailuresRepository.reportBourseObstructionToSupervisor(input);
    upsertCachedFailure(record);
    notifyFailuresChanged();
    return record;
  }

  const result = await apiReportBourseObstruction(config, input);
  if (!result.ok) {
    throw new Error(`reportBourseObstruction failed: ${result.kind}`);
  }
  return applyMutation(mapDto(result.data));
}

async function mutateFailure(
  id: string,
  apiCall: (
    config: FailuresApiConfig,
    failureId: string,
  ) => Promise<
    | { ok: true; data: FailureRecordDto }
    | { ok: false; kind: string }
  >,
  localCall: (failureId: string) => FailureRecord | null,
): Promise<FailureRecord | null> {
  const config = failuresApiConfig();
  if (!config) {
    const record = localCall(id);
    if (record) upsertCachedFailure(record);
    if (record) notifyFailuresChanged();
    return record;
  }

  const result = await apiCall(config, id);
  if (!result.ok) return null;
  return applyMutation(mapDto(result.data));
}

export async function upgradeFailureToInternalAsync(
  id: string,
): Promise<FailureRecord | null> {
  return mutateFailure(
    id,
    (config, failureId) => apiUpgradeFailureToInternal(config, failureId),
    (failureId) => localFailuresRepository.upgradeFailureToInternal(failureId),
  );
}

export async function submitFailureForReviewAsync(
  id: string,
): Promise<FailureRecord | null> {
  return mutateFailure(
    id,
    (config, failureId) => apiSubmitFailureForReview(config, failureId),
    (failureId) => localFailuresRepository.submitFailureForReview(failureId),
  );
}

export async function suspendFailureAsync(
  id: string,
  note: string,
): Promise<FailureRecord | null> {
  const config = failuresApiConfig();
  if (!config) {
    const record = localFailuresRepository.suspendFailure(id, note);
    if (record) upsertCachedFailure(record);
    if (record) notifyFailuresChanged();
    return record;
  }

  const result = await apiSuspendFailure(config, id, note);
  if (!result.ok) return null;
  return applyMutation(mapDto(result.data));
}

export async function resolveFailureAsync(
  id: string,
  input: ResolveFailureInput,
): Promise<FailureRecord | null> {
  const config = failuresApiConfig();
  if (!config) {
    const record = localFailuresRepository.resolveFailure(id, input);
    if (record) upsertCachedFailure(record);
    if (record) notifyDownstreamChanges();
    return record;
  }

  const result = await apiResolveFailure(config, id, input);
  if (!result.ok) return null;
  return applyMutation(mapDto(result.data));
}

export async function approveFailureAsync(
  id: string,
  finalNote: string,
): Promise<FailureRecord | null> {
  const config = failuresApiConfig();
  if (!config) {
    const record = localFailuresRepository.approveFailure(id, finalNote);
    if (record) upsertCachedFailure(record);
    if (record) notifyDownstreamChanges();
    return record;
  }

  const result = await apiApproveFailure(config, id, finalNote);
  if (!result.ok) return null;
  return applyMutation(mapDto(result.data));
}

export async function returnFailureAsync(
  id: string,
  finalNote: string,
): Promise<FailureRecord | null> {
  const config = failuresApiConfig();
  if (!config) {
    const record = localFailuresRepository.returnFailure(id, finalNote);
    if (record) upsertCachedFailure(record);
    if (record) notifyDownstreamChanges();
    return record;
  }

  const result = await apiReturnFailure(config, id, finalNote);
  if (!result.ok) return null;
  return applyMutation(mapDto(result.data));
}

export async function deleteFailuresForPoAsync(
  poNumber: string,
): Promise<void> {
  const config = failuresApiConfig();
  if (!config) {
    localFailuresRepository.deleteFailuresForPo(poNumber);
    removeCachedFailuresForPo(poNumber);
    notifyFailuresChanged();
    return;
  }

  const result = await apiDeleteFailuresForPo(config, poNumber);
  if (!result.ok) return;
  removeCachedFailuresForPo(poNumber);
  notifyFailuresChanged();
}
