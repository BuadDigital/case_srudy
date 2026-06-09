"use client";

import { ORG } from "../prototype/registration-data";

export function OrgTreePreview({
  selectedDept,
  selectedSection,
}: {
  selectedDept: string;
  selectedSection: string;
}) {
  return (
    <div className="reg-org-tree">
      <div className="reg-org-tree-lbl">الموقع في الهيكل التنظيمي</div>
      {Object.entries(ORG).map(([dept, def]) => {
        const isDept = dept === selectedDept;
        return (
          <div key={dept}>
            <div className={`reg-org-node${isDept ? " hl" : ""}`}>
              {dept}
              {def.execOnly ? (
                <span className="badge b-gray" style={{ fontSize: 9, marginInlineStart: 6 }}>
                  تنفيذية
                </span>
              ) : null}
            </div>
            {def.subs.map((sub) => (
              <div
                key={sub}
                className={`reg-org-sub${isDept && sub === selectedSection ? " hl" : ""}`}
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
