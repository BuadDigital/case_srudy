"use client";

import type { ReactNode } from "react";
import { RegSelect } from "@/components/prototype/registration/FormFields";
import {
  ENGINEERING_OFFICES,
  FIELD_INSPECTORS,
  GOVERNMENT_AUDITORS,
  type DistributionAssignee,
  VALUATION_COORDINATORS,
  VALUATORS,
} from "@/lib/prototype/distribution-parties";
import type { TaskDistributionDraft } from "@/lib/prototype/tasks-storage";

function toOptions(list: DistributionAssignee[]) {
  return list.map((a) => ({
    value: a.id,
    label: a.subtitle ? `${a.name} — ${a.subtitle}` : a.name,
  }));
}

function PartyBlock({
  enabled,
  title,
  description,
  onEnabledChange,
  children,
}: {
  enabled: boolean;
  title: string;
  description: string;
  onEnabledChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <section
      className={`my-tasks-party-block${enabled ? " my-tasks-party-block--on" : ""}`}
    >
      <label className="my-tasks-party-block-hd">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
        />
        <div className="my-tasks-party-body">
          <p className="my-tasks-party-title">{title}</p>
          <p className="my-tasks-party-desc">{description}</p>
        </div>
      </label>
      <div
        className="my-tasks-party-assign"
        aria-disabled={!enabled}
      >
        {children}
      </div>
    </section>
  );
}

type Props = {
  distribution: TaskDistributionDraft;
  onPatch: (patch: Partial<TaskDistributionDraft>) => void;
  showEngineering: boolean;
  engineeringHint?: string | null;
};

export function DistributionPartiesForm({
  distribution,
  onPatch,
  showEngineering,
  engineeringHint,
}: Props) {
  return (
    <div className="my-tasks-party-stack">
      <p className="my-tasks-party-intro">
        فعّل الطرف ثم اختر المسؤول من القائمة. الطرف غير المفعّل لن يُسند إليه
        أي جزء من المعاملة.
      </p>

      <PartyBlock
        enabled={distribution.governmentAuditor}
        title="المدقق الحكومي"
        description="زيارة المحكمة وجمع المفاتيح عند التوفر."
        onEnabledChange={(checked) =>
          onPatch({
            governmentAuditor: checked,
            governmentAuditorId: checked
              ? distribution.governmentAuditorId
              : "",
          })
        }
      >
        <RegSelect
          id="dist_gov_auditor"
          label="المسؤول"
          className="reg-fg"
          required={distribution.governmentAuditor}
          disabled={!distribution.governmentAuditor}
          options={toOptions(GOVERNMENT_AUDITORS)}
          value={distribution.governmentAuditorId}
          placeholder="اختر المدقق الحكومي…"
          onChange={(v) => onPatch({ governmentAuditorId: v })}
        />
      </PartyBlock>

      <PartyBlock
        enabled={distribution.valuationDepartment}
        title="قسم التقييم العقاري"
        description="منسق العمليات يستلم المعاملة ثم يُسند للمعاين والمقيم (مستخدمون نشطون في النظام)."
        onEnabledChange={(checked) =>
          onPatch({
            valuationDepartment: checked,
            operationsCoordinatorId: checked
              ? distribution.operationsCoordinatorId
              : "",
            inspectorId: checked ? distribution.inspectorId : "",
            valuatorId: checked ? distribution.valuatorId : "",
          })
        }
      >
        <div className="my-tasks-party-assign-grid">
          <RegSelect
            id="dist_val_coordinator"
            label="منسق عمليات التقييم"
            className="reg-fg"
            required={distribution.valuationDepartment}
            disabled={!distribution.valuationDepartment}
            options={toOptions(VALUATION_COORDINATORS)}
            value={distribution.operationsCoordinatorId}
            placeholder="اختر المنسق…"
            onChange={(v) => onPatch({ operationsCoordinatorId: v })}
          />
          <RegSelect
            id="dist_val_inspector"
            label="المعاين الميداني"
            className="reg-fg"
            required={distribution.valuationDepartment}
            disabled={!distribution.valuationDepartment}
            options={toOptions(FIELD_INSPECTORS)}
            value={distribution.inspectorId}
            placeholder="اختر المعاين…"
            onChange={(v) => onPatch({ inspectorId: v })}
          />
          <RegSelect
            id="dist_val_appraiser"
            label="المقيم العقاري"
            className="reg-fg"
            required={distribution.valuationDepartment}
            disabled={!distribution.valuationDepartment}
            options={toOptions(VALUATORS)}
            value={distribution.valuatorId}
            placeholder="اختر المقيم…"
            onChange={(v) => onPatch({ valuatorId: v })}
          />
        </div>
      </PartyBlock>

      {showEngineering ? (
        <PartyBlock
          enabled={distribution.engineeringOffice}
          title="المكتب الهندسي"
          description="مجموعة مكاتب هندسية لإصدار تقارير الرفع المساحي — حسابات نشطة لإدارة المعاملات الواردة."
          onEnabledChange={(checked) =>
            onPatch({
              engineeringOffice: checked,
              engineeringOfficeId: checked
                ? distribution.engineeringOfficeId
                : "",
            })
          }
        >
          <RegSelect
            id="dist_engineering_office"
            label="المكتب"
            className="reg-fg"
            required={distribution.engineeringOffice}
            disabled={!distribution.engineeringOffice}
            options={toOptions(ENGINEERING_OFFICES)}
            value={distribution.engineeringOfficeId}
            placeholder="اختر المكتب الهندسي…"
            onChange={(v) => onPatch({ engineeringOfficeId: v })}
          />
        </PartyBlock>
      ) : engineeringHint ? (
        <p className="my-tasks-party-hint">{engineeringHint}</p>
      ) : null}
    </div>
  );
}
