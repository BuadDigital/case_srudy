import {
  FAILURE_PROBLEM_TYPES,
  FAILURE_TYPE_CATEGORIES,
  type FailureProblemType,
  type FailureTypeCategory,
} from "./failure-types-data";
import { notifyFailureTypesChanged } from "./failure-types-events";

export const FAILURE_TYPES_STORAGE_KEY = "evalFailureTypesCatalog";

export type FailureTypesCatalog = {
  categories: FailureTypeCategory[];
  problemTypes: FailureProblemType[];
};

function seedCatalog(): FailureTypesCatalog {
  return {
    categories: [...FAILURE_TYPE_CATEGORIES],
    problemTypes: [...FAILURE_PROBLEM_TYPES],
  };
}

function readCatalog(): FailureTypesCatalog {
  if (typeof window === "undefined") return seedCatalog();
  try {
    const raw = localStorage.getItem(FAILURE_TYPES_STORAGE_KEY);
    if (!raw) {
      const seeded = seedCatalog();
      writeCatalog(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw) as FailureTypesCatalog;
    if (
      !parsed ||
      !Array.isArray(parsed.categories) ||
      !Array.isArray(parsed.problemTypes)
    ) {
      return seedCatalog();
    }
    return parsed;
  } catch {
    return seedCatalog();
  }
}

export function loadFailureTypesCatalog(): FailureTypesCatalog {
  return readCatalog();
}

function writeCatalog(catalog: FailureTypesCatalog): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FAILURE_TYPES_STORAGE_KEY, JSON.stringify(catalog));
  notifyFailureTypesChanged();
}

export function saveFailureTypesCatalog(catalog: FailureTypesCatalog): void {
  writeCatalog(catalog);
}

export function resetFailureTypesCatalog(): FailureTypesCatalog {
  const seeded = seedCatalog();
  writeCatalog(seeded);
  return seeded;
}

export function addFailureProblemType(input: {
  categoryId: string;
  label: string;
  description?: string;
}): FailureTypesCatalog {
  const catalog = readCatalog();
  const maxOrder = catalog.problemTypes.reduce(
    (n, t) => Math.max(n, t.order),
    0,
  );
  const id = `custom-${Date.now()}`;
  const next: FailureTypesCatalog = {
    ...catalog,
    problemTypes: [
      ...catalog.problemTypes,
      {
        id,
        categoryId: input.categoryId,
        label: input.label.trim(),
        description: input.description?.trim() || undefined,
        order: maxOrder + 1,
      },
    ],
  };
  writeCatalog(next);
  return next;
}

export function removeFailureProblemType(id: string): FailureTypesCatalog {
  const catalog = readCatalog();
  const next: FailureTypesCatalog = {
    ...catalog,
    problemTypes: catalog.problemTypes.filter((t) => t.id !== id),
  };
  writeCatalog(next);
  return next;
}
