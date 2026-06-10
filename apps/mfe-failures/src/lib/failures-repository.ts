import { localFailuresRepository } from "./failures-local-storage";
import type {
  BourseObstructionInput,
  CreateFailureInput,
  FailureRecord,
  ResolveFailureInput,
} from "./failures-types";

export type FailuresRepository = {
  loadFailures(): FailureRecord[];
  createFailure(input: CreateFailureInput): FailureRecord;
  upgradeFailureToInternal(id: string): FailureRecord | null;
  submitFailureForReview(id: string): FailureRecord | null;
  resolveFailure(id: string, input: ResolveFailureInput): FailureRecord | null;
  approveFailure(id: string, finalNote: string): FailureRecord | null;
  returnFailure(id: string, finalNote: string): FailureRecord | null;
  deleteFailuresForPo(poNumber: string): void;
  getPropertyFailure(
    poNumber: string,
    propertyId: string,
  ): FailureRecord | null;
  reportBourseObstructionToSupervisor(
    input: BourseObstructionInput,
  ): FailureRecord;
};

let activeRepository: FailuresRepository = localFailuresRepository;

/** Active failures backend — localStorage today; swap via `setFailuresRepository` when API exists. */
export function getFailuresRepository(): FailuresRepository {
  return activeRepository;
}

/** Test hook / future API migration — replace the active repository implementation. */
export function setFailuresRepository(repository: FailuresRepository): void {
  activeRepository = repository;
}

export function loadFailures(): FailureRecord[] {
  return getFailuresRepository().loadFailures();
}

export function createFailure(input: CreateFailureInput): FailureRecord {
  return getFailuresRepository().createFailure(input);
}

export function upgradeFailureToInternal(id: string): FailureRecord | null {
  return getFailuresRepository().upgradeFailureToInternal(id);
}

export function resolveFailure(
  id: string,
  input: ResolveFailureInput,
): FailureRecord | null {
  return getFailuresRepository().resolveFailure(id, input);
}

export function submitFailureForReview(id: string): FailureRecord | null {
  return getFailuresRepository().submitFailureForReview(id);
}

export function approveFailure(
  id: string,
  finalNote: string,
): FailureRecord | null {
  return getFailuresRepository().approveFailure(id, finalNote);
}

export function returnFailure(
  id: string,
  finalNote: string,
): FailureRecord | null {
  return getFailuresRepository().returnFailure(id, finalNote);
}

export function deleteFailuresForPo(poNumber: string): void {
  getFailuresRepository().deleteFailuresForPo(poNumber);
}

export function getPropertyFailure(
  poNumber: string,
  propertyId: string,
): FailureRecord | null {
  return getFailuresRepository().getPropertyFailure(poNumber, propertyId);
}

export function reportBourseObstructionToSupervisor(
  input: BourseObstructionInput,
): FailureRecord {
  return getFailuresRepository().reportBourseObstructionToSupervisor(input);
}
