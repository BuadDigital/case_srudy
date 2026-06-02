"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { hasAuthSession } from "./session";

export function AppAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    startTransition(() => {
      if (!hasAuthSession()) {
        router.replace("/login");
        setOk(false);
        return;
      }
      setOk(true);
    });
  }, [router]);

  if (ok === null) {
    return (
      <div className="flex h-screen items-center justify-center text-[var(--text3)]">
        جاري التحميل…
      </div>
    );
  }
  if (!ok) return null;
  return <>{children}</>;
}

/*
 * Server-validated session gate (disabled for now — re-enable when wiring /api/auth/me):
 *
 * import { fetchCurrentUser, getApiBase } from "@platform/api-client";
 * import {
 *   clearAuthSession,
 *   getAuthSession,
 *   setAuthSession,
 *   type AuthUser,
 * } from "./session";
 *
 * function isSessionExpired(expiresAtUtc: string): boolean {
 *   const exp = Date.parse(expiresAtUtc);
 *   if (Number.isNaN(exp)) return true;
 *   return exp <= Date.now();
 * }
 *
 * export function AppAuthGate({
 *   children,
 *   onSessionReady,
 * }: {
 *   children: React.ReactNode;
 *   onSessionReady?: (user: AuthUser) => void;
 * }) {
 *   // ... validate token via GET /api/auth/me, refresh user, call onSessionReady
 * }
 */
