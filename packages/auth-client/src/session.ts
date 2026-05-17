export const AUTH_STORAGE_KEY = "auth";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
  expiresAtUtc: string;
};

export function getAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function setAuthSession(session: AuthSession): void {
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

export function hasAuthSession(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(sessionStorage.getItem(AUTH_STORAGE_KEY));
}

export function getAuthDisplayName(): string | null {
  return getAuthSession()?.user.displayName ?? null;
}
