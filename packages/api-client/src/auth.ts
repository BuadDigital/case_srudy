// Disabled for now — re-enable when AppAuthGate validates via GET /api/auth/me.
//
// import { getApiBase } from "./index";
//
// export type AuthApiConfig = {
//   baseUrl?: string;
//   token: string;
// };
//
// export type UserInfoDto = {
//   id: string;
//   email: string;
//   displayName: string;
// };
//
// export type FetchCurrentUserResult =
//   | { ok: true; data: UserInfoDto }
//   | { ok: false; kind: "auth" | "network" };
//
// export async function fetchCurrentUser(
//   config: AuthApiConfig,
// ): Promise<FetchCurrentUserResult> {
//   const base = config.baseUrl?.replace(/\/$/, "") ?? getApiBase();
//   try {
//     const res = await fetch(`${base}/api/auth/me`, {
//       headers: { Authorization: `Bearer ${config.token}` },
//     });
//     if (res.status === 401 || res.status === 403) return { ok: false, kind: "auth" };
//     if (!res.ok) return { ok: false, kind: "network" };
//     const data = (await res.json()) as UserInfoDto;
//     return { ok: true, data };
//   } catch {
//     return { ok: false, kind: "network" };
//   }
// }
