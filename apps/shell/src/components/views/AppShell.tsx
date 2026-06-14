"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { NavIcon } from "@/components/views/NavIcon";
import { usePrototype } from "@platform/app-shared/contexts/PrototypeContext";
import {
  prefetchPoRecord,
  prefetchPrototypePage,
  usePoRecordQuery,
  useWorkflowTasksQuery,
} from "@/lib/query/prototype-queries";
import type { PageId, RoleId } from "@platform/types";
import {
  NAV,
  PAGE_BREADCRUMB,
  PAGE_TITLES,
  personaLabelName,
  ROLE_OPTIONS,
  ROLES,
} from "@platform/app-shared/prototype/constants";
import {
  ACTIVE_TRANSACTIONS_GROUP,
  ACTIVE_TRANSACTIONS_GROUP_ICON,
  activeTransactionNavForRole,
  type ActiveTransactionNavItem,
  isInActiveTransactionsSection,
} from "@platform/app-shared/prototype/active-transactions";
import {
  SETTINGS_GROUP,
  SETTINGS_GROUP_ICON,
  settingsNavForRole,
  type SettingsNavItem,
  isInSettingsSection,
} from "@platform/app-shared/prototype/settings-nav";
import {
  SYSTEM_FIELDS_GROUP,
  SYSTEM_FIELDS_GROUP_ICON,
  systemFieldsNavForRole,
  type SystemFieldsNavItem,
  isInSystemFieldsSection,
} from "@platform/app-shared/prototype/system-fields-nav";
import { isPartyTaskPage } from "@platform/app-shared/prototype/party-task-pages";
import { decodeTaskParam, isPartyTaskWorkPath } from "@case-study/mfe";
import { findPropertyForTask } from "@case-study/mfe";
import {
  formatPropertyDeedDisplay,
  PoListTopbarActions,
  PoPropertyDetailTopbarActions,
  PO_PROPERTY_SEGMENT,
  decodePoParam,
} from "@case-study/mfe";
import { AppBreadcrumb } from "@/components/views/AppBreadcrumb";
import { resolvePoChrome } from "@/lib/po-chrome";
import { resolveMyTasksChrome } from "@/lib/my-tasks-chrome";
import { pagesForPrototypeRole } from "@platform/app-shared/prototype/prototype-role-access";
import { ActiveTransactionsSituationBar } from "@case-study/mfe";
import { EngineeringSurveySituationBar } from "@engineering-office/mfe";
import { useActiveTransactionNavBadges } from "@/lib/query/use-active-transaction-nav-badges";
import { useFailuresNavBadge } from "@/lib/query/use-failures-nav-badge";
import { PoNumber } from "@case-study/mfe/components/ui/PoNumber";

/** Must match `group` on every entry in ROLE_OPTIONS (constants.ts). */
const GROUP_ORDER = [
  "التحول الرقمي",
  "إدارة المنظمة",
  "إدارة التقييم العقاري",
  "قسم دراسة الحالة",
  "قسم التقييم العقاري",
  "المالية والعقود",
  "مزود خارجي",
];

type NavRun = { label: string | null; items: (typeof NAV)[number][] };

function buildNavRuns(): NavRun[] {
  const runs: NavRun[] = [];
  let lastGrp: string | null = null;
  let cur: NavRun | null = null;

  for (const item of NAV) {
    if (item.grp && item.grp !== lastGrp) {
      lastGrp = item.grp;
      cur = { label: item.grp, items: [] };
      runs.push(cur);
      cur.items.push(item);
    } else if (!item.grp && lastGrp) {
      lastGrp = null;
      cur = { label: null, items: [] };
      runs.push(cur);
      cur.items.push(item);
    } else {
      if (!cur) {
        cur = { label: null, items: [] };
        runs.push(cur);
      }
      cur.items.push(item);
    }
  }
  return runs;
}

function navRunsForRole(rolePages: PageId[]): NavRun[] {
  return buildNavRuns()
    .map((run) => ({
      ...run,
      items: run.items.filter((item) => rolePages.includes(item.id)),
    }))
    .filter((run) => run.items.length > 0);
}

