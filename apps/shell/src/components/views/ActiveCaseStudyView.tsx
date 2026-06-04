"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ActiveTransactionQueueView,
  type ActiveTransactionQueueConfig,
} from "@/components/views/ActiveTransactionQueueView";
import {
  activeCaseStudyPath,
  caseStudyTaskPath,
  caseStudyWorkspacePath,
  decodeTaskParam,
} from "@/lib/my-task-routes";
import { filterTasksForCaseStudy } from "@/lib/prototype/active-transactions";

const CASE_STUDY_QUEUE: ActiveTransactionQueueConfig = {
  pageTitle: "دراسة حالة العقارات",
  hidePageTitle: true,
  tableLayout: "distribution",
  emptyLine: "لا توجد معاملات في مرحلة دراسة الحالة.",
  emptyHint:
    "تظهر هنا بعد تأكيد توزيع المعاملة وإرسال المهام للأطراف. اضغط الصف لفتح دراسة الحالة.",
  panelId: "case-study-panel",
  getBasePath: activeCaseStudyPath,
  getTaskPath: caseStudyTaskPath,
  fullPageTaskPath: caseStudyWorkspacePath,
  filterListed: (mine) => filterTasksForCaseStudy(mine),
};

export function ActiveCaseStudyView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const legacyTask = searchParams.get("task");

  useEffect(() => {
    if (!legacyTask) return;
    router.replace(caseStudyWorkspacePath(decodeTaskParam(legacyTask)));
  }, [legacyTask, router]);

  if (legacyTask) {
    return (
      <p className="po-properties-loading">جاري فتح دراسة الحالة…</p>
    );
  }

  return <ActiveTransactionQueueView config={CASE_STUDY_QUEUE} />;
}
