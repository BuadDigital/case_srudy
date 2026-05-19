"use client";

import { AppAuthGate } from "@platform/auth-client";
import { AppShell } from "@/components/views/AppShell";
import { PrototypeProvider } from "@/contexts/PrototypeContext";

export default function AppSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppAuthGate>
      <PrototypeProvider>
        <AppShell>{children}</AppShell>
      </PrototypeProvider>
    </AppAuthGate>
  );
}