function NavRow({
  item,
  active,
  onPrefetch,
  badgeCount,
}: {
  item: (typeof NAV)[number];
  active: boolean;
  onPrefetch: (page: PageId) => void;
  badgeCount?: number;
}) {
  const cls = `nav-item${active ? " active" : ""}${item.placeholder ? " nav-item-dummy" : ""}`;
  const badgeValue =
    badgeCount != null && badgeCount > 0
      ? String(badgeCount)
      : item.badge;
  const badgeTeal = item.id === "po";
  const badge = badgeValue ? (
    <span className={`nav-badge${badgeTeal ? " teal" : ""}`}>{badgeValue}</span>
  ) : null;
  return (
    <Link
      href={`/${item.id}`}
      className={cls}
      prefetch
      onMouseEnter={() => onPrefetch(item.id)}
      onFocus={() => onPrefetch(item.id)}
    >
      <NavIcon d={item.icon} size={16} />
      <span>{item.label}</span>
      {badge}
    </Link>
  );
}

function ActiveTransactionNavRow({
  id,
  label,
  icon,
  available,
  placeholder,
  badgeCount,
  active,
  onPrefetch,
}: {
  id: PageId;
  label: string;
  icon: string;
  available: boolean;
  placeholder?: boolean;
  badgeCount?: number;
  active: boolean;
  onPrefetch: (page: PageId) => void;
}) {
  const cls = `nav-item nav-item-sub${active ? " active" : ""}${!available ? " locked" : ""}${placeholder ? " nav-item-dummy" : ""}`;
  const inner = (
    <>
      <NavIcon d={icon} size={12} />
      <span>{label}</span>
      {badgeCount != null && badgeCount > 0 ? (
        <span className="nav-badge">{badgeCount}</span>
      ) : !available ? (
        <span className="nav-badge" style={{ opacity: 0.7 }}>
          قريباً
        </span>
      ) : null}
    </>
  );
  if (!available) {
    return <div className={cls}>{inner}</div>;
  }
  return (
    <Link
      href={`/${id}`}
      className={cls}
      prefetch
      onMouseEnter={() => onPrefetch(id)}
      onFocus={() => onPrefetch(id)}
    >
      {inner}
    </Link>
  );
}

