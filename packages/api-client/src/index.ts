/**
 * API base URL. In the browser, uses the same host as the page (LAN-friendly).
 * Override with NEXT_PUBLIC_API_URL when needed.
 */
export function getApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  // Browser: same origin — Next.js rewrites /api/* to the backend (works on LAN).
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  const port = process.env.NEXT_PUBLIC_API_PORT ?? "5160";
  return `http://127.0.0.1:${port}`;
}

/** @deprecated Prefer getApiBase() — resolved once at import (SSR uses localhost). */
export const apiBase = getApiBase();

export type ApiClientConfig = {
  baseUrl?: string;
  getToken?: () => string | null;
};

/** Placeholder — extend when wiring real HTTP calls. */
export function createApiClient(config: ApiClientConfig = {}) {
  const baseUrl = config.baseUrl ?? getApiBase();
  return {
    baseUrl,
    getToken: config.getToken ?? (() => null),
  };
}

export {
  createCrmUser,
  createHrUser,
  createProcUser,
  fetchOrganizationOverview,
  listUsers,
  type CreateUserResult,
  type ListUsersResult,
  type OrganizationOverviewResult,
  type UsersApiConfig,
} from "./users";

export {
  addWorkOrderProperty,
  completePropertyBourseData,
  createWorkOrder,
  deleteWorkOrder,
  deleteWorkOrderProperty,
  findPriorDeed,
  getWorkOrder,
  listPendingBourseProperties,
  listWorkOrders,
  updateWorkOrderHeader,
  updateWorkOrderProperty,
  workOrderExists,
  type ApiErr,
  type ApiOk,
  type CreateWorkOrderRequest,
  type PendingBoursePropertyDto,
  type PriorDeedRegistrationDto,
  type PropertyContactDto,
  type UpdatePropertyBourseRequest,
  type UpdateWorkOrderHeaderRequest,
  type WorkOrderDto,
  type WorkOrderListItemDto,
  type WorkOrderPropertyDto,
  type WorkOrdersApiConfig,
} from "./work-orders";

export {
  listCourts,
  replaceCourtsCatalog,
  type CourtCatalogEntryDto,
  type CourtsApiConfig,
  type CourtsListResult,
} from "./courts";
