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

import { useQueryClient } from "@tanstack/react-query";

import type { PageId, RoleId } from "@platform/types";

import {

  defaultPersonaIdForRole,

  roleOptionById,

  ROLES,

  STORAGE_PERSONA_KEY,

  STORAGE_ROLE_KEY,

} from "@platform/app-shared/prototype/constants";

import { ensureAuthSessionForPersonaId } from "@platform/shell/prototype-auth";

import { prototypeKeys } from "@platform/app-shared/query/prototype-keys";

import { pagesForPrototypeRole } from "@platform/app-shared/prototype/prototype-role-access";



type Ctx = {

  role: RoleId;

  personaId: string;

  setPersona: (personaId: string) => void;

  /** Silent API login finished for the current persona. */

  authReady: boolean;

  /** Email of the selected persona — for party task queues when roles repeat. */

  viewerEmail: string | null;

  rolePages: PageId[];

};



const PrototypeContext = createContext<Ctx | null>(null);



function readStoredRole(): RoleId {

  if (typeof window === "undefined") return "general-manager";

  const raw = sessionStorage.getItem(STORAGE_ROLE_KEY);

  if (raw && raw in ROLES) return raw as RoleId;

  return "general-manager";

}



function readStoredPersona(role: RoleId): string {

  if (typeof window === "undefined") return defaultPersonaIdForRole(role);

  const raw = sessionStorage.getItem(STORAGE_PERSONA_KEY);

  if (raw && roleOptionById(raw)) return raw;

  return defaultPersonaIdForRole(role);

}



export function PrototypeProvider({ children }: { children: React.ReactNode }) {

  const queryClient = useQueryClient();

  const [role, setRoleState] = useState<RoleId>("general-manager");

  const [personaId, setPersonaIdState] = useState("salam@ejadah.dev");

  const [authReady, setAuthReady] = useState(false);



  useEffect(() => {

    startTransition(() => {

      const storedRole = readStoredRole();

      const storedPersona = readStoredPersona(storedRole);

      setRoleState(storedRole);

      setPersonaIdState(storedPersona);

      setAuthReady(false);

      void ensureAuthSessionForPersonaId(storedPersona).then((ok) => {

        setAuthReady(ok);

        if (ok) {

          void queryClient.invalidateQueries({ queryKey: prototypeKeys.all });

        }

      });

    });

  }, [queryClient]);



  const setPersona = useCallback(

    (id: string) => {

      const opt = roleOptionById(id);

      if (!opt) return;

      setRoleState(opt.value);

      setPersonaIdState(id);

      setAuthReady(false);

      sessionStorage.setItem(STORAGE_ROLE_KEY, opt.value);

      sessionStorage.setItem(STORAGE_PERSONA_KEY, id);

      void ensureAuthSessionForPersonaId(id).then((ok) => {

        setAuthReady(ok);

        if (ok) {

          void queryClient.invalidateQueries({ queryKey: prototypeKeys.all });

        }

      });

    },

    [queryClient],

  );



  const viewerEmail = useMemo(

    () => roleOptionById(personaId)?.email ?? null,

    [personaId],

  );



  const value = useMemo<Ctx>(

    () => ({

      role,

      personaId,

      setPersona,

      authReady,

      viewerEmail,

      rolePages: pagesForPrototypeRole(role),

    }),

    [role, personaId, setPersona, authReady, viewerEmail],

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


