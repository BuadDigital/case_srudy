import { listCourts, replaceCourtsCatalog } from "@platform/api-client";
import { COURTS_BY_CITY } from "@case-study/mfe";
import {
  apiErrorMessage,
  courtsApiConfig,
} from "@case-study/mfe";

export type CourtCatalogEntry = {
  id: string;
  city: string;
  court: string;
  circuits: string[];
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `c-${Date.now()}`;
}

function seedFromDefaults(): CourtCatalogEntry[] {
  const entries: CourtCatalogEntry[] = [];
  for (const [city, courts] of Object.entries(COURTS_BY_CITY)) {
    for (const c of courts) {
      entries.push({
        id: newId(),
        city,
        court: c.court,
        circuits: [...c.circuits],
      });
    }
  }
  return entries;
}

export async function loadCourtsCatalog(): Promise<CourtCatalogEntry[]> {
  const config = courtsApiConfig();
  if (!config) return seedFromDefaults();

  const result = await listCourts(config);
  if (!result.ok) {
    console.warn(apiErrorMessage(result.kind, "Courts API"));
    return seedFromDefaults();
  }

  return result.entries.map((e) => ({
    id: String(e.id),
    city: e.city,
    court: e.court,
    circuits: e.circuits ?? [],
  }));
}

export async function saveCourtsCatalog(
  entries: CourtCatalogEntry[],
): Promise<boolean> {
  const config = courtsApiConfig();
  if (!config) return false;

  const result = await replaceCourtsCatalog(
    config,
    entries.map((e) => ({
      id: e.id,
      city: e.city,
      court: e.court,
      circuits: e.circuits,
    })),
  );
  return result.ok;
}
