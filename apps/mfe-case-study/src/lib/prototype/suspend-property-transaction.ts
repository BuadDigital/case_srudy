import { suspendFailure } from "@failures/mfe";
import type { FailureRecord } from "@failures/mfe";
import {
  addSuspendedTransaction,
  isPropertySuspended,
} from "./suspended-transactions-storage";
import { suspendWorkflowTasksForProperty } from "./tasks-storage";

export async function suspendPropertyTransaction(input: {
  failure: FailureRecord;
  supervisorNote: string;
  suspendedBy: string;
}): Promise<boolean> {
  const { failure } = input;
  if (isPropertySuspended(failure.poNumber, failure.propertyId)) return false;

  const suspended = suspendFailure(failure.id, input.supervisorNote.trim());
  if (!suspended) return false;

  await suspendWorkflowTasksForProperty(
    failure.poNumber,
    failure.propertyId,
    input.supervisorNote.trim() || failure.title,
  );

  addSuspendedTransaction({
    poNumber: failure.poNumber,
    propertyId: failure.propertyId,
    failureId: failure.id,
    deedNumber: failure.deedNumber,
    title: failure.title,
    internalNote: failure.internalNote,
    raisedByRole: failure.raisedByRole,
    specialist: failure.specialist,
    supervisorNote: input.supervisorNote.trim(),
    suspendedBy: input.suspendedBy,
  });

  return true;
}
