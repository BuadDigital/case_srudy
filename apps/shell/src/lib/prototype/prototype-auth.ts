import { getApiBase } from "@platform/api-client";
import {
  getAuthSession,
  setAuthSession,
  type AuthSession,
} from "@platform/auth-client";
import {
  defaultPersonaIdForRole,
  roleOptionById,
  STORAGE_PERSONA_KEY,
  STORAGE_ROLE_KEY,
  ROLES,
} from "@platform/app-shared/prototype/constants";
import type { RoleId } from "@platform/types";
import { partyAccountByEmail } from "@case-study/mfe";

type LoginResponse = {
  token: string;
  expiresAtUtc: string;
  user: { id: string; email: string; displayName: string };
};

/** Seeded demo passwords — prototype only. */
const STATIC_PASSWORDS: Record<string, string> = {
  "s.salhy@gmail.com": "sliman123",
  "a.alamin@gmail.com": "ali123",
  "a.alqadri@gmail.com": "ahmad123",
  "g.abdo@gmail.com": "gamal123",
  "salam@ejadah.dev": "EjadaGM2025!",
  "abdulrahman@ejadah.dev": "EjadaSS2025!",
  "osama@ejadah.dev": "EjadaCS2025!",
  "eman@ejadah.dev": "EjadaFO2025!",
  "admin@local.dev": "Admin123!",
};

export function prototypePasswordForEmail(email: string): string | null {
  const key = email.trim().toLowerCase();
  const party = partyAccountByEmail(key);
  if (party?.password) return party.password;
  return STATIC_PASSWORDS[key] ?? null;
}

function personaEmailForBootstrap(): string | null {
  if (typeof window === "undefined") return null;
  const personaId = sessionStorage.getItem(STORAGE_PERSONA_KEY);
  if (personaId) {
    return roleOptionById(personaId)?.email ?? null;
  }
  const rawRole = sessionStorage.getItem(STORAGE_ROLE_KEY);
  if (rawRole && rawRole in ROLES) {
    return (
      roleOptionById(defaultPersonaIdForRole(rawRole as RoleId))?.email ?? null
    );
  }
  return roleOptionById(defaultPersonaIdForRole("general-manager"))?.email ?? null;
}

async function loginWithCredentials(
  email: string,
  password: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as LoginResponse;
    if (!data?.token) return false;
    setAuthSession({
      token: data.token,
      user: data.user,
      expiresAtUtc: data.expiresAtUtc,
    } satisfies AuthSession);
    return true;
  } catch {
    return false;
  }
}

/** Silent API login for the selected prototype persona (no logout / login page). */
export async function ensureAuthSessionForEmail(
  email: string,
): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const session = getAuthSession();
  if (session?.user.email.trim().toLowerCase() === normalized) {
    return true;
  }

  const password = prototypePasswordForEmail(normalized);
  if (!password) return false;
  return loginWithCredentials(normalized, password);
}

export async function ensureAuthSessionForPersonaId(
  personaId: string,
): Promise<boolean> {
  const email = roleOptionById(personaId)?.email;
  if (!email) return false;
  return ensureAuthSessionForEmail(email);
}

/** First app load — pick stored persona and sign in silently. */
export async function bootstrapPrototypeAuth(): Promise<boolean> {
  const session = getAuthSession();
  const email = personaEmailForBootstrap();
  if (!email) return Boolean(session);
  if (session?.user.email.trim().toLowerCase() === email.trim().toLowerCase()) {
    return true;
  }
  return ensureAuthSessionForEmail(email);
}
