"use client";

import { useCallback, useMemo, useState } from "react";
import {
  CASE_STUDY_INFO_PARTIES,
  CASE_STUDY_INFO_ROLE_TYPES,
  CASE_STUDY_INFO_SECTIONS,
  CASE_STUDY_QUESTION_CATALOG,
  type CaseStudyInfoPartyId,
  type CaseStudyInfoRoleType,
} from "../lib/prototype/case-study-info-roles-data";
import {
  emptyCaseStudyInfoRolesConfig,
  saveCaseStudyInfoRolesConfig,
  type CaseStudyInfoRolesConfig,
} from "../lib/prototype/case-study-info-roles-storage";
import { apiErrorMessage } from "../lib/settings-api-config";
import {
  setCaseStudyInfoRolesCache,
  useCaseStudyInfoRolesQuery,
} from "../query/settings-queries";
import { useQueryClient } from "@tanstack/react-query";

function setMatrixRole(
  config: CaseStudyInfoRolesConfig,
  questionKey: string,
  partyId: CaseStudyInfoPartyId,
  role: CaseStudyInfoRoleType | null,
): CaseStudyInfoRolesConfig {
  const row = { ...config.matrix[questionKey] };
  if (role == null) delete row[partyId];
  else row[partyId] = role;
  return {
    ...config,
    matrix: { ...config.matrix, [questionKey]: row },
  };
}

function questionStatus(
  config: CaseStudyInfoRolesConfig,
  questionKey: string,
): "empty" | "partial" | "done" {
  const vals = CASE_STUDY_INFO_PARTIES.map(
    (p) => config.matrix[questionKey]?.[p.id],
  ).filter((v) => v && v !== "none");
  if (vals.length === 0) return "empty";
  if (vals.length >= 3) return "done";
  return "partial";
}

