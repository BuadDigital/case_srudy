"use client";

import {
  FLOW_META,
  type RegistrationSource,
} from "../prototype/registration-data";
import { REG_BACK } from "./registration-labels";
import { FLOW_THEME } from "./registration-layout";

export function RegistrationSidePanel({
  source,
  onBack,
}: {
  source: RegistrationSource;
  onBack: () => void;
}) {
  const meta = FLOW_META[source];
  const theme = FLOW_THEME[source];
  const icons: Record<RegistrationSource, string> = {
    hr: "HR",
    proc: "PROC",
    crm: "CRM",
  };

  return (
    <aside
      className="flex w-[234px] shrink-0 flex-col border-e border-white/[0.08] bg-sidebar px-4 py-5 text-white"
      aria-label={meta.dept}
    >
      <button
        type="button"
        className="mb-4 inline-flex w-fit cursor-pointer items-center gap-1.5 rounded border border-white/12 bg-white/[0.07] px-2.5 py-1 text-[11px] text-white/70 transition-colors hover:bg-white/[0.12] hover:text-white"
        onClick={onBack}
      >
        {REG_BACK}
      </button>
      <div
        className={`mb-3.5 flex h-[30px] w-[30px] items-center justify-center rounded-md text-[10px] font-bold text-white ${theme.sideLogo}`}
      >
        {icons[source]}
      </div>
      <div
        className={`mb-1 text-[9px] font-semibold uppercase tracking-wider ${theme.sideDept}`}
      >
        {meta.dept}
      </div>
      <h2 className="m-0 mb-2 text-sm font-semibold leading-snug text-white">
        {meta.title}
      </h2>
      <p className="m-0 mb-5 text-[11px] leading-relaxed text-white/45">
        {meta.desc}
      </p>
      <div className="mt-auto border-t border-white/[0.08] pt-3">
        <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-white/30">
          أنواع المسجّلين
        </div>
        {meta.sideTypes.map((line) => (
          <div
            key={line}
            className="mb-1 rounded border-e-[3px] border-e-transparent bg-white/[0.05] px-2 py-1.5 text-[11px] text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white/80"
          >
            {line}
          </div>
        ))}
      </div>
    </aside>
  );
}
