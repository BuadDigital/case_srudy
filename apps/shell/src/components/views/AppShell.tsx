"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { resolvePoChrome } from "@/lib/po-chrome";
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

function NavRow({
  item,
  allowed,
  active,
  onPrefetch,
}: {
  item: (typeof NAV)[number];
  allowed: boolean;
  active: boolean;
  onPrefetch: (page: PageId) => void;
}) {
  const cls = `nav-item${active ? " active" : ""}${!allowed ? " locked" : ""}`;
  const badge =
    item.badge && allowed ? (
      <span className="nav-badge">{item.badge}</span>
    ) : null;
  const inner = (
    <>
      <NavIcon d={item.icon} size={13} />
      <span>{item.label}</span>
      {badge}
    </>
  );
  if (allowed) {
    return (
      <Link
        href={`/${item.id}`}
        className={cls}
        prefetch
        onMouseEnter={() => onPrefetch(item.id)}
        onFocus={() => onPrefetch(item.id)}
      >
        {inner}
      </Link>
    );
  }
  return <div className={cls}>{inner}</div>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { role, setRole, rolePages } = usePrototype();
  const [authDisplayName, setAuthDisplayName] = useState<string | null>(null);

  const navRuns = useMemo(() => buildNavRuns(), []);

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

  const poChrome = useMemo(
    () => (pathname ? resolvePoChrome(pathname) : null),
    [pathname],
  );
  const inPoSection = pathname?.startsWith("/po") ?? false;

  const def = ROLES[role];
  const chipName = authDisplayName ?? def.name;

  function onRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const r = e.target.value as RoleId;
    setRole(r);
    const nextPages = ROLES[r].pages;
    if (!nextPages.includes(currentPage)) {
      router.push("/dashboard");
    }
  }

  function logout() {
    clearAuthSession();
    window.location.assign("/login");
  }

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
          {navRuns.map((run, ri) => (
            <div key={ri}>
              {run.label ? (
                <div className="sb-grp">
                  <div className="sb-grp-lbl">{run.label}</div>
                </div>
              ) : null}
              {run.items.map((item) => (
                <NavRow
                  key={item.id}
                  item={item}
                  allowed={rolePages.includes(item.id)}
                  active={
                    currentPage === item.id ||
                    (item.id === "po" && inPoSection)
                  }
                  onPrefetch={prefetchPage}
                />
              ))}
            </div>
          ))}
        </nav>
      </div>
      <div id="main">
        <div id="topbar">
          <div className="tb-left">
            <div className="tb-breadcrumb" id="tb-bc">
              {poChrome?.breadcrumb ?? PAGE_BREADCRUMB[currentPage] ?? ""}
            </div>
            <div className="tb-title" id="page-title">
              {poChrome?.titlePo ? (
                <span className="po-heading-with-num">
                  <span className="po-heading-ar">{poChrome.title}</span>
                  <PoNumber value={poChrome.titlePo} />
                </span>
              ) : (
                (poChrome?.title ?? PAGE_TITLES[currentPage] ?? currentPage)
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
