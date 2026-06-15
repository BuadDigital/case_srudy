import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

const accentClasses = {
  default: "border-t-primary",
  blue: "border-t-primary-light",
  green: "border-t-success",
  warn: "border-t-warning",
  red: "border-t-danger",
  amber: "border-t-amber",
  gray: "border-t-text-3",
} as const;

export type StatAccent = keyof typeof accentClasses;

export function StatGrid({
  className,
  cols = 4,
  ...props
}: HTMLAttributes<HTMLDivElement> & { cols?: 2 | 3 | 4 }) {
  const colClasses = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  } as const;

  return (
    <div
      className={cn(
        "mb-[18px] grid gap-2.5",
        colClasses[cols],
        className,
      )}
      {...props}
    />
  );
}

export function StatCard({
  className,
  accent = "default",
  ...props
}: HTMLAttributes<HTMLDivElement> & { accent?: StatAccent }) {
  return (
    <div
      className={cn(
        "flex flex-col items-start rounded-[var(--radius-lg)] border border-border border-t-[3px] bg-surface px-4 py-3.5",
        accentClasses[accent],
        className,
      )}
      {...props}
    />
  );
}

export function StatLabel({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mb-[7px] w-full text-start text-[11px] text-text-3",
        className,
      )}
      {...props}
    />
  );
}

export function StatValue({
  value,
  className,
}: {
  value?: number | string;
  className?: string;
}) {
  const ready = value !== undefined;
  return (
    <div
      className={cn(
        "min-h-[1em] w-fit max-w-full self-start text-right text-[26px] font-bold leading-none text-text [direction:ltr] [unicode-bidi:isolate]",
        ready ? "opacity-100 transition-opacity duration-200" : "opacity-0",
        className,
      )}
      aria-hidden={!ready}
    >
      {ready ? value : "\u00a0"}
    </div>
  );
}

export function StatSub({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-1 w-full text-start text-[10px] text-text-3", className)}
      {...props}
    />
  );
}
