import { decodeTaskParam } from "@/lib/my-task-routes";

export type MyTasksChrome = {
  breadcrumb: string;
  title: string;
};

export function resolveMyTasksChrome(
  pathname: string,
  taskId?: string | null,
): MyTasksChrome | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "my-tasks" && parts[1]) {
    decodeTaskParam(parts[1]);
    return {
      breadcrumb:
        "دراسة الحالة / المعاملات النشطة / البيانات الأولية / تنفيذ المعاملة",
      title: "تنفيذ المعاملة",
    };
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
  return null;
}