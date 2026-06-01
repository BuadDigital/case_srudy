import type { ReactNode } from "react";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { ActiveDistributionView } from "@/components/views/ActiveDistributionView";
import { ActiveTransactionPlaceholderView } from "@/components/views/ActiveTransactionPlaceholderView";
import { MyTasksView } from "@/components/views/MyTasksView";
import { BourseInquiryView } from "@/components/views/BourseInquiryView";
import { CourtsView } from "@/components/views/CourtsView";
import { DashboardView } from "@/components/views/DashboardView";
import { FailuresView } from "@/components/views/FailuresView";
import { FieldFormView } from "@/components/views/FieldFormView";
import { FinancialView } from "@/components/views/FinancialView";
import { KeysView } from "@/components/views/KeysView";
import { KpiView } from "@/components/views/KpiView";
import { MessagesView } from "@/components/views/MessagesView";
import { SurveyView } from "@/components/views/SurveyView";
import { UsersView } from "@/components/views/UsersView";
import { ValuationRequestsView } from "@/components/views/ValuationRequestsView";
import { VALID_PAGE_IDS } from "@/lib/prototype/constants";
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
    <ActiveTransactionPlaceholderView pageId="active-case-study" />
  ),
  survey: <SurveyView />,
  keys: <KeysView />,
  failures: <FailuresView />,
  "valuation-requests": <ValuationRequestsView />,
  "field-form": <FieldFormView />,
  messages: <MessagesView />,
  financial: <FinancialView />,
  kpi: <KpiView />,
  users: <UsersView />,
  courts: <CourtsView />,
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
