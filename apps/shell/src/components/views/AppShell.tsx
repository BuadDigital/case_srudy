"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, startTransition } from "react";
import { NavIcon } from "@/components/views/NavIcon";
import { usePrototype } from "@/contexts/PrototypeContext";
import { prefetchPrototypePage } from "@/lib/query/prototype-queries";
import { clearAuthSession, getAuthDisplayName } from "@platform/auth-client";
import type { PageId, RoleId } from "@platform/types";
import {
  NAV,
  PAGE_BREADCRUMB,
  PAGE_TITLES,
  ROLE_OPTIONS,
  ROLES,
} from "@/lib/prototype/constants";
import {
  ACTIVE_TRANSACTIONS_GROUP,
  ACTIVE_TRANSACTIONS_GROUP_ICON,
  ACTIVE_TRANSACTIONS_NAV,
  type ActiveTransactionNavItem,
  isInActiveTransactionsSection,
} from "@/lib/prototype/active-transactions";
import { resolvePoChrome } from "@/lib/po-chrome";
import { resolveMyTasksChrome } from "@/lib/my-tasks-chrome";
import { useActiveTransactionNavBadges } from "@/lib/query/use-active-transaction-nav-badges";
import { PoNumber } from "@/components/ui/PoNumber";

const GROUP_ORDER = ["الإدارة", "قسم دراسة الحالة", "قسم التقييم العقاري", "المالية"];

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
}: {
  item: (typeof NAV)[number];
  active: boolean;
  onPrefetch: (page: PageId) => void;
}) {
  const cls = `nav-item${active ? " active" : ""}${item.placeholder ? " nav-item-dummy" : ""}`;
  const badge = item.badge ? (
    <span className="nav-badge">{item.badge}</span>
  ) : null;
  return (
    <Link
      href={`/${item.id}`}
      className={cls}
      prefetch
      onMouseEnter={() => onPrefetch(item.id)}
      onFocus={() => onPrefetch(item.id)}
    >
      <NavIcon d={item.icon} size={13} />
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
  onPrefetch,
  badges,
}: {
  items: ActiveTransactionNavItem[];
  currentPage: PageId;
  onTaskWork: boolean;
  onPrefetch: (page: PageId) => void;
  badges: Partial<Record<PageId, number>>;
}) {
  const inSection = isInActiveTransactionsSection(currentPage, onTaskWork);
  const [open, setOpen] = useState(inSection);

  useEffect(() => {
    if (inSection) setOpen(true);
  }, [inSection]);

  const childActive = (tx: ActiveTransactionNavItem) =>
    currentPage === tx.id ||
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
        <NavIcon d={ACTIVE_TRANSACTIONS_GROUP_ICON} size={13} />
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { role, setRole, rolePages } = usePrototype();
  const [authDisplayName, setAuthDisplayName] = useState<string | null>(null);

  const navRuns = useMemo(
    () => navRunsForRole(rolePages),
    [rolePages],
  );

  const activeTransactionItems = useMemo(
    () =>
      ACTIVE_TRANSACTIONS_NAV.filter((item) => rolePages.includes(item.id)),
    [rolePages],
  );

  const showActiveTransactionsGroup = activeTransactionItems.length > 0;
  const activeTxBadges = useActiveTransactionNavBadges();

  const prefetchPage = useMemo(
    () => (page: PageId) => prefetchPrototypePage(queryClient, page),
    [queryClient],
  );

  useEffect(() => {
    startTransition(() => setAuthDisplayName(getAuthDisplayName()));
  }, []);

  const currentPage = useMemo(() => {
    const seg = pathname?.split("/").filter(Boolean)[0];
    return (seg ?? "dashboard") as PageId;
  }, [pathname]);

  const searchParams = useSearchParams();

  const poChrome = useMemo(
    () => (pathname ? resolvePoChrome(pathname) : null),
    [pathname],
  );
  const myTasksChrome = useMemo(
    () =>
      pathname
        ? resolveMyTasksChrome(
            pathname,
            currentPage === "active-primary-data"
              ? searchParams.get("task")
              : null,
          )
        : null,
    [pathname, currentPage, searchParams],
  );
  const inPoSection = pathname?.startsWith("/po") ?? false;
  const onTaskWork =
    (pathname?.startsWith("/my-tasks/") ?? false) ||
    (currentPage === "active-primary-data" && Boolean(searchParams.get("task"))) ||
    (currentPage === "active-distribution" && Boolean(searchParams.get("task")));

  const def = ROLES[role];
  const chipName = authDisplayName ?? def.name;

  function onRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const r = e.target.value as RoleId;
    setRole(r);
    const nextPages = ROLES[r].pages;
    if (!nextPages.includes(currentPage) && currentPage !== "my-tasks") {
      router.push("/dashboard");
    }
  }

  function logout() {
    clearAuthSession();
    window.location.assign("/login");
  }

  let activeTransactionsInserted = false;

  return (
    <div id="app">
      <div id="sidebar">
        <div className="sb-brand">
          <div className="sb-brand-row">
            <div className="sb-icon">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9,22 9,12 15,12 15,22" />
              </svg>
            </div>
            <h1>نظام إجادة الداخلي</h1>
          </div>
          <p>دراسة الحالة</p>
        </div>
        <div className="sb-role">
          <div className="sb-role-lbl">تبديل الدور</div>
          <select value={role} onChange={onRoleChange} aria-label="تبديل الدور">
            {GROUP_ORDER.map((g) => (
              <optgroup key={g} label={g}>
                {ROLE_OPTIONS.filter((o) => o.group === g).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <nav id="nav" aria-label="التنقل الرئيسي">
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
                    />,
                  ];
                  if (
                    !activeTransactionsInserted &&
                    showActiveTransactionsGroup &&
                    item.id === "po"
                  ) {
                    activeTransactionsInserted = true;
                    nodes.push(
                      <ActiveTransactionsNavDropdown
                        key="active-tx-dropdown"
                        items={activeTransactionItems}
                        currentPage={currentPage}
                        onTaskWork={onTaskWork}
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
              onPrefetch={prefetchPage}
              badges={activeTxBadges}
            />
          ) : null}
        </nav>
      </div>
      <div id="main">
        <div id="topbar">
          <div className="tb-left">
            <div className="tb-breadcrumb" id="tb-bc">
              {poChrome?.breadcrumb ??
                myTasksChrome?.breadcrumb ??
                PAGE_BREADCRUMB[currentPage] ??
                ""}
            </div>
            <div className="tb-title" id="page-title">
              {poChrome?.titlePo ? (
                <span className="po-heading-with-num">
                  <span className="po-heading-ar">{poChrome.title}</span>
                  <PoNumber value={poChrome.titlePo} />
                </span>
              ) : (
                (poChrome?.title ??
                  myTasksChrome?.title ??
                  PAGE_TITLES[currentPage] ??
                  currentPage)
              )}
            </div>
          </div>
          <div className="tb-right">
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
            <button
              type="button"
              className="btn btn-sm"
              onClick={logout}
              aria-label="تسجيل الخروج"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
        <div id="content">{children}</div>
      </div>
    </div>
  );
}
