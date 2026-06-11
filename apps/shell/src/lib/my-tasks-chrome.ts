import { decodeTaskParam } from "@case-study/mfe";
import { partyTaskPageDef } from "@platform/app-shared/prototype/party-task-pages";
import type { PageId } from "@platform/types";

export type MyTasksChrome = {
  breadcrumb: string;
  title: string;
};

export type MyTasksChromeOptions = {
  /** Appended after breadcrumb on `/case-study/[taskId]` (e.g. رقم الصك). */
  deedLabel?: string;
};

export function resolveMyTasksChrome(
  pathname: string,
  taskId?: string | null,
  options?: MyTasksChromeOptions,
): MyTasksChrome | null {
  const parts = pathname.split("/").filter(Boolean);
  const page = parts[0] as PageId | undefined;

  if (page === "active-survey" && parts[1]) {
    const party = partyTaskPageDef("active-survey");
    if (party) {
      decodeTaskParam(parts[1]);
      return {
        breadcrumb: `دراسة الحالة / المعاملات النشطة / ${party.breadcrumbTitle} / تنفيذ المهمة`,
        title: party.workTitle,
      };
    }
  }

  if (page && taskId) {
    const party = partyTaskPageDef(page);
    if (party) {
      decodeTaskParam(taskId);
      return {
        breadcrumb: `المعاملات النشطة / ${party.breadcrumbTitle} / تنفيذ المهمة`,
        title: party.breadcrumbTitle,
      };
    }
  }

  if (parts[0] === "active-primary-data" && taskId) {
    decodeTaskParam(taskId);
    return {
      breadcrumb:
        "دراسة الحالة / المعاملات النشطة / البيانات الأولية / تنفيذ المعاملة",
      title: "تنفيذ المعاملة",
    };
  }
  if (parts[0] === "active-distribution" && taskId) {
    decodeTaskParam(taskId);
    return {
      breadcrumb:
        "دراسة الحالة / المعاملات النشطة / توزيع المعاملات / تنفيذ المعاملة",
      title: "توزيع المعاملة",
    };
  }
  if (parts[0] === "active-case-study" && taskId) {
    decodeTaskParam(taskId);
    return {
      breadcrumb:
        "دراسة الحالة / المعاملات النشطة / دراسة حالة العقار / تنفيذ المعاملة",
      title: "دراسة حالة العقار",
    };
  }
  if (parts[0] === "case-study" && parts[1]) {
    decodeTaskParam(parts[1]);
    const base =
      "دراسة الحالة / المعاملات النشطة / دراسة حالة العقارات";
    const deed = options?.deedLabel?.trim();
    return {
      breadcrumb: deed ? `${base} / ${deed}` : base,
      title: "",
    };
  }
  return null;
}
