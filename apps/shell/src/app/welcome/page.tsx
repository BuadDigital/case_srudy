"use client";

import { hasAuthSession } from "@platform/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Kept for backwards links; forwards straight to the main app shell. */
export default function WelcomePage() {
  const router = useRouter();

  useEffect(() => {
    if (!hasAuthSession()) {
      router.replace("/login");
      return;
    }
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-[var(--text2)]">
      جاري التحميل…
    </div>
  );
}
