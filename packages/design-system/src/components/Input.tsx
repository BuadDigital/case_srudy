import type { InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

export function Input({ className, hasError, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-[var(--radius-DEFAULT)] border bg-surface px-2.5 py-2 text-sm text-text outline-none transition-colors",
        "focus:border-primary focus:ring-[3px] focus:ring-primary/12",
        hasError && "border-danger focus:border-danger focus:ring-danger/12",
        className,
      )}
      {...props}
    />
  );
}
