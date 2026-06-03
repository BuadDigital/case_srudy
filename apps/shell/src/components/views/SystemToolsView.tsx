"use client";

import { useMemo, useState } from "react";
import {
  PO_ROLE_RULES,
  SYSTEM_TOOLS_FILTER_FIELDS,
  SYSTEM_TOOLS_GLOSSARY,
  SYSTEM_TOOLS_MODULE_TITLE,
  buildSystemToolsSummaryCards,
  screenMatchesFilters,
  type SystemToolsSummaryCard,
} from "@/lib/system-tools-view-model";

type SummaryCard = SystemToolsSummaryCard & {
  visible: boolean;
};

function SummaryPanel({
  card,
  expanded,
  onToggle,
}: {
  card: SummaryCard;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`card sys-tools-summary-card${card.visible ? "" : " sys-tools-summary-card--hidden"}`}
    >
      <div className="card-body sys-tools-summary-body">
        <button
          type="button"
          className={`sys-tools-summary-head-btn${expanded ? " is-open" : ""}`}
          onClick={onToggle}
          aria-expanded={expanded}
        >
          <div className="sys-tools-summary-head">
            <span className="sys-tools-summary-module">{card.moduleTitle}</span>
            <span className="sys-tools-summary-title">{card.title}</span>
            <span className="sys-tools-summary-breakdown">{card.breakdown}</span>
            <span className="sys-tools-summary-total">
              {card.total} عنصر موثّق
            </span>
          </div>
          <span className="sys-tools-summary-chevron" aria-hidden>
            {expanded ? "▾" : "◂"}
          </span>
        </button>

        {expanded ? (
          <ul className="sys-tools-summary-fields">
            {card.fields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

export function SystemToolsView() {
  const [draftFilters, setDraftFilters] = useState<Record<string, string>>({});
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>(
    {},
  );
  const allCards = useMemo(() => buildSystemToolsSummaryCards(), []);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(
    allCards[0]?.id ?? null,
  );

  const summaryCards = useMemo<SummaryCard[]>(() => {
    return allCards.map((card) => ({
      ...card,
      visible: screenMatchesFilters(card.screen, appliedFilters),
    }));
  }, [allCards, appliedFilters]);

  const visibleCount = summaryCards.filter((c) => c.visible).length;
  const draftFilterCount = Object.values(draftFilters).filter(
    (v) => v && v !== "الكل",
  ).length;

  function applyFilters() {
    setAppliedFilters({ ...draftFilters });
  }

  function resetFilters() {
    setDraftFilters({});
    setAppliedFilters({});
  }

  return (
    <div className="sys-tools-layout">
      <div className="card sys-tools-main-card">
        <div className="card-header">
          <span className="card-title">{SYSTEM_TOOLS_MODULE_TITLE}</span>
          <span className="badge b-int">
            شاشات مطابقة: {visibleCount}/{summaryCards.length}
          </span>
        </div>
        <div className="card-body">
          <p className="sys-tools-main-hint">
            فهرس توثيقي لشاشات PO — للمراجعة والاختبار، وليس إحصاءات تشغيل من
            قاعدة البيانات. اختر فلاتراً ثم «تطبيق» لتضييق البطاقات على اليسار،
            واضغط بطاقة لعرض القائمة الكاملة.
          </p>

          <details className="sys-tools-perms" open>
            <summary>شرح مصطلحات البطاقات</summary>
            <dl className="sys-tools-glossary">
              {SYSTEM_TOOLS_GLOSSARY.map((item) => (
                <div key={item.term}>
                  <dt>{item.term}</dt>
                  <dd>{item.body}</dd>
                  <dd className="sys-tools-glossary-example">
                    <strong>مثال:</strong> {item.example}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="sys-tools-glossary-note">
              «X عنصر موثّق» = مجموع الحقول + الأعمدة + الإحصاءات + الإجراءات
              لنفس الشاشة. عند التوسيع قد ترى بادئة «عمود:» أو «إحصاء:» لتمييز
              نوع العنصر.
            </p>
          </details>

          <details className="sys-tools-perms">
            <summary>صلاحيات PO حسب الدور</summary>
            <ul className="sys-tools-perms-list">
              {PO_ROLE_RULES.map((rule) => (
                <li key={rule.action}>
                  <strong>{rule.action}</strong>
                  <span> — {rule.roles}</span>
                </li>
              ))}
            </ul>
          </details>

          <div className="sys-tools-filters-grid">
            {SYSTEM_TOOLS_FILTER_FIELDS.map((field) => (
              <div key={field.key} className="sys-tools-filter-item">
                <label className="form-label sys-tools-filter-label">
                  {field.label}
                </label>
                <select
                  className="form-control"
                  value={draftFilters[field.key] ?? "الكل"}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                >
                  {field.options.map((option, index) => (
                    <option
                      key={`${field.key}-${option}-${index}`}
                      value={option}
                    >
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="sys-tools-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={applyFilters}
            >
              تطبيق ({draftFilterCount > 0 ? draftFilterCount : "الكل"})
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={resetFilters}
            >
              إعادة الضبط
            </button>
          </div>
        </div>
      </div>

      <aside className="sys-tools-summary-rail" aria-label="ملخص الشاشات">
        {summaryCards.map((card) => (
          <SummaryPanel
            key={card.id}
            card={card}
            expanded={expandedCardId === card.id && card.visible}
            onToggle={() => {
              if (!card.visible) return;
              setExpandedCardId((id) => (id === card.id ? null : card.id));
            }}
          />
        ))}
      </aside>
    </div>
  );
}
