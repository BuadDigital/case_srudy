export const SUSPENDED_TRANSACTIONS_STORAGE_KEY = "evalSuspendedTransactions";
export const SUSPENDED_TRANSACTIONS_CHANGED_EVENT =
  "suspended-transactions-changed";

export type SuspendedTransaction = {
  id: string;
  poNumber: string;
  propertyId: string;
  failureId: string;
  deedNumber: string;
  title: string;
  internalNote: string;
  raisedByRole: string;
  specialist: string;
  supervisorNote: string;
  suspendedAt: string;
  suspendedBy: string;
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `s-${Date.now()}`;
}

function notifyChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SUSPENDED_TRANSACTIONS_CHANGED_EVENT));
}

function readAll(): SuspendedTransaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SUSPENDED_TRANSACTIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SuspendedTransaction[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(list: SuspendedTransaction[]): void {
  localStorage.setItem(SUSPENDED_TRANSACTIONS_STORAGE_KEY, JSON.stringify(list));
  notifyChanged();
}

export function loadSuspendedTransactions(): SuspendedTransaction[] {
  return readAll();
}

export function propertySuspensionKey(poNumber: string, propertyId: string): string {
  return `${poNumber.trim()}:${propertyId}`;
}

export function isPropertySuspended(
  poNumber: string,
  propertyId: string | undefined,
): boolean {
  if (!propertyId) return false;
  const key = propertySuspensionKey(poNumber, propertyId);
  return readAll().some(
    (item) => propertySuspensionKey(item.poNumber, item.propertyId) === key,
  );
}

export function isTaskOnSuspendedProperty(task: {
  poNumber: string;
  propertyId?: string;
}): boolean {
  if (!task.propertyId) return false;
  return isPropertySuspended(task.poNumber, task.propertyId);
}

export function getSuspendedTransaction(
  poNumber: string,
  propertyId: string,
): SuspendedTransaction | null {
  const key = propertySuspensionKey(poNumber, propertyId);
  return (
    readAll().find(
      (item) => propertySuspensionKey(item.poNumber, item.propertyId) === key,
    ) ?? null
  );
}

export function addSuspendedTransaction(
  input: Omit<SuspendedTransaction, "id" | "suspendedAt">,
): SuspendedTransaction {
  const key = propertySuspensionKey(input.poNumber, input.propertyId);
  const withoutDup = readAll().filter(
    (item) => propertySuspensionKey(item.poNumber, item.propertyId) !== key,
  );
  const record: SuspendedTransaction = {
    ...input,
    id: newId(),
    suspendedAt: new Date().toISOString(),
  };
  writeAll([record, ...withoutDup]);
  return record;
}

export function countSuspendedTransactions(): number {
  return readAll().length;
}
