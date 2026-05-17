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
