import { formatPoDisplay } from "@/lib/prototype/po-intake-data";

/** PO number isolated for correct display in RTL (Arabic label + LTR code). */
export function PoNumber({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) {
  return (
    <span
      dir="ltr"
      className={`po-num-ltr${className ? ` ${className}` : ""}`}
    >
      {formatPoDisplay(value)}
    </span>
  );
}

export function PoPropertiesHeading({ poNumber }: { poNumber: string }) {
  return (
    <h2 className="po-subpage-title po-heading-with-num">
      <span className="po-heading-ar">عقارات</span>
      <PoNumber value={poNumber} />
    </h2>
  );
}
