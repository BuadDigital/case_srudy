"use client";

import { useEffect, useState } from "react";

/** True after the first client commit — avoids SSR/client query cache mismatches. */
export function useHasMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
