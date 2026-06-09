"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { StatValue } from "@case-study/mfe/components/ui/StatValue";
import { useActiveTransactionsSituation } from "@case-study/mfe/query/use-active-transactions-situation";

function SituationCard({
  label,
  value,
  sub,
  tone,
  href,
}: {
  label: string;
  value: number | undefined;
  sub: string;
  tone: "blue" | "warn" | "green" | "red";
  href?: string;
}) {
  const inner = (
    <>
      <div className="stat-label">{label}</div>
      <StatValue value={value} />
      <div className="stat-sub">{sub}</div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`stat-card ${tone} active-tx-situation-card active-tx-situation-card--link`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className={`stat-card ${tone} active-tx-situation-card`}>{inner}</div>
  );
}

const SUB_ASSIGNED_TO_YOU = "المسندة إليك";

/** ملخص «وضعي» — أعلى كل شاشات المعاملات النشطة (أرقام فقط). */
export function ActiveTransactionsSituationBar() {
  const stats = useActiveTransactionsSituation();
  const { showPoMetrics, showTransactionMetrics } = stats.flags;

  if (!showPoMetrics && !showTransactionMetrics) return null;

  const cards: ReactNode[] = [];

  if (showPoMetrics) {
    cards.push(
      <SituationCard
        key="po"
        label="أوامر العمل النشطة"
        value={stats.incompletePo}
        sub={SUB_ASSIGNED_TO_YOU}
        tone="blue"
        href="/po"
      />,
      <SituationCard
        key="props"
        label="عقارات وردت اليوم"
        value={stats.propertiesToday}
        sub={SUB_ASSIGNED_TO_YOU}
        tone="warn"
      />,
    );
  }

  if (showTransactionMetrics) {
    cards.push(
      <SituationCard
        key="in"
        label="كل المعاملات"
        value={stats.transactionsArrivedToday}
        sub={SUB_ASSIGNED_TO_YOU}
        tone="green"
      />,
      <SituationCard
        key="done"
        label="أنجزت اليوم"
        value={stats.transactionsDoneToday}
        sub={SUB_ASSIGNED_TO_YOU}
        tone="red"
      />,
    );
  }

  const colCount = cards.length;
  const gridClass =
    colCount === 2
      ? "stat-grid active-tx-situation-grid active-tx-situation-grid--2"
      : colCount === 3
        ? "stat-grid active-tx-situation-grid active-tx-situation-grid--3"
        : "stat-grid active-tx-situation-grid";

  return (
    <section
      className="active-tx-situation"
      aria-label="ملخص وضع المعاملات"
    >
      <div className={gridClass}>{cards}</div>
    </section>
  );
}
