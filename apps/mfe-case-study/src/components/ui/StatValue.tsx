"use client";

import { cn } from "@platform/design-system";

type StatValueProps = {
  /** Omit while the first fetch is in flight — avoids flashing 0. */
  value?: number | string;
  className?: string;
};

/** Stat number that appears only when data is ready (labels stay visible in parent). */
export function StatValue({ value, className }: StatValueProps) {
  const ready = value !== undefined;

  return (
    <div
      dir="ltr"
      className={cn(
        "min-h-[1em] w-fit max-w-full self-start text-right text-[26px] font-bold leading-none text-text [unicode-bidi:isolate]",
        ready ? "opacity-100 transition-opacity duration-200" : "opacity-0",
        className,
      )}
      aria-hidden={!ready}
    >
      {ready ? value : "\u00a0"}
    </div>
  );
}
