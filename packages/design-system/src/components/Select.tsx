import type { SelectHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type SelectVariant = "default" | "sidebar";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
  variant?: SelectVariant;
};

export function Select({
  className,
  hasError,
  variant = "default",
  ...props
}: SelectProps) {
  return (
    <select
      className={cn(
        "w-full cursor-pointer font-inherit outline-none transition-colors",
        variant === "default" &&
          "rounded-[var(--radius-DEFAULT)] border border-border bg-surface px-2.5 py-2 text-sm text-text focus:border-primary focus:ring-[3px] focus:ring-primary/12",
        variant === "sidebar" &&
          "rounded-[var(--radius-DEFAULT)] border border-sidebar-border bg-sidebar px-2 py-1.5 text-[11px] text-white [color-scheme:dark] focus:border-primary/50 focus:ring-[3px] focus:ring-primary/20",
        hasError && "border-danger focus:border-danger focus:ring-danger/12",
        className,
      )}
      {...props}
    />
  );
}
