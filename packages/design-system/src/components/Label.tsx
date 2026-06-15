import type { LabelHTMLAttributes } from "react";
import { cn } from "../lib/cn";

const sizeClasses = {
  default: "mb-1 text-sm font-medium text-text-2",
  field: "mb-[5px] block text-[11px] font-medium text-text-2",
} as const;

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  size?: keyof typeof sizeClasses;
};

export function Label({ className, size = "default", ...props }: LabelProps) {
  return (
    <label
      className={cn(sizeClasses[size], className)}
      {...props}
    />
  );
}
