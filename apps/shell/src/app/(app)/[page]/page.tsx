import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { AssignmentView } from "@/components/views/AssignmentView";
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
  "bourse-inquiry": <BourseInquiryView />,
  assignment: <AssignmentView />,
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
  if (!VALID_PAGE_IDS.has(raw as PageId)) notFound();
  const page = raw as PageId;
  const node = VIEWS[page];
  if (node) return node;
  notFound();
}