function NavDropdownChevron() {
  return (
    <svg
      className="nav-dropdown-chevron"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ActiveTransactionsNavDropdown({
  items,
  currentPage,
  onTaskWork,
  onCaseStudyWorkspace,
  onPrefetch,
  badges,
}: {
  items: ActiveTransactionNavItem[];
  currentPage: PageId;
  onTaskWork: boolean;
  onCaseStudyWorkspace: boolean;
  onPrefetch: (page: PageId) => void;
  badges: Partial<Record<PageId, number>>;
}) {
  const inSection =
    isInActiveTransactionsSection(currentPage, onTaskWork) ||
    onCaseStudyWorkspace;
  const [open, setOpen] = useState(inSection);

  useEffect(() => {
    if (inSection) setOpen(true);
  }, [inSection]);

  const childActive = (tx: ActiveTransactionNavItem) =>
    currentPage === tx.id ||
    (tx.id === "active-case-study" && onCaseStudyWorkspace) ||
    (isPartyTaskPage(tx.id) && onTaskWork) ||
    ((tx.id === "active-primary-data" || tx.id === "active-distribution") &&
      onTaskWork);

  return (
    <div className={`nav-dropdown${open ? " open" : ""}`}>
      <button
        type="button"
        className={`nav-item nav-dropdown-toggle nav-active-tx-group${inSection ? " active" : ""}`}
        aria-expanded={open}
        aria-controls="nav-active-transactions"
        onClick={() => setOpen((v) => !v)}
      >
        <NavIcon d={ACTIVE_TRANSACTIONS_GROUP_ICON} size={16} />
        <span>{ACTIVE_TRANSACTIONS_GROUP}</span>
        <NavDropdownChevron />
      </button>
      {open ? (
        <div
          id="nav-active-transactions"
          className="nav-dropdown-items"
          role="group"
          aria-label={ACTIVE_TRANSACTIONS_GROUP}
        >
          {items.map((tx) => (
            <ActiveTransactionNavRow
              key={tx.id}
              id={tx.id}
              label={tx.label}
              icon={tx.icon}
              available={tx.available}
              placeholder={tx.placeholder}
              badgeCount={badges[tx.id]}
              active={childActive(tx)}
              onPrefetch={onPrefetch}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FooterNavDropdown({
  groupLabel,
  groupIcon,
  groupClass,
  panelId,
  items,
  currentPage,
  inSection,
  onPrefetch,
}: {
  groupLabel: string;
  groupIcon: string;
  groupClass: string;
  panelId: string;
  items: (SettingsNavItem | SystemFieldsNavItem)[];
  currentPage: PageId;
  inSection: boolean;
  onPrefetch: (page: PageId) => void;
}) {
  const [open, setOpen] = useState(inSection);

  useEffect(() => {
    if (inSection) setOpen(true);
  }, [inSection]);

  return (
    <div className={`nav-dropdown nav-dropdown-settings${open ? " open" : ""}`}>
      <button
        type="button"
        className={`nav-item nav-dropdown-toggle ${groupClass}${inSection ? " active" : ""}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <NavIcon d={groupIcon} size={16} />
        <span>{groupLabel}</span>
        <NavDropdownChevron />
      </button>
      {open ? (
        <div
          id={panelId}
          className="nav-dropdown-items"
          role="group"
          aria-label={groupLabel}
        >
          {items.map((item) => (
            <ActiveTransactionNavRow
              key={item.id}
              id={item.id}
              label={item.label}
              icon={item.icon}
              available={item.available}
              placeholder={item.placeholder}
              active={currentPage === item.id}
              onPrefetch={onPrefetch}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { role, personaId, setPersona, rolePages } = usePrototype();

  const navPages = useMemo(() => rolePages, [rolePages]);

  const settingsNavItems = useMemo(
    () => settingsNavForRole(rolePages),
    [rolePages],
  );

  const systemFieldsNavItems = useMemo(
    () => systemFieldsNavForRole(rolePages),
    [rolePages],
  );

  const showSystemFieldsGroup = systemFieldsNavItems.some((i) => i.available);
  const showSettingsGroup = settingsNavItems.some((i) => i.available);

  const navRuns = useMemo(() => navRunsForRole(navPages), [navPages]);

  const activeTransactionItems = useMemo(
    () => activeTransactionNavForRole(rolePages),
    [rolePages],
  );

  const showActiveTransactionsGroup = activeTransactionItems.length > 0;
  const activeTxBadges = useActiveTransactionNavBadges();
  const failuresNavBadge = useFailuresNavBadge();
  const insertActiveTxAfterPo = rolePages.includes("po");

  const prefetchPage = useMemo(
    () => (page: PageId) => prefetchPrototypePage(queryClient, page),
    [queryClient],
  );

  const currentPage = useMemo(() => {
    const seg = pathname?.split("/").filter(Boolean)[0];
    return (seg ?? "dashboard") as PageId;
  }, [pathname]);

  useEffect(() => {
    prefetchPrototypePage(queryClient, currentPage);
  }, [queryClient, currentPage]);

  const searchParams = useSearchParams();
  const onCaseStudyWorkspace = pathname?.startsWith("/case-study/") ?? false;
  const onActiveSurveyWorkspace =
    (pathname?.startsWith("/active-survey/") &&
      pathname.split("/").filter(Boolean).length >= 2) ??
    false;
  const onPropertyAppraisalWorkspace =
    (pathname?.startsWith("/property-appraisal/") &&
      pathname.split("/").filter(Boolean).length >= 2) ??
    false;
  const onPropertyInspectionWorkspace =
    (pathname?.startsWith("/property-inspection/") &&
      pathname.split("/").filter(Boolean).length >= 2) ??
    false;
  const onGovernmentReviewWorkspace =
    (pathname?.startsWith("/government-review/") &&
      pathname.split("/").filter(Boolean).length >= 2) ??
    false;
  const onValuationCoordinationWorkspace =
    (pathname?.startsWith("/valuation-coordination/") &&
      pathname.split("/").filter(Boolean).length >= 2) ??
    false;
  const caseStudyTaskId = onCaseStudyWorkspace
    ? pathname.split("/").filter(Boolean)[1] ?? null
    : null;
  const activeSurveyTaskId = onActiveSurveyWorkspace
    ? pathname.split("/").filter(Boolean)[1] ?? null
    : null;
  const propertyAppraisalTaskId = onPropertyAppraisalWorkspace
    ? pathname.split("/").filter(Boolean)[1] ?? null
    : null;
  const propertyInspectionTaskId = onPropertyInspectionWorkspace
    ? pathname.split("/").filter(Boolean)[1] ?? null
    : null;
  const governmentReviewTaskId = onGovernmentReviewWorkspace
    ? pathname.split("/").filter(Boolean)[1] ?? null
    : null;
  const valuationCoordinationTaskId = onValuationCoordinationWorkspace
    ? pathname.split("/").filter(Boolean)[1] ?? null
    : null;

  const { data: workflowTasks } = useWorkflowTasksQuery();

  const caseStudyTask = useMemo(() => {
    if (!caseStudyTaskId) return null;
    const id = decodeTaskParam(caseStudyTaskId);
    return workflowTasks?.find((t) => t.id === id) ?? null;
  }, [caseStudyTaskId, workflowTasks]);

  const { data: caseStudyPo } = usePoRecordQuery(
    caseStudyTask?.poNumber ?? null,
  );

  useEffect(() => {
    if (caseStudyTask?.poNumber) {
      prefetchPrototypePage(queryClient, "active-case-study");
      prefetchPoRecord(queryClient, caseStudyTask.poNumber);
    }
  }, [queryClient, caseStudyTask?.poNumber]);

  const caseStudyDeedLabel = useMemo(() => {
    if (!caseStudyTask || !caseStudyPo) return "";
    const prop = findPropertyForTask(caseStudyPo, caseStudyTask);
    if (!prop) return "";
    const formatted = formatPropertyDeedDisplay(prop);
    if (formatted && formatted !== "—") return formatted;
    return prop.deedNumber.trim();
  }, [caseStudyTask, caseStudyPo]);

  const poPropertyDetailContext = useMemo(() => {
    if (!pathname) return null;
    const parts = pathname.split("/").filter(Boolean);
    if (
      parts[0] !== "po" ||
      parts[2] !== PO_PROPERTY_SEGMENT ||
      parts.length !== 4 ||
      parts[3] === "new"
    ) {
      return null;
    }
    return {
      poNumber: decodePoParam(parts[1]),
      propertyId: decodePoParam(parts[3]),
    };
  }, [pathname]);

  const { data: poPropertyDetailRecord } = usePoRecordQuery(
    poPropertyDetailContext?.poNumber ?? null,
  );

  const poPropertyDeedLabel = useMemo(() => {
    if (!poPropertyDetailContext || !poPropertyDetailRecord) return undefined;
    const property = poPropertyDetailRecord.properties.find(
      (p) => p.id === poPropertyDetailContext.propertyId,
    );
    if (!property) return undefined;
    const formatted = formatPropertyDeedDisplay(property);
    if (formatted && formatted !== "—") return formatted;
    return property.deedNumber.trim() || undefined;
  }, [poPropertyDetailContext, poPropertyDetailRecord]);

  const poChrome = useMemo(
    () =>
      pathname
        ? resolvePoChrome(pathname, { deedLabel: poPropertyDeedLabel })
        : null,
    [pathname, poPropertyDeedLabel],
  );
  const taskQuery = searchParams.get("task");
  const myTasksChrome = useMemo(
    () =>
      pathname
        ? resolveMyTasksChrome(
            pathname,
            currentPage === "active-primary-data" ||
              currentPage === "active-distribution" ||
              currentPage === "active-case-study" ||
              onCaseStudyWorkspace ||
              onActiveSurveyWorkspace ||
              onPropertyAppraisalWorkspace ||
              onPropertyInspectionWorkspace ||
              onGovernmentReviewWorkspace ||
              onValuationCoordinationWorkspace ||
              isPartyTaskPage(currentPage)
              ? onCaseStudyWorkspace
                ? caseStudyTaskId
                : onActiveSurveyWorkspace
                  ? activeSurveyTaskId
                  : onPropertyAppraisalWorkspace
                    ? propertyAppraisalTaskId
                    : onPropertyInspectionWorkspace
                      ? propertyInspectionTaskId
                      : onGovernmentReviewWorkspace
                        ? governmentReviewTaskId
                        : onValuationCoordinationWorkspace
                          ? valuationCoordinationTaskId
                          : taskQuery
              : null,
            onCaseStudyWorkspace
              ? { deedLabel: caseStudyDeedLabel }
              : undefined,
          )
        : null,
    [
      pathname,
      currentPage,
      taskQuery,
      onCaseStudyWorkspace,
      onActiveSurveyWorkspace,
      onPropertyAppraisalWorkspace,
      onPropertyInspectionWorkspace,
      onGovernmentReviewWorkspace,
      onValuationCoordinationWorkspace,
      caseStudyTaskId,
      activeSurveyTaskId,
      propertyAppraisalTaskId,
      propertyInspectionTaskId,
      governmentReviewTaskId,
      valuationCoordinationTaskId,
      caseStudyDeedLabel,
    ],
  );
  const inPoSection = pathname?.startsWith("/po") ?? false;
  const onTaskWork =
    (currentPage === "active-primary-data" && Boolean(taskQuery)) ||
    (currentPage === "active-distribution" && Boolean(taskQuery)) ||
    onActiveSurveyWorkspace ||
    onPropertyAppraisalWorkspace ||
    onPropertyInspectionWorkspace ||
    onGovernmentReviewWorkspace ||
    onValuationCoordinationWorkspace ||
    (pathname ? isPartyTaskWorkPath(pathname) && Boolean(taskQuery) : false);

  const showActiveTransactionsSituation =
    isInActiveTransactionsSection(currentPage, onTaskWork) ||
    onCaseStudyWorkspace ||
    onActiveSurveyWorkspace ||
    onPropertyAppraisalWorkspace ||
    onPropertyInspectionWorkspace ||
    onGovernmentReviewWorkspace ||
    onValuationCoordinationWorkspace;

  const def = ROLES[role];
  /** يطابق «تبديل الدور» — اسم الشخصية وليس displayName من تسجيل الدخول */
  const chipName = personaLabelName(personaId) ?? def.name;

  function onPersonaChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setPersona(id);
    const opt = ROLE_OPTIONS.find((o) => o.id === id);
    const nextRole = opt?.value ?? role;
    const nextPages = pagesForPrototypeRole(nextRole);
    if (!nextPages.includes(currentPage) && currentPage !== "my-tasks") {
      router.push("/dashboard");
    }
  }

  let activeTransactionsInserted = false;

  const onPoPropertyDetail = Boolean(poChrome?.propertyDetail);
  const onPoList = pathname === "/po";
  const breadcrumbSegments =
    poChrome?.segments ??
    (myTasksChrome?.breadcrumb
      ? myTasksChrome.breadcrumb
          .split(" / ")
          .map((label) => ({ label: label.trim() }))
          .filter((s) => s.label)
      : PAGE_BREADCRUMB[currentPage]
        ? PAGE_BREADCRUMB[currentPage]
            .split(" / ")
            .map((label) => ({ label: label.trim() }))
            .filter((s) => s.label)
        : undefined);

  const resolvedPageTitle =
    poChrome?.title ??
    myTasksChrome?.title ??
    PAGE_TITLES[currentPage] ??
    "";

  const displayBreadcrumbSegments = (() => {
    if (onPoPropertyDetail || !breadcrumbSegments?.length) {
      return breadcrumbSegments ?? [];
    }
    const lastLabel =
      breadcrumbSegments[breadcrumbSegments.length - 1]!.label.trim();
    const titleTrimmed = resolvedPageTitle.trim();
    if (!poChrome?.titlePo && titleTrimmed && titleTrimmed === lastLabel) {
      return breadcrumbSegments.slice(0, -1);
    }
    return breadcrumbSegments;
  })();

  return (
    <div id="app">
      <div id="sidebar">
        <div className="sb-brand">
          <div className="sb-brand-icon" aria-hidden>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 21h18" />
              <path d="M9 8h1" />
              <path d="M9 12h1" />
              <path d="M9 16h1" />
              <path d="M14 8h1" />
              <path d="M14 12h1" />
              <path d="M14 16h1" />
              <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
            </svg>
          </div>
          <span className="sb-brand-title">إجادة للتقييم</span>
        </div>
        <div className="sb-role">
          <div className="sb-role-lbl">تبديل الدور</div>
          <select
            value={personaId}
            onChange={onPersonaChange}
            aria-label="تبديل الدور"
          >
            {GROUP_ORDER.map((g) => (
              <optgroup key={g} label={g}>
                {ROLE_OPTIONS.filter((o) => o.group === g).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <nav id="nav" className="sb-nav" aria-label="التنقل الرئيسي">
          {navRuns.map((run, ri) => {
            const blocks: React.ReactNode[] = [];
            blocks.push(
              <div key={`run-${ri}`}>
                {run.label ? (
                  <div className="sb-grp">
                    <div className="sb-grp-lbl">{run.label}</div>
                  </div>
                ) : null}
                {run.items.map((item) => {
                  const nodes: React.ReactNode[] = [
                    <NavRow
                      key={item.id}
                      item={item}
                      active={
                        currentPage === item.id ||
                        (item.id === "po" && inPoSection)
                      }
                      onPrefetch={prefetchPage}
                      badgeCount={
                        item.id === "failures" ? failuresNavBadge : undefined
                      }
                    />,
                  ];
                  const shouldInsertActiveTx =
                    !activeTransactionsInserted &&
                    showActiveTransactionsGroup &&
                    ((insertActiveTxAfterPo && item.id === "po") ||
                      (!insertActiveTxAfterPo && item.id === "dashboard"));
                  if (shouldInsertActiveTx) {
                    activeTransactionsInserted = true;
                    nodes.push(
                      <ActiveTransactionsNavDropdown
                        key="active-tx-dropdown"
                        items={activeTransactionItems}
                        currentPage={currentPage}
                        onTaskWork={onTaskWork}
                        onCaseStudyWorkspace={onCaseStudyWorkspace}
                        onPrefetch={prefetchPage}
                        badges={activeTxBadges}
                      />,
                    );
                  }
                  return nodes;
                })}
              </div>,
            );
            return blocks;
          })}
          {!activeTransactionsInserted && showActiveTransactionsGroup ? (
            <ActiveTransactionsNavDropdown
              key="active-tx-dropdown-fallback"
              items={activeTransactionItems}
              currentPage={currentPage}
              onTaskWork={onTaskWork}
              onCaseStudyWorkspace={onCaseStudyWorkspace}
              onPrefetch={prefetchPage}
              badges={activeTxBadges}
            />
          ) : null}
        </nav>
        <div className="sb-nav-footer" aria-label="قوائم النظام">
          {showSystemFieldsGroup ? (
            <FooterNavDropdown
              groupLabel={SYSTEM_FIELDS_GROUP}
              groupIcon={SYSTEM_FIELDS_GROUP_ICON}
              groupClass="nav-system-fields-group"
              panelId="nav-system-fields"
              items={systemFieldsNavItems}
              currentPage={currentPage}
              inSection={isInSystemFieldsSection(currentPage)}
              onPrefetch={prefetchPage}
            />
          ) : null}
          {showSettingsGroup ? (
            <FooterNavDropdown
              groupLabel={SETTINGS_GROUP}
              groupIcon={SETTINGS_GROUP_ICON}
              groupClass="nav-settings-group"
              panelId="nav-settings"
              items={settingsNavItems}
              currentPage={currentPage}
              inSection={isInSettingsSection(currentPage)}
              onPrefetch={prefetchPage}
            />
          ) : null}
        </div>
      </div>
      <div id="main">
        <div id="topbar">
          <div className="tb-left">
            <AppBreadcrumb segments={displayBreadcrumbSegments} />
            {!onPoPropertyDetail
              ? (() => {
                  if (!resolvedPageTitle && !poChrome?.titlePo) return null;
                  return (
                    <div className="tb-title" id="page-title">
                      {poChrome?.titlePo ? (
                        <span className="po-heading-with-num">
                          <span className="po-heading-ar">{poChrome.title}</span>
                          <PoNumber value={poChrome.titlePo} />
                        </span>
                      ) : (
                        resolvedPageTitle
                      )}
                    </div>
                  );
                })()
              : null}
          </div>
          <div className="tb-right">
            {onPoList ? <PoListTopbarActions /> : null}
            {poChrome?.propertyDetail ? (
              <PoPropertyDetailTopbarActions
                poNumber={poChrome.propertyDetail.poNumber}
                propertyId={poChrome.propertyDetail.propertyId}
              />
            ) : null}
            <div className="user-chip">
              <div
                className="avatar"
                id="uav"
                style={{ background: def.bg, color: def.tc }}
              >
                {def.init}
              </div>
              <div>
                <div id="uname" style={{ fontSize: 12, fontWeight: 500 }}>
                  {chipName}
                </div>
                <div id="udept" style={{ fontSize: 10, color: "var(--text3)" }}>
                  {def.dept}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id="content" className="content content--flush">
          {showActiveTransactionsSituation ? (
            currentPage === "active-survey" || onActiveSurveyWorkspace ? (
              <EngineeringSurveySituationBar />
            ) : (
              <ActiveTransactionsSituationBar />
            )
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
