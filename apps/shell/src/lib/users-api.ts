import {
  createCrmUser,
  createHrUser,
  createProcUser,
  getApiBase,
  listUsers,
  type CreateUserResult,
  type UsersApiConfig,
} from "@platform/api-client";
import { getAuthSession } from "@platform/auth-client";
import type { RegistrationPayload, UserListItem } from "@platform/types";
import type { StaffUser } from "@/lib/prototype/constants";
import type { RegistrationSource } from "@/lib/prototype/registration-data";

function apiConfig(): UsersApiConfig | null {
  const session = getAuthSession();
  if (!session?.token) return null;
  return { token: session.token, baseUrl: getApiBase() };
}

export function contractTypeToStaffType(
  t: UserListItem["contractType"],
): StaffUser["type"] {
  if (t === "Internal") return "internal";
  if (t === "Freelance") return "freelance";
  return "external";
}

export function userListItemToStaff(u: UserListItem): StaffUser {
  return {
    id: u.id,
    name: u.displayName,
    role: u.jobTitle,
    email: u.email,
    userName: u.userName,
    type: contractTypeToStaffType(u.contractType),
    source:
      u.registrationSource === "Hr"
        ? "hr"
        : u.registrationSource === "Proc"
          ? "proc"
          : "crm",
    phone: u.phoneNumber,
    createdAt: u.createdAtUtc,
    systemRoles: u.systemRoles ?? [],
    details: (u.details ?? []).map((d) => ({
      section: d.section,
      label: d.label,
      value: d.value,
    })),
  };
}

export type FetchStaffUsersResult = {
  users: StaffUser[];
  /** Set only when the API call failed — not when the list is simply empty. */
  loadError: string | null;
};

export async function fetchStaffUsers(): Promise<FetchStaffUsersResult> {
  const config = apiConfig();
  if (!config) return { users: [], loadError: null };

  const result = await listUsers(config);
  if (!result.ok) {
    const message =
      result.kind === "network"
        ? "تعذر تحميل قائمة المستخدمين. تحقق من أن الخادم يعمل."
        : "تعذر تحميل قائمة المستخدمين.";
    return { users: [], loadError: message };
  }

  return {
    users: result.users.map(userListItemToStaff),
    loadError: null,
  };
}

export async function submitRegistration(
  source: RegistrationSource,
  data: RegistrationPayload,
): Promise<CreateUserResult> {
  const config = apiConfig();
  if (!config) {
    return { ok: false, errors: { _form: "يجب تسجيل الدخول أولاً" } };
  }
  if (source === "hr") return createHrUser(config, data);
  if (source === "proc") return createProcUser(config, data);
  return createCrmUser(config, data);
}
