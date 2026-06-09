"use client";

export function SummaryGrid({ rows }: { rows: { l: string; v: string }[] }) {
  const half = Math.ceil(rows.length / 2);
  const cell = (r: { l: string; v: string }) => (
    <div key={r.l} className="reg-sum-row">
      <div className="reg-sum-lbl">{r.l}</div>
      <div className="reg-sum-val">{r.v || "—"}</div>
    </div>
  );
  return (
    <div className="reg-sum-grid">
      <div>{rows.slice(0, half).map(cell)}</div>
      <div>{rows.slice(half).map(cell)}</div>
    </div>
  );
}

