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
