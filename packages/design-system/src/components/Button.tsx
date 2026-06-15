import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

const variantClasses = {
  default:
    "border-border-md bg-surface text-text hover:bg-surface-2",
  primary:
    "border-primary bg-primary text-white hover:border-primary-mid hover:bg-primary-mid",
  outline:
    "border-primary bg-transparent text-primary hover:bg-teal-light",
  accent:
    "border-primary bg-primary text-white hover:border-primary-mid hover:bg-primary-mid",
  danger:
    "border-red/30 bg-danger-bg text-danger hover:brightness-95",
  success:
    "border-primary bg-primary text-white hover:border-primary-mid hover:bg-primary-mid",
  dangerOutline:
    "border-red/30 bg-transparent text-danger hover:bg-danger-bg",
  ghost:
    "border-transparent bg-transparent text-text-2 hover:bg-surface-2",
} as const;

const sizeClasses = {
  default: "px-3.5 py-1.5 text-[12.5px]",
  sm: "px-2 py-1 text-[11px]",
  lg: "px-4 py-2.5 text-sm",
} as const;

export type ButtonVariant = keyof typeof variantClasses;
export type ButtonSize = keyof typeof sizeClasses;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  className,
  variant = "default",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-DEFAULT)] border font-normal whitespace-nowrap transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-65",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
