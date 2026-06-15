"use client";

import { Badge, cn } from "@platform/design-system";
import { ORG, type RegistrationSource } from "../prototype/registration-data";
import { FLOW_THEME } from "./registration-layout";

export function OrgTreePreview({
  selectedDept,
  selectedSection,
  source = "hr",
}: {
  selectedDept: string;
  selectedSection: string;
  source?: RegistrationSource;
}) {
  const theme = FLOW_THEME[source];

  return (
    <div className="mt-2.5 rounded border border-border bg-surface-2 px-3.5 py-3">
      <div className="mb-2 text-[10.5px] font-bold text-text-3">
        الموقع في الهيكل التنظيمي
      </div>
      {Object.entries(ORG).map(([dept, def]) => {
        const isDept = dept === selectedDept;
        return (
          <div key={dept}>
            <div
              className={cn(
                "flex items-center gap-1.5 py-0.5 text-[13px] text-text-2",
                isDept && theme.orgHighlight,
              )}
            >
              {dept}
              {def.execOnly ? (
                <Badge tone="default" className="ms-1.5 text-[9px]">
                  تنفيذية
                </Badge>
              ) : null}
            </div>
            {def.subs.map((sub) => (
              <div
                key={sub}
                className={cn(
                  "ms-[18px] py-0.5 text-xs text-text-3",
                  isDept && sub === selectedSection && theme.subHighlight,
                )}
              >
                {sub}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
