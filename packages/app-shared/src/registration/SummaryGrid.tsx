"use client";

export function SummaryGrid({ rows }: { rows: { l: string; v: string }[] }) {
  const half = Math.ceil(rows.length / 2);
  const cell = (r: { l: string; v: string }) => (
    <div key={r.l} className="border-b border-border py-1.5">
      <div className="text-[11px] font-semibold text-text-3">{r.l}</div>
      <div className="mt-0.5 text-[12.5px] font-medium text-text">
        {r.v || "—"}
      </div>
    </div>
  );
  return (
    <div className="grid grid-cols-1 gap-2 gap-x-6 max-[500px]:grid-cols-1 sm:grid-cols-2">
      <div>{rows.slice(0, half).map(cell)}</div>
      <div>{rows.slice(half).map(cell)}</div>
    </div>
  );
}
