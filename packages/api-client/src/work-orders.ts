import { apiBase } from "./index";

export type WorkOrdersApiConfig = {
  baseUrl?: string;
  token: string;
};

function headers(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export type PropertyContactDto = {
  name: string;
  phone: string;
};

export type WorkOrderPropertyDto = {
  id?: string;
  identifierType: string;
  deedNumber: string;
  deedDate?: string;
  ownerName?: string;
  restrictions?: string;
  boundariesMatch?: string;
  city: string;
  district: string;
  deedStatus?: string;
  area?: string;
  boundaries?: string;
  court?: string;
  circuit?: string;
  classification: string;
  propertyType: string;
  assignmentDocFileName?: string;
  realEstateRegFileName?: string;
  contacts: PropertyContactDto[];
};

export type WorkOrderDto = {
  id: string;
  poNumber: string;
  assignmentType: string;
  receivedFromEnfathAt: string;
  receivedFromEnfathTime?: string;
  internalAssignmentAt: string;
  assignmentSpecialist: string;
  dueDateAt: string;
  createdAtUtc: string;
  properties: WorkOrderPropertyDto[];
};

export type WorkOrderListItemDto = {
  poNumber: string;
  assignmentType: string;
  propertyCount: number;
  completedCount: number;
  status: string;
  receivedFromEnfathAt: string;
  dueDateAt: string;
  assignmentSpecialist: string;
};

export type CreateWorkOrderRequest = {
  poNumber: string;
  assignmentType: string;
  receivedFromEnfathAt: string;
  receivedFromEnfathTime?: string;
  internalAssignmentAt: string;
  assignmentSpecialist: string;
  properties: WorkOrderPropertyDto[];
};

export type UpdateWorkOrderHeaderRequest = {
  assignmentType: string;
  receivedFromEnfathAt: string;
  receivedFromEnfathTime?: string;
  internalAssignmentAt: string;
  assignmentSpecialist: string;
};

type FieldErrorsBody = { errors?: Record<string, string> };

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = {
  ok: false;
  kind: "auth" | "network" | "validation" | "server" | "not_found";
  message?: string;
  errors?: Record<string, string>;
};

async function parseFieldErrors(res: Response): Promise<Record<string, string>> {
  try {
    const body = (await res.json()) as FieldErrorsBody;
    return body.errors ?? {};
  } catch {
    return {};
  }
}

export async function listWorkOrders(
  config: WorkOrdersApiConfig,
): Promise<ApiOk<WorkOrderListItemDto[]> | ApiErr> {
  const base = config.baseUrl ?? apiBase;
  try {
    const res = await fetch(`${base}/api/work-orders`, {
      headers: headers(config.token),
    });
    if (res.status === 401) return { ok: false, kind: "auth" };
    if (!res.ok) return { ok: false, kind: "server" };
    const data = (await res.json()) as WorkOrderListItemDto[];
    return { ok: true, data: Array.isArray(data) ? data : [] };
  } catch {
    return { ok: false, kind: "network" };
  }
}

export async function getWorkOrder(
  config: WorkOrdersApiConfig,
  poNumber: string,
): Promise<ApiOk<WorkOrderDto> | ApiErr> {
  const base = config.baseUrl ?? apiBase;
  const encoded = encodeURIComponent(poNumber.trim());
  try {
    const res = await fetch(`${base}/api/work-orders/${encoded}`, {
      headers: headers(config.token),
    });
    if (res.status === 401) return { ok: false, kind: "auth" };
    if (res.status === 404) return { ok: false, kind: "not_found" };
    if (!res.ok) return { ok: false, kind: "server" };
    return { ok: true, data: (await res.json()) as WorkOrderDto };
  } catch {
    return { ok: false, kind: "network" };
  }
}

export async function workOrderExists(
  config: WorkOrdersApiConfig,
  poNumber: string,
): Promise<ApiOk<boolean> | ApiErr> {
  const base = config.baseUrl ?? apiBase;
  try {
    const res = await fetch(
      `${base}/api/work-orders/exists?poNumber=${encodeURIComponent(poNumber.trim())}`,
      { headers: headers(config.token) },
    );
    if (res.status === 401) return { ok: false, kind: "auth" };
    if (!res.ok) return { ok: false, kind: "server" };
    return { ok: true, data: (await res.json()) as boolean };
  } catch {
    return { ok: false, kind: "network" };
  }
}

export async function findPriorDeed(
  config: WorkOrdersApiConfig,
  deedNumber: string,
  excludePo?: string,
): Promise<ApiOk<{ poNumber: string } | null> | ApiErr> {
  const base = config.baseUrl ?? apiBase;
  const params = new URLSearchParams({ deedNumber: deedNumber.trim() });
  if (excludePo?.trim()) params.set("excludePo", excludePo.trim());
  try {
    const res = await fetch(`${base}/api/work-orders/deeds/prior?${params}`, {
      headers: headers(config.token),
    });
    if (res.status === 401) return { ok: false, kind: "auth" };
    if (res.status === 404) return { ok: true, data: null };
    if (!res.ok) return { ok: false, kind: "server" };
    return { ok: true, data: (await res.json()) as { poNumber: string } };
  } catch {
    return { ok: false, kind: "network" };
  }
}

export async function createWorkOrder(
  config: WorkOrdersApiConfig,
  body: CreateWorkOrderRequest,
): Promise<ApiOk<WorkOrderDto> | ApiErr> {
  const base = config.baseUrl ?? apiBase;
  try {
    const res = await fetch(`${base}/api/work-orders`, {
      method: "POST",
      headers: headers(config.token),
      body: JSON.stringify(body),
    });
    if (res.status === 401) return { ok: false, kind: "auth" };
    if (res.status === 400) {
      return {
        ok: false,
        kind: "validation",
        errors: await parseFieldErrors(res),
      };
    }
    if (!res.ok) return { ok: false, kind: "server" };
    return { ok: true, data: (await res.json()) as WorkOrderDto };
  } catch {
    return { ok: false, kind: "network" };
  }
}

export async function updateWorkOrderHeader(
  config: WorkOrdersApiConfig,
  poNumber: string,
  body: UpdateWorkOrderHeaderRequest,
): Promise<ApiOk<WorkOrderDto> | ApiErr> {
  const base = config.baseUrl ?? apiBase;
  try {
    const res = await fetch(
      `${base}/api/work-orders/${encodeURIComponent(poNumber.trim())}`,
      {
        method: "PUT",
        headers: headers(config.token),
        body: JSON.stringify(body),
      },
    );
    if (res.status === 401) return { ok: false, kind: "auth" };
    if (res.status === 400) {
      return {
        ok: false,
        kind: "validation",
        errors: await parseFieldErrors(res),
      };
    }
    if (res.status === 404) return { ok: false, kind: "not_found" };
    if (!res.ok) return { ok: false, kind: "server" };
    return { ok: true, data: (await res.json()) as WorkOrderDto };
  } catch {
    return { ok: false, kind: "network" };
  }
}

export async function deleteWorkOrder(
  config: WorkOrdersApiConfig,
  poNumber: string,
): Promise<ApiOk<void> | ApiErr> {
  const base = config.baseUrl ?? apiBase;
  try {
    const res = await fetch(
      `${base}/api/work-orders/${encodeURIComponent(poNumber.trim())}`,
      { method: "DELETE", headers: headers(config.token) },
    );
    if (res.status === 401) return { ok: false, kind: "auth" };
    if (!res.ok) {
      const message =
        res.status === 400
          ? ((await res.json()) as { message?: string }).message
          : undefined;
      return { ok: false, kind: "server", message };
    }
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, kind: "network" };
  }
}

