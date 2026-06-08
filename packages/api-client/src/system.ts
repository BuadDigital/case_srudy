import { getApiBase } from "./index";

export type SystemApiConfig = {
  baseUrl?: string;
  token: string;
};

export type SystemResetResult = {
  workOrdersDeleted: number;
  workflowTasksDeleted: number;
  caseStudyFormsDeleted: number;
  courtCatalogEntriesDeleted: number;
  registeredUsersDeleted: number;
};

export type ResetSystemDataResult =
  | { ok: true; data: SystemResetResult }
  | {
      ok: false;
      kind: "auth" | "forbidden" | "network" | "server" | "not_found";
      status?: number;
      detail?: string;
    };

function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function resetSystemData(
  config: SystemApiConfig,
): Promise<ResetSystemDataResult> {
  const base = config.baseUrl ?? getApiBase();
  try {
    const res = await fetch(`${base}/api/system/data`, {
      method: "DELETE",
      headers: headers(config.token),
    });
    if (res.status === 401) return { ok: false, kind: "auth", status: 401 };
    if (res.status === 403) return { ok: false, kind: "forbidden", status: 403 };
    if (res.status === 404) return { ok: false, kind: "not_found", status: 404 };
    if (!res.ok) {
      let detail: string | undefined;
      try {
        const body = (await res.json()) as { title?: string; detail?: string };
        detail = body.detail ?? body.title;
      } catch {
        try {
          detail = (await res.text()).slice(0, 200) || undefined;
        } catch {
          detail = undefined;
        }
      }
      return { ok: false, kind: "server", status: res.status, detail };
    }
    const data = (await res.json()) as {
      workOrdersDeleted?: number;
      workflowTasksDeleted?: number;
      caseStudyFormsDeleted?: number;
      courtCatalogEntriesDeleted?: number;
      registeredUsersDeleted?: number;
    };
    return {
      ok: true,
      data: {
        workOrdersDeleted: data.workOrdersDeleted ?? 0,
        workflowTasksDeleted: data.workflowTasksDeleted ?? 0,
        caseStudyFormsDeleted: data.caseStudyFormsDeleted ?? 0,
        courtCatalogEntriesDeleted: data.courtCatalogEntriesDeleted ?? 0,
        registeredUsersDeleted: data.registeredUsersDeleted ?? 0,
      },
    };
  } catch {
    return { ok: false, kind: "network" };
  }
}
