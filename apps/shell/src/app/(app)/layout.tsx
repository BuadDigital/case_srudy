"use client";

import { Suspense } from "react";
import { AppAuthGate } from "@platform/auth-client";
import { AppShell } from "@/components/views/AppShell";
import { PrototypeProvider } from "@/contexts/PrototypeContext";
import { QueryProvider } from "@/providers/QueryProvider";

export default function AppSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppAuthGate>
      <QueryProvider>
        <PrototypeProvider>
          <Suspense fallback={null}>
            <AppShell>{children}</AppShell>
          </Suspense>
        </PrototypeProvider>
      </QueryProvider>
    </AppAuthGate>
  );
}
