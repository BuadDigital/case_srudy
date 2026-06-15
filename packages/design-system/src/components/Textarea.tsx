import type { TextareaHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  hasError?: boolean;
};

export function Textarea({ className, hasError, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "w-full resize-y rounded-[var(--radius-DEFAULT)] border bg-surface px-2.5 py-2 text-sm text-text outline-none transition-colors min-h-[70px] leading-relaxed",
        "focus:border-primary focus:ring-[3px] focus:ring-primary/12",
        hasError && "border-danger focus:border-danger focus:ring-danger/12",
        className,
      )}
      {...props}
    />
  );
}
