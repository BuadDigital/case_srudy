import Link from "next/link";
import { formatPoDisplay } from "@/lib/prototype/po-intake-data";
import { poPropertiesPath } from "@/lib/po-routes";

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
  const display = formatPoDisplay(value);
  const cls = `po-num-ltr${link ? " po-num-link" : ""}${className ? ` ${className}` : ""}`;

  if (link && value.trim()) {
    return (
      <Link
        href={poPropertiesPath(value)}
        dir="ltr"
        className={cls}
        onClick={(e) => e.stopPropagation()}
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
