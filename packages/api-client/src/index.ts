/**
 * API base URL for the future gateway / services.
 * Domain clients (case-study, valuation, …) will live here once backend contracts are agreed.
 */
export const apiBase =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5160";

export type ApiClientConfig = {
  baseUrl?: string;
  getToken?: () => string | null;
};

/** Placeholder — extend when wiring real HTTP calls. */
export function createApiClient(config: ApiClientConfig = {}) {
  const baseUrl = config.baseUrl ?? apiBase;
  return {
    baseUrl,
    getToken: config.getToken ?? (() => null),
  };
}

export {
  createCrmUser,
  createHrUser,
  createProcUser,
  listUsers,
  type CreateUserResult,
  type ListUsersResult,
  type UsersApiConfig,
} from "./users";

export {
  addWorkOrderProperty,
  createWorkOrder,
  deleteWorkOrder,
  deleteWorkOrderProperty,
  findPriorDeed,
  getWorkOrder,
  listWorkOrders,
  updateWorkOrderHeader,
  updateWorkOrderProperty,
  workOrderExists,
  type ApiErr,
  type ApiOk,
  type CreateWorkOrderRequest,
  type PropertyContactDto,
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
