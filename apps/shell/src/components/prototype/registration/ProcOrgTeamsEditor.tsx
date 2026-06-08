"use client";

import { REGIONS, SERVICES } from "@/lib/prototype/registration-data";
import { RegSelect } from "./FormFields";
import { RegistrationFormCard } from "./RegistrationFormCard";

export type ProcMgmtMember = {
  name: string;
  role: string;
  phone: string;
};

export type ProcOpsMember = {
  name: string;
  role: string;
  phone: string;
};

export type ProcOpsUnit = {
  name: string;
  teamType: string;
  region: string;
  members: ProcOpsMember[];
};

const DEFAULT_MGMT_ROLES = [
  "المدير العام / المفوض",
  "المحاسب",
  "مدير الإدارة",
  "مسؤول المشاريع",
];

function emptyMgmtRow(index: number): ProcMgmtMember {
  return {
    name: "",
    role: index < DEFAULT_MGMT_ROLES.length ? DEFAULT_MGMT_ROLES[index] : "",
    phone: "",
  };
}

function emptyOpsUnit(): ProcOpsUnit {
  return {
    name: "",
    teamType: "",
    region: "",
    members: [{ name: "", role: "", phone: "" }],
  };
}

export function ProcOrgTeamsEditor({
  mgmtTeam,
  opsUnits,
  onMgmtChange,
  onOpsChange,
}: {
  mgmtTeam: ProcMgmtMember[];
  opsUnits: ProcOpsUnit[];
  onMgmtChange: (next: ProcMgmtMember[]) => void;
  onOpsChange: (next: ProcOpsUnit[]) => void;
}) {
  const updateMgmt = (index: number, patch: Partial<ProcMgmtMember>) => {
    onMgmtChange(
      mgmtTeam.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const updateOpsUnit = (index: number, patch: Partial<ProcOpsUnit>) => {
    onOpsChange(
      opsUnits.map((unit, i) => (i === index ? { ...unit, ...patch } : unit)),
    );
  };

  const updateOpsMember = (
    unitIndex: number,
    memberIndex: number,
    patch: Partial<ProcOpsMember>,
  ) => {
    onOpsChange(
      opsUnits.map((unit, ui) => {
        if (ui !== unitIndex) return unit;
        return {
          ...unit,
          members: unit.members.map((m, mi) =>
            mi === memberIndex ? { ...m, ...patch } : m,
          ),
        };
      }),
    );
  };

  return (
    <>
      <RegistrationFormCard
        title="فريق الإدارة"
        subtitle="بيانات تواصل — لا يملكون حسابات حالياً"
        headerRight={
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => onMgmtChange([...mgmtTeam, emptyMgmtRow(mgmtTeam.length)])}
          >
            + إضافة
          </button>
        }
      >
          {mgmtTeam.map((row, index) => (
            <div key={`mgmt-${index}`} className="reg-person-row">
              <input
                className="reg-fi"
                placeholder="الاسم الكامل"
                value={row.name}
                onChange={(e) => updateMgmt(index, { name: e.target.value })}
              />
              <input
                className="reg-fi"
                placeholder="المنصب"
                value={row.role}
                onChange={(e) => updateMgmt(index, { role: e.target.value })}
              />
              <input
                className="reg-fi"
                placeholder="رقم الجوال"
                value={row.phone}
                onChange={(e) => updateMgmt(index, { phone: e.target.value })}
              />
              <button
                type="button"
                className="reg-rm-btn"
                aria-label="حذف"
                onClick={() =>
                  onMgmtChange(mgmtTeam.filter((_, i) => i !== index))
                }
              >
                ×
              </button>
            </div>
          ))}
        <div className="reg-info-box" style={{ marginTop: 8 }}>
          يمكن تحويل أي منهم لحساب مستقل لاحقاً بطلب من مدير النظام.
        </div>
      </RegistrationFormCard>

      <RegistrationFormCard
        title="الفرق التشغيلية / المنافذ"
        subtitle="التغطية الجغرافية وأفراد الفريق"
        headerRight={
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => onOpsChange([...opsUnits, emptyOpsUnit()])}
          >
            + إضافة فريق
          </button>
        }
      >
          {opsUnits.map((unit, unitIndex) => (
            <div key={`ops-${unitIndex}`} className="reg-ops-unit">
              <div className="reg-ops-hd">
                <span className="reg-ops-num">{unitIndex + 1}</span>
                <span className="reg-ops-hd-title">فريق / منفذ {unitIndex + 1}</span>
                <button
                  type="button"
                  className="reg-rm-btn"
                  aria-label="حذف الفريق"
                  onClick={() =>
                    onOpsChange(opsUnits.filter((_, i) => i !== unitIndex))
                  }
                >
                  ×
                </button>
              </div>
              <div className="reg-ops-body">
                <div className="reg-fg3" style={{ marginBottom: 10 }}>
                  <div>
                    <label className="reg-fl">اسم الفريق</label>
                    <input
                      className="reg-fi"
                      placeholder="مثال: فريق الرياض"
                      value={unit.name}
                      onChange={(e) =>
                        updateOpsUnit(unitIndex, { name: e.target.value })
                      }
                    />
                  </div>
                  <RegSelect
                    id={`ops_type_${unitIndex}`}
                    label="نوع الفريق"
                    options={SERVICES}
                    value={unit.teamType}
                    onChange={(v) => updateOpsUnit(unitIndex, { teamType: v })}
                  />
                  <RegSelect
                    id={`ops_region_${unitIndex}`}
                    label="التغطية الجغرافية"
                    options={REGIONS}
                    value={unit.region}
                    onChange={(v) => updateOpsUnit(unitIndex, { region: v })}
                  />
                </div>
                <div className="reg-ops-mem-lbl">أفراد الفريق (بيانات تواصل)</div>
                {unit.members.map((member, memberIndex) => (
                  <div key={`mem-${unitIndex}-${memberIndex}`} className="reg-ops-mem-row">
                    <input
                      className="reg-fi"
                      placeholder="الاسم"
                      value={member.name}
                      onChange={(e) =>
                        updateOpsMember(unitIndex, memberIndex, {
                          name: e.target.value,
                        })
                      }
                    />
                    <input
                      className="reg-fi"
                      placeholder="الدور"
                      value={member.role}
                      onChange={(e) =>
                        updateOpsMember(unitIndex, memberIndex, {
                          role: e.target.value,
                        })
                      }
                    />
                    <input
                      className="reg-fi"
                      placeholder="الجوال"
                      value={member.phone}
                      onChange={(e) =>
                        updateOpsMember(unitIndex, memberIndex, {
                          phone: e.target.value,
                        })
                      }
                    />
                    <button
                      type="button"
                      className="reg-rm-btn"
                      onClick={() =>
                        updateOpsUnit(unitIndex, {
                          members: unit.members.filter((_, i) => i !== memberIndex),
                        })
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="reg-add-ops-btn"
                  onClick={() =>
                    updateOpsUnit(unitIndex, {
                      members: [
                        ...unit.members,
                        { name: "", role: "", phone: "" },
                      ],
                    })
                  }
                >
                  + إضافة فرد
                </button>
              </div>
            </div>
          ))}
      </RegistrationFormCard>
    </>
  );
}

export function defaultProcMgmtTeam(): ProcMgmtMember[] {
  return [emptyMgmtRow(0), emptyMgmtRow(1)];
}

export function defaultProcOpsUnits(): ProcOpsUnit[] {
  return [emptyOpsUnit()];
}