export async function addWorkOrderProperty(
  config: WorkOrdersApiConfig,
  poNumber: string,
  property: WorkOrderPropertyDto,
): Promise<ApiOk<WorkOrderPropertyDto> | ApiErr> {
  const base = config.baseUrl ?? apiBase;
  try {
    const res = await fetch(
      `${base}/api/work-orders/${encodeURIComponent(poNumber.trim())}/properties`,
      {
        method: "POST",
        headers: headers(config.token),
        body: JSON.stringify(property),
      },
    );
    if (res.status === 401) return { ok: false, kind: "auth" };
    if (res.status === 400) {
      return {
        ok: false,
        kind: "validation",
        errors: await parseFieldErrors(res),
      };
    }
    if (res.status === 404) return { ok: false, kind: "not_found" };
    if (!res.ok) return { ok: false, kind: "server" };
    return { ok: true, data: (await res.json()) as WorkOrderPropertyDto };
  } catch {
    return { ok: false, kind: "network" };
  }
}

export async function updateWorkOrderProperty(
  config: WorkOrdersApiConfig,
  poNumber: string,
  propertyId: string,
  property: WorkOrderPropertyDto,
): Promise<ApiOk<WorkOrderPropertyDto> | ApiErr> {
  const base = config.baseUrl ?? apiBase;
  try {
    const res = await fetch(
      `${base}/api/work-orders/${encodeURIComponent(poNumber.trim())}/properties/${propertyId}`,
      {
        method: "PUT",
        headers: headers(config.token),
        body: JSON.stringify(property),
      },
    );
    if (res.status === 401) return { ok: false, kind: "auth" };
    if (res.status === 400) {
      return {
        ok: false,
        kind: "validation",
        errors: await parseFieldErrors(res),
      };
    }
    if (res.status === 404) return { ok: false, kind: "not_found" };
    if (!res.ok) return { ok: false, kind: "server" };
    return { ok: true, data: (await res.json()) as WorkOrderPropertyDto };
  } catch {
    return { ok: false, kind: "network" };
  }
}

export async function deleteWorkOrderProperty(
  config: WorkOrdersApiConfig,
  poNumber: string,
  propertyId: string,
): Promise<ApiOk<void> | ApiErr> {
  const base = config.baseUrl ?? apiBase;
  try {
    const res = await fetch(
      `${base}/api/work-orders/${encodeURIComponent(poNumber.trim())}/properties/${propertyId}`,
      { method: "DELETE", headers: headers(config.token) },
    );
    if (res.status === 401) return { ok: false, kind: "auth" };
    if (!res.ok) {
      const message =
        res.status === 400
          ? ((await res.json()) as { message?: string }).message
          : undefined;
      return { ok: false, kind: "server", message };
    }
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, kind: "network" };
  }
}
