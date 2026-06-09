"use client";

type StatValueProps = {
  /** Omit while the first fetch is in flight — avoids flashing 0. */
  value?: number | string;
  className?: string;
};

/** Stat number that appears only when data is ready (labels stay visible in parent). */
export function StatValue({ value, className = "" }: StatValueProps) {
  const ready = value !== undefined;
  const cls = `stat-value${ready ? " stat-value--ready" : " stat-value--pending"}${className ? ` ${className}` : ""}`;

  return (
    <div className={cls} aria-hidden={!ready}>
      {ready ? value : "\u00a0"}
    </div>
  );
}
