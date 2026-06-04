import type { PageId } from "@platform/types";

export type SettingsNavItem = {
  id: PageId;
  label: string;
  icon: string;
  available: boolean;
  placeholder?: boolean;
};

/** عناصر قائمة الإعدادات */
export const SETTINGS_NAV: SettingsNavItem[] = [
  {
    id: "system-tools",
    label: "ادوات النظام",
    icon: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
    available: true,
  },
  {
    id: "users",
    label: "إدارة المستخدمين",
    icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    available: true,
  },
  {
    id: "courts",
    label: "المحاكم و الدوائر",
    icon: "M3 21h18M5 21V7l8-4 8 4v14M9 21v-6h6v6",
    available: true,
    placeholder: true,
  },
  {
    id: "case-study-info-roles",
    label: "علاقة المستخدم بالمعلومة",
    icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0zM22 12h-4l-3 9L9 3l-3 9H2",
    available: true,
  },
];

export const SETTINGS_GROUP = "الإعدادات";

export const SETTINGS_GROUP_ICON =
  "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z";

export const SETTINGS_PAGE_IDS: PageId[] = SETTINGS_NAV.map((n) => n.id);

export function settingsNavForRole(rolePages: PageId[]): SettingsNavItem[] {
  return SETTINGS_NAV.map((item) => ({
    ...item,
    available: rolePages.includes(item.id),
  }));
}

export function isInSettingsSection(page: PageId): boolean {
  return SETTINGS_PAGE_IDS.includes(page);
}
