import {
  PO_ROLE_RULES,
  SYSTEM_MODULES,
  type CatalogScreen,
} from "./system-tools-po-catalog";

export type SystemToolsFilterField = {
  key: string;
  label: string;
  options: string[];
};

export type ScreenCatalogCounts = {
  fields: number;
  columns: number;
  stats: number;
  actions: number;
};

export function screenCatalogCounts(screen: CatalogScreen): ScreenCatalogCounts {
  return {
    fields: screen.fields.length,
    columns: screen.tableColumns?.length ?? 0,
    stats: screen.stats?.length ?? 0,
    actions: screen.actions?.length ?? 0,
  };
}

export function formatCatalogBreakdown(counts: ScreenCatalogCounts): string {
  const parts: string[] = [];
  if (counts.fields) parts.push(`${counts.fields} حقول`);
  if (counts.columns) parts.push(`${counts.columns} أعمدة`);
  if (counts.stats) parts.push(`${counts.stats} إحصاءات`);
  if (counts.actions) parts.push(`${counts.actions} إجراءات`);
  return parts.join(" · ") || "—";
}

export type SystemToolsSummaryCard = {
  id: string;
  moduleId: string;
  moduleTitle: string;
  title: string;
  total: number;
  breakdown: string;
  fields: string[];
  screen: CatalogScreen;
};

function dedupeOptions(options: string[]): string[] {
  return [...new Set(options)];
}

function uniqueFieldsWithChoices(): SystemToolsFilterField[] {
  const seen = new Set<string>();
  const out: SystemToolsFilterField[] = [];

  for (const mod of SYSTEM_MODULES) {
    for (const screen of mod.screens) {
      for (const field of screen.fields) {
        if (!field.choices?.length || seen.has(field.key)) continue;
        seen.add(field.key);
        out.push({
          key: field.key,
          label: field.label,
          options: ["الكل", ...dedupeOptions(field.choices)],
        });
      }
    }
  }

  return out;
}

function screenFieldLabels(screen: CatalogScreen): string[] {
  const labels: string[] = [];
  for (const f of screen.fields) labels.push(f.label);
  if (screen.tableColumns) {
    labels.push(...screen.tableColumns.map((c) => `عمود: ${c}`));
  }
  if (screen.stats) labels.push(...screen.stats.map((s) => `إحصاء: ${s}`));
  if (screen.actions) labels.push(...screen.actions);
  return labels;
}

export function buildSystemToolsSummaryCards(): SystemToolsSummaryCard[] {
  const cards: SystemToolsSummaryCard[] = [];
  for (const mod of SYSTEM_MODULES) {
    for (const screen of mod.screens) {
      const fields = screenFieldLabels(screen);
      const counts = screenCatalogCounts(screen);
      cards.push({
        id: `${mod.id}:${screen.id}`,
        moduleId: mod.id,
        moduleTitle: mod.title,
        title: screen.title,
        total: fields.length,
        breakdown: formatCatalogBreakdown(counts),
        fields,
        screen,
      });
    }
  }
  return cards;
}

export function screenMatchesFilters(
  screen: CatalogScreen,
  filters: Record<string, string>,
): boolean {
  const active = Object.entries(filters).filter(
    ([, v]) => v && v !== "الكل",
  );
  if (active.length === 0) return true;

  return active.every(([key, value]) => {
    const field = screen.fields.find((f) => f.key === key);
    return Boolean(field?.choices?.includes(value));
  });
}

export const SYSTEM_TOOLS_FILTER_FIELDS = uniqueFieldsWithChoices();

export const SYSTEM_TOOLS_MODULE_TITLE = "فهرس النظام — أوامر العمل (PO)";

export const SYSTEM_TOOLS_GLOSSARY = [
  {
    term: "الحقول",
    body: "عناصر النماذج التي يملأها المستخدم أو يعرضها النظام (نص، تاريخ، قائمة، مرفق، شارة حالة).",
    example: "مثل: رقم التعميد، نوع الإسناد، رقم الصك، المدينة.",
  },
  {
    term: "الأعمدة",
    body: "عناوين أعمدة الجدول في شاشات القوائم — كل عمود = عمود واحد في الجدول الذي تراه في التطبيق.",
    example: "مثل: رقم PO، التقدم، الحالة، تاريخ الاستلام، الأخصائي.",
  },
  {
    term: "الإحصاءات",
    body: "بطاقات الأرقام أعلى بعض شاشات القائمة (ملخص سريع قبل الجدول)، وليست صفوفاً في الجدول.",
    example: "مثل: PO نشطة، مكتملة هذا الشهر، عقارات نشطة.",
  },
  {
    term: "الإجراءات",
    body: "أزرار وروابط ومسارات يمكن تنفيذها من تلك الشاشة.",
    example: "مثل: تسجيل PO جديد، عرض العقارات، تعديل رأس PO.",
  },
] as const;

export { PO_ROLE_RULES };
