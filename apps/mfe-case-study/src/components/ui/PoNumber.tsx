"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { formatPoDisplay } from "@case-study/mfe";
import { poPropertiesPath } from "@case-study/mfe";
import { prefetchPoRecord } from "../../query/case-study-queries";

/** PO number isolated for correct display in RTL (Arabic label + LTR code). */
export function PoNumber({
  value,
  className = "",
  link = false,
}: {
  value: string;
  className?: string;
  /** Open PO properties page when clicked */
  link?: boolean;
}) {
  const queryClient = useQueryClient();
  const display = formatPoDisplay(value);
  const cls = `po-num-ltr${link ? " po-num-link" : ""}${className ? ` ${className}` : ""}`;

  const warmCache = () => {
    if (value.trim()) prefetchPoRecord(queryClient, value);
  };

  if (link && value.trim()) {
    return (
      <Link
        href={poPropertiesPath(value)}
        dir="ltr"
        className={cls}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={warmCache}
        onFocus={warmCache}
      >
        {display}
      </Link>
    );
  }

  return (
    <span dir="ltr" className={cls}>
      {display}
    </span>
  );
}
