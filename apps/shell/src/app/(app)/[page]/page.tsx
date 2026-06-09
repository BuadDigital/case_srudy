import type { ReactNode } from "react";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { ActiveCaseStudyView } from "@/components/views/ActiveCaseStudyView";
import { ActiveDistributionView } from "@case-study/mfe";
import { MyTasksView } from "@case-study/mfe";
import { BourseInquiryView } from "@case-study/mfe";
import { CourtsView } from "@/components/views/CourtsView";
import { DashboardView } from "@/components/views/DashboardView";
import { FailuresView } from "@/components/views/FailuresView";
import { FieldFormView } from "@/components/views/FieldFormView";
import { PartyActiveTaskView } from "@/components/views/PartyActiveTaskView";
import { PARTY_TASK_PAGE_IDS } from "@platform/app-shared/prototype/party-task-pages";
import { FinancialView } from "@/components/views/FinancialView";
import { KeysView } from "@/components/views/KeysView";
import { KpiView } from "@/components/views/KpiView";
import { MessagesView } from "@/components/views/MessagesView";
import { SurveyView } from "@/components/views/SurveyView";
import { UsersView } from "@/components/views/UsersView";
import { ValuationRequestsView } from "@/components/views/ValuationRequestsView";
import { SystemToolsView } from "@/components/views/SystemToolsView";
import { CaseStudyInfoRolesView } from "@/components/views/CaseStudyInfoRolesView";
import { GovernmentReviewView } from "@/components/views/GovernmentReviewView";
import { VALID_PAGE_IDS } from "@platform/app-shared/prototype/constants";
import type { PageId } from "@platform/types";

const VIEWS: Partial<Record<PageId, ReactNode>> = {
  dashboard: <DashboardView />,
  "active-primary-data": (
    <Suspense
      fallback={
        <div className="po-properties-page">
          <p className="po-properties-loading">جاري تحميل المعاملات…</p>
        </div>
      }
    >
      <MyTasksView />
    </Suspense>
  ),
  "bourse-inquiry": <BourseInquiryView />,
  "active-distribution": (
    <Suspense
      fallback={
        <div className="po-properties-page">
          <p className="po-properties-loading">جاري تحميل المعاملات…</p>
        </div>
      }
    >
      <ActiveDistributionView />
    </Suspense>
  ),
  "active-case-study": (
    <Suspense
      fallback={
        <div className="po-properties-page">
          <p className="po-properties-loading">جاري تحميل المعاملات…</p>
        </div>
      }
    >
      <ActiveCaseStudyView />
    </Suspense>
  ),
  survey: <SurveyView />,
  keys: <KeysView />,
  failures: <FailuresView />,
  "valuation-requests": <ValuationRequestsView />,
  "field-form": <FieldFormView />,
  ...Object.fromEntries(
    PARTY_TASK_PAGE_IDS.filter((pageId) => pageId !== "government-review").map(
      (pageId) => [
        pageId,
        <Suspense
          key={pageId}
          fallback={
            <div className="po-properties-page">
              <p className="po-properties-loading">جاري تحميل المهام…</p>
            </div>
          }
        >
          <PartyActiveTaskView pageId={pageId} />
        </Suspense>,
      ],
    ),
  ),
  "government-review": (
    <Suspense
      fallback={
        <div className="po-properties-page">
          <p className="po-properties-loading">جاري تحميل المراجعة الحكومية…</p>
        </div>
      }
    >
      <GovernmentReviewView />
    </Suspense>
  ),
  messages: <MessagesView />,
  financial: <FinancialView />,
  kpi: <KpiView />,
  users: <UsersView />,
  courts: <CourtsView />,
  "system-tools": <SystemToolsView />,
  "case-study-info-roles": <CaseStudyInfoRolesView />,
};

export default async function PrototypePage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page: raw } = await params;
  if (raw === "properties" || raw === "po") redirect("/po");
  if (raw === "my-tasks") redirect("/active-primary-data");
  if (raw === "assignment") redirect("/dashboard");
  if (!VALID_PAGE_IDS.has(raw as PageId)) notFound();
  const page = raw as PageId;
  const node = VIEWS[page];
  if (node) return node;
  notFound();
}
