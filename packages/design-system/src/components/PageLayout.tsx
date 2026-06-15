import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

/** Full-width flat page shell (replaces `.page-shell`). */
export function PageShell({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-none border-none bg-surface shadow-none",
        className,
      )}
      {...props}
    />
  );
}

/** Scrollable page body with standard padding (replaces `.page-body`). */
export function PageBody({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "min-h-0 min-w-0 flex-1 overflow-y-auto px-6 py-5",
        className,
      )}
      {...props}
    />
  );
}

/** Horizontal gutter padding only (replaces `.page-gutter`). */
export function PageGutter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6", className)} {...props} />;
}
