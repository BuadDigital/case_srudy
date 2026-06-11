"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { usePrototype } from "@platform/app-shared/contexts/PrototypeContext";
import { clearAllSystemData } from "../lib/clear-all-system-data";
import { prototypeKeys } from "@platform/app-shared/query/prototype-keys";
import {
  PO_ROLE_RULES,
  SYSTEM_TOOLS_FILTER_FIELDS,
  SYSTEM_TOOLS_GLOSSARY,
  SYSTEM_TOOLS_MODULE_TITLE,
  buildSystemToolsSummaryCards,
  screenMatchesFilters,
  type SystemToolsSummaryCard,
} from "../lib/system-tools-view-model";

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
      className={`po-subpage-panel sys-tools-summary-card${card.visible ? "" : " sys-tools-summary-card--hidden"}`}
    >
      <div className="sys-tools-summary-body">
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
  const queryClient = useQueryClient();
  const { role } = usePrototype();
  const isSuperAdmin = role === "cdo";
  const [draftFilters, setDraftFilters] = useState<Record<string, string>>({});
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>(
    {},
  );
  const [clearBusy, setClearBusy] = useState(false);
  const [clearMessage, setClearMessage] = useState<string | null>(null);
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

  async function handleClearAllSystemData() {
    if (
      !window.confirm(
        "مسح كل بيانات النظام؟ يحذف من الخادم: أوامر العمل، العقارات، البيانات الأولية، مهام سير العمل، نماذج الدراسة، كتالوج المحاكم، وتسجيلات المستخدمين (HR/Proc/CRM). ويمسح من المتصفح كل مفاتيح eval*. لا يمكن التراجع.",
      )
    ) {
      return;
    }
    setClearBusy(true);
    setClearMessage(null);
    try {
      const result = await clearAllSystemData();
      await queryClient.invalidateQueries({ queryKey: prototypeKeys.all });
      const errPart =
        result.errors.length > 0
          ? ` — تحذيرات: ${result.errors.slice(0, 3).join("؛ ")}`
          : "";
      const apiPart = result.apiReset
        ? `الخادم: ${result.workOrdersDeleted} PO، ${result.workflowTasksDeleted} مهمة، ${result.caseStudyFormsDeleted} نموذج دراسة، ${result.courtCatalogEntriesDeleted} محكمة، ${result.registeredUsersDeleted} مستخدم مسجّل. `
        : "";
      setClearMessage(
        `${apiPart}تم مسح كل التخزين المحلي (eval*).${errPart}`,
      );
    } catch {
      setClearMessage("تعذّر إكمال المسح — تحقق من تشغيل API وتسجيل الدخول كـ CDO.");
    } finally {
      setClearBusy(false);
    }
  }

  return (
    <div className="sys-tools-layout">
      {isSuperAdmin ? (
        <article className="page-shell" style={{ gridColumn: "1 / -1" }}>
          <header className="po-subpage-hd">
            <div className="po-subpage-titles">
              <h2 className="po-subpage-title">صيانة النظام (CDO)</h2>
            </div>
          </header>
          <div className="page-gutter" style={{ paddingBottom: 16 }}>
            <p className="sys-tools-main-hint" style={{ marginBottom: 12 }}>
              يمسح كل بيانات التشغيل من قاعدة البيانات: أوامر العمل
              والعقارات، البيانات الأولية، مهام سير العمل، نماذج الدراسة،
              كتالوج المحاكم، وتسجيلات المستخدمين (ما عدا حسابات الإعداد
              المزروعة). ويمسح من المتصفح كل مفاتيح{" "}
              <code dir="ltr">eval*</code> (مهام، تعذرات، مسودات، مرفقات،
              علاقة المستخدم بالمعلومة، خطابات التفويض، إلخ).
            </p>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              disabled={clearBusy}
              onClick={() => void handleClearAllSystemData()}
            >
              {clearBusy ? "جاري المسح…" : "مسح كل بيانات النظام"}
            </button>
            {clearMessage ? (
              <div
                className={`note ${clearMessage.includes("تحذير") || clearMessage.includes("تعذّر") ? "note-warn" : "note-success"}`}
                style={{ marginTop: 12 }}
                role="status"
              >
                {clearMessage}
              </div>
            ) : null}
          </div>
        </article>
      ) : null}
      <article className="page-shell sys-tools-main-card">
        <header className="po-subpage-hd">
          <div className="po-subpage-titles">
            <h2 className="po-subpage-title">{SYSTEM_TOOLS_MODULE_TITLE}</h2>
          </div>
          <span className="badge b-int">
            شاشات مطابقة: {visibleCount}/{summaryCards.length}
          </span>
        </header>
        <div className="page-gutter" style={{ paddingBottom: 16 }}>
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
      </article>

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
