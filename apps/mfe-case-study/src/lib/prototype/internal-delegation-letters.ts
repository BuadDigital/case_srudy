import type { PoIntakeRecord, PoPropertyIntake } from "./po-intake-data";
import { showsCourtFields } from "./po-intake-data";
import { propertyCourtCity } from "./reviewer-coverage";

export type InternalDelegationLetter = {
  id: string;
  poNumber: string;
  city: string;
  court: string;
  circuit: string;
  selectedPropertyIds: string[];
  createdAt: string;
};

const STORAGE_KEY = "evalInternalDelegationLetters";

function readAll(): InternalDelegationLetter[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as InternalDelegationLetter[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(letters: InternalDelegationLetter[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(letters));
}

function letterId(poNumber: string, court: string): string {
  return `${poNumber.trim()}::${court.trim()}`;
}

function propertiesForCourt(
  record: PoIntakeRecord,
  court: string,
): PoPropertyIntake[] {
  const normalized = court.trim();
  return record.properties.filter((p) => p.court.trim() === normalized);
}

export function syncInternalDelegationLetters(
  record: PoIntakeRecord,
): InternalDelegationLetter[] {
  if (!showsCourtFields(record.assignmentType)) return [];

  const existing = readAll();
  const byId = new Map(existing.map((l) => [l.id, l]));
  const next: InternalDelegationLetter[] = [];
  const courts = new Set<string>();

  for (const property of record.properties) {
    const court = property.court.trim();
    if (!court) continue;
    courts.add(court);
  }

  for (const court of courts) {
    const properties = propertiesForCourt(record, court);
    const sample = properties[0];
    if (!sample) continue;
    const id = letterId(record.poNumber, court);
    const prior = byId.get(id);
    const propertyIds = properties.map((p) => p.id);
    const selected =
      prior?.selectedPropertyIds.filter((pid) => propertyIds.includes(pid)) ??
      propertyIds;

    next.push({
      id,
      poNumber: record.poNumber,
      city: propertyCourtCity(sample, record),
      court,
      circuit: sample.circuit.trim() || "—",
      selectedPropertyIds: selected.length > 0 ? selected : propertyIds,
      createdAt: prior?.createdAt ?? new Date().toISOString(),
    });
  }

  const poPrefix = `${record.poNumber.trim()}::`;
  const merged = [
    ...existing.filter((l) => !l.id.startsWith(poPrefix)),
    ...next,
  ];
  writeAll(merged);
  return next;
}

export function loadInternalDelegationLetters(
  poNumber: string,
): InternalDelegationLetter[] {
  const prefix = `${poNumber.trim()}::`;
  return readAll().filter((l) => l.id.startsWith(prefix));
}

export function updateDelegationLetterSelection(
  letterIdValue: string,
  selectedPropertyIds: string[],
): void {
  const letters = readAll();
  const idx = letters.findIndex((l) => l.id === letterIdValue);
  if (idx < 0) return;
  letters[idx] = { ...letters[idx], selectedPropertyIds };
  writeAll(letters);
}

export function delegationLetterForCourt(
  poNumber: string,
  court: string,
  record?: PoIntakeRecord,
): InternalDelegationLetter | null {
  const letters = loadInternalDelegationLetters(poNumber);
  const found = letters.find((l) => l.court.trim() === court.trim());
  if (found) return found;
  if (!record) return null;
  const synced = syncInternalDelegationLetters(record);
  return synced.find((l) => l.court.trim() === court.trim()) ?? null;
}
