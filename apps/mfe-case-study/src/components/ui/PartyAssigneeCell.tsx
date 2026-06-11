"use client";

import type { CaseStudyPartyAssignee } from "../../lib/prototype/case-study-tracks";

function progressBarClass(pct: number): string {
  if (pct >= 100) return "prog-bar g";
  if (pct > 0) return "prog-bar o";
  return "prog-bar";
}

export function PartyAssigneeCell({ party }: { party: CaseStudyPartyAssignee }) {
  if (!party.enabled) return <>—</>;

  const name = party.name.trim();
  if (!name || name === "—") return <>—</>;

  const pct = party.progressPct;

  return (
    <div className="po-party-cell" title={name}>
      <div className="po-party-name">{name}</div>
      <div className="po-party-progress-row">
        <div className="prog-wrap po-party-progress-track">
          <div
            className={progressBarClass(pct)}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="po-party-progress-pct">{pct}%</span>
      </div>
    </div>
  );
}
