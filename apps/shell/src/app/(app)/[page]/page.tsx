import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { AssignmentView } from "@/components/prototype/AssignmentView";
import { DashboardView } from "@/components/prototype/DashboardView";
import { FailuresView } from "@/components/prototype/FailuresView";
import { FieldFormView } from "@/components/prototype/FieldFormView";
import { FinancialView } from "@/components/prototype/FinancialView";
import { KeysView } from "@/components/prototype/KeysView";
import { KpiView } from "@/components/prototype/KpiView";
import { MessagesView } from "@/components/prototype/MessagesView";
import { PoListView } from "@/components/prototype/PoListView";
import { PropertiesListView } from "@/components/prototype/PropertiesListView";
import { SurveyView } from "@/components/prototype/SurveyView";
import { UsersView } from "@/components/prototype/UsersView";
import { ValuationRequestsView } from "@/components/prototype/ValuationRequestsView";
import { VALID_PAGE_IDS } from "@/lib/prototype/constants";
import type { PageId } from "@platform/types";

const VIEWS: Partial<Record<PageId, ReactNode>> = {
  dashboard: <DashboardView />,
  po: <PoListView />,
  properties: <PropertiesListView />,
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
};

export default async function PrototypePage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page: raw } = await params;
  if (!VALID_PAGE_IDS.has(raw as PageId)) notFound();
  const page = raw as PageId;
  const node = VIEWS[page];
  if (node) return node;
  notFound();
}