export function CaseStudyInfoRolesView() {
  const queryClient = useQueryClient();
  const { data: config, isFetched } = useCaseStudyInfoRolesQuery();
  const [openId, setOpenId] = useState<string | null>(
    CASE_STUDY_QUESTION_CATALOG[0]?.key ?? null,
  );
  const [activeSec, setActiveSec] = useState(CASE_STUDY_INFO_SECTIONS[0]?.id);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const persist = useCallback(
    async (next: CaseStudyInfoRolesConfig) => {
      setSaving(true);
      setSaveError(null);
      const saved = await saveCaseStudyInfoRolesConfig(next);
      setSaving(false);
      if (!saved) {
        setSaveError(apiErrorMessage("server", "تعذّر حفظ المصفوفة"));
        return;
      }
      setCaseStudyInfoRolesCache(queryClient, saved);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    },
    [queryClient],
  );

  const summary = useMemo(() => {
    if (!config) return { done: 0, partial: 0, empty: 0, pct: 0 };
    let done = 0;
    let partial = 0;
    let empty = 0;
    for (const q of CASE_STUDY_QUESTION_CATALOG) {
      const s = questionStatus(config, q.key);
      if (s === "done") done++;
      else if (s === "partial") partial++;
      else empty++;
    }
    const total = CASE_STUDY_QUESTION_CATALOG.length;
    const pct = Math.round(((done + partial * 0.5) / total) * 100);
    return { done, partial, empty, pct, total };
  }, [config]);

  if (!isFetched || !config) {
    return <p className="po-properties-loading">جاري التحميل…</p>;
  }

  const secQuestions = CASE_STUDY_QUESTION_CATALOG.filter(
    (q) => q.section === activeSec,
  );

  return (
    <div className="csir-page">
      <header className="csir-hero">
        <div>
          <h2 className="csir-title">علاقة المستخدم بالمعلومة</h2>
          <p className="csir-sub">
            حدّد لكل سؤال في نموذج دراسة الحالة: من الأطراف المعنيين وما دوره (أصيل /
            ثانوي / معتمد). تُطبَّق القواعد على تبويب «نموذج الدراسة» في معاملات
            الأطراف.
          </p>
        </div>
        <div className="csir-hero-actions">
          {saving ? (
            <span className="note note-info csir-saved">جاري الحفظ…</span>
          ) : null}
          {saved ? (
            <span className="note note-success csir-saved">تم الحفظ</span>
          ) : null}
          {saveError ? (
            <span className="note note-warn csir-saved">{saveError}</span>
          ) : null}
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              if (!window.confirm("إعادة تعيين جميع الاختيارات؟")) return;
              persist(emptyCaseStudyInfoRolesConfig());
            }}
          >
            إعادة تعيين
          </button>
        </div>
      </header>

      <div className="csir-summary">
        <div className="csir-sum-item">
          <span className="csir-sum-val">{summary.total}</span>
          <span className="csir-sum-lbl">إجمالي الأسئلة</span>
        </div>
        <div className="csir-sum-item">
          <span className="csir-sum-val csir-sum-val--ok">{summary.done}</span>
          <span className="csir-sum-lbl">مكتملة</span>
        </div>
        <div className="csir-sum-item">
          <span className="csir-sum-val csir-sum-val--warn">{summary.partial}</span>
          <span className="csir-sum-lbl">جزئية</span>
        </div>
        <div className="csir-sum-item">
          <span className="csir-sum-val">{summary.empty}</span>
          <span className="csir-sum-lbl">فارغة</span>
        </div>
        <div className="csir-sum-progress">
          <div className="csir-sum-prog-head">
            <span>نسبة الاكتمال</span>
            <span>{summary.pct}%</span>
          </div>
          <div className="prog-wrap">
            <div
              className="prog-bar"
              style={{ width: `${summary.pct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="csir-layout">
        <aside className="csir-aside">
          <div className="csir-legend">
            <p className="csir-legend-title">الأطراف</p>
            {CASE_STUDY_INFO_PARTIES.map((p) => (
              <div key={p.id} className="csir-party">
                <span
                  className="csir-party-dot"
                  style={{ background: p.color }}
                />
                <span>{p.name}</span>
              </div>
            ))}
          </div>
          <div className="csir-legend">
            <p className="csir-legend-title">أنواع الأدوار</p>
            {CASE_STUDY_INFO_ROLE_TYPES.map((r) => (
              <div key={r.id} className="csir-role-item">
                <span
                  className="csir-role-pill"
                  style={{ background: r.bg, color: r.color }}
                >
                  {r.label}
                </span>
                <span className="csir-role-desc">
                  {r.id === "primary"
                  ? "المسؤول الأساسي عن المعلومة"
                  : r.id === "secondary"
                    ? "مساهم — قد يكون مصدراً أولاً دون أن يكون المسؤول الأساسي"
                    : r.id === "verify"
                      ? "يراجع ويعتمد صحة المعلومة (ليس معتمد التقرير)"
                      : "بدون صلاحية إجابة"}
                </span>
              </div>
            ))}
          </div>
          <p className="csir-aside-lbl">الأقسام</p>
          {CASE_STUDY_INFO_SECTIONS.map((sec) => {
            const qs = CASE_STUDY_QUESTION_CATALOG.filter(
              (q) => q.section === sec.id,
            );
            const filled = qs.filter(
              (q) => questionStatus(config, q.key) !== "empty",
            ).length;
            return (
              <button
                key={sec.id}
                type="button"
                className={`csir-sec-nav${activeSec === sec.id ? " active" : ""}`}
                onClick={() => setActiveSec(sec.id)}
              >
                <span
                  className="csir-sec-dot"
                  style={{ background: sec.color }}
                />
                <span>{sec.label}</span>
                <span className="csir-sec-cnt">
                  {filled}/{qs.length}
                </span>
              </button>
            );
          })}
        </aside>

        <div className="csir-main">
          {secQuestions.map((q) => {
            const globalNum =
              CASE_STUDY_QUESTION_CATALOG.findIndex((x) => x.key === q.key) + 1;
            const open = openId === q.key;
            const chips = CASE_STUDY_INFO_PARTIES.flatMap((p) => {
              const role = config.matrix[q.key]?.[p.id];
              if (!role || role === "none") return [];
              const rt = CASE_STUDY_INFO_ROLE_TYPES.find((r) => r.id === role);
              return [{ party: p, role: rt! }];
            });
            return (
              <div
                key={q.key}
                className={`csir-q-card${chips.length ? " has-sel" : ""}${open ? " open" : ""}`}
              >
                <button
                  type="button"
                  className="csir-q-head"
                  onClick={() => setOpenId(open ? null : q.key)}
                >
                  <span className="csir-q-num">{globalNum}</span>
                  <span className="csir-q-text">{q.text}</span>
                </button>
                {chips.length > 0 ? (
                  <div className="csir-chips">
                    {chips.map(({ party, role }) => (
                      <span
                        key={party.id}
                        className="csir-chip"
                        style={{ background: role.bg, color: role.color }}
                      >
                        {party.name} · {role.label}
                      </span>
                    ))}
                  </div>
                ) : null}
                {open ? (
                  <div className="csir-grid-wrap">
                    <p className="csir-grid-lbl">
                      حدّد دور كل طرف في هذه المعلومة:
                    </p>
                    <div className="csir-parties-grid">
                      {CASE_STUDY_INFO_PARTIES.map((party) => (
                        <div key={party.id} className="csir-party-card">
                          <div className="csir-party-card-top">
                            <span
                              className="csir-party-av"
                              style={{ background: party.color }}
                            >
                              {party.abbr}
                            </span>
                            <span>{party.name}</span>
                          </div>
                          <div className="csir-role-btns">
                            {CASE_STUDY_INFO_ROLE_TYPES.map((rt) => {
                              const sel =
                                config.matrix[q.key]?.[party.id] === rt.id;
                              return (
                                <button
                                  key={rt.id}
                                  type="button"
                                  className={`csir-role-btn${sel ? ` sel-${rt.id}` : ""}`}
                                  onClick={() => {
                                    const cur =
                                      config.matrix[q.key]?.[party.id];
                                    const next =
                                      cur === rt.id ? null : rt.id;
                                    persist(
                                      setMatrixRole(
                                        config,
                                        q.key,
                                        party.id,
                                        next,
                                      ),
                                    );
                                  }}
                                >
                                  <span className="csir-role-icon">{rt.icon}</span>
                                  {rt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    <label className="csir-note-lbl">
                      ملاحظة (اختياري)
                      <textarea
                        className="reg-fi cs-form-textarea"
                        rows={2}
                        value={config.notes[q.key] ?? ""}
                        onChange={(e) =>
                          persist({
                            ...config,
                            notes: {
                              ...config.notes,
                              [q.key]: e.target.value,
                            },
                          })
                        }
                      />
                    </label>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
