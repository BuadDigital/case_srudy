import { apiBase } from "./index";

export type CourtsApiConfig = {
  baseUrl?: string;
  token: string;
};

export type CourtCatalogEntryDto = {
  id: string;
  city: string;
  court: string;
  circuits: string[];
};

function headers(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export type CourtsListResult =
  | { ok: true; entries: CourtCatalogEntryDto[] }
  | { ok: false; kind: "auth" | "network" | "server" };

export async function listCourts(
  config: CourtsApiConfig,
): Promise<CourtsListResult> {
  const base = config.baseUrl ?? apiBase;
  try {
    const res = await fetch(`${base}/api/courts`, {
      headers: headers(config.token),
    });
    if (res.status === 401) return { ok: false, kind: "auth" };
    if (!res.ok) return { ok: false, kind: "server" };
    const entries = (await res.json()) as CourtCatalogEntryDto[];
    return { ok: true, entries: Array.isArray(entries) ? entries : [] };
  } catch {
    return { ok: false, kind: "network" };
  }
}

export async function replaceCourtsCatalog(
  config: CourtsApiConfig,
  entries: CourtCatalogEntryDto[],
): Promise<CourtsListResult> {
  const base = config.baseUrl ?? apiBase;
  try {
    const res = await fetch(`${base}/api/courts`, {
      method: "PUT",
      headers: headers(config.token),
      body: JSON.stringify({ entries }),
    });
    if (res.status === 401) return { ok: false, kind: "auth" };
    if (!res.ok) return { ok: false, kind: "server" };
    const list = (await res.json()) as CourtCatalogEntryDto[];
    return { ok: true, entries: Array.isArray(list) ? list : [] };
  } catch {
    return { ok: false, kind: "network" };
  }
}
