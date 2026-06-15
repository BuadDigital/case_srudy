import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

const toneClasses = {
  default: "bg-surface-2 text-text-2 border-border",
  primary: "bg-teal-light text-teal-text border-primary/20",
  success: "bg-success-bg text-success border-success/20",
  warning: "bg-amber-light text-amber-text border-amber/30",
  danger: "bg-danger-bg text-danger border-red/20",
  info: "bg-info-bg text-info border-info/20",
  purple: "bg-purple-bg text-purple border-purple/20",
  orange: "bg-orange-bg text-orange border-orange/20",
} as const;

export type BadgeTone = keyof typeof toneClasses;

export function Badge({
  className,
  tone = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
