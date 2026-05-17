"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { PageId, RoleId } from "@platform/types";
import { ROLES, STORAGE_ROLE_KEY } from "@/lib/prototype/constants";

type Ctx = {
  role: RoleId;
  setRole: (r: RoleId) => void;
  rolePages: PageId[];
};

const PrototypeContext = createContext<Ctx | null>(null);

function readStoredRole(): RoleId {
  if (typeof window === "undefined") return "general-manager";
  const raw = sessionStorage.getItem(STORAGE_ROLE_KEY);
  if (raw && raw in ROLES) return raw as RoleId;
  return "general-manager";
}

export function PrototypeProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<RoleId>("general-manager");

  useEffect(() => {
    startTransition(() => {
      setRoleState(readStoredRole());
    });
  }, []);

  const setRole = useCallback((r: RoleId) => {
    setRoleState(r);
    sessionStorage.setItem(STORAGE_ROLE_KEY, r);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      role,
      setRole,
      rolePages: ROLES[role].pages,
    }),
    [role, setRole],
  );

  return (
    <PrototypeContext.Provider value={value}>
      {children}
    </PrototypeContext.Provider>
  );
}

export function usePrototype() {
  const v = useContext(PrototypeContext);
  if (!v) throw new Error("usePrototype must be used within PrototypeProvider");
  return v;
}
