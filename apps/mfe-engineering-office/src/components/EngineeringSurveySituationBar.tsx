"use client";

import { useEffect, useState } from "react";
import { StatValue } from "@case-study/mfe/components/ui/StatValue";
import { computeEngineeringSurveyStats } from "../lib/engineering-survey-queue";
import { ENGINEERING_SURVEY_SUBMISSION_CHANGED_EVENT } from "../lib/engineering-survey-submission-storage";
import { useEngineeringSurveyListedTasks } from "../query/use-engineering-survey-listed-tasks";

function SituationCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | undefined;
  tone: "blue" | "warn" | "green" | "red";
}) {
  return (
    <div className={`stat-card ${tone} active-tx-situation-card`}>
      <div className="stat-label">{label}</div>
      <StatValue value={value} />
    </div>
  );
}

/** ملخص مهام الرفع المساحي — أعلى شاشة القائمة (نفس شريط وضع المعاملات). */
export function EngineeringSurveySituationBar() {
  const { listed, ready } = useEngineeringSurveyListedTasks();
  const [, bump] = useState(0);

  useEffect(() => {
    const refresh = () => bump((n) => n + 1);
    window.addEventListener(
      ENGINEERING_SURVEY_SUBMISSION_CHANGED_EVENT,
      refresh,
    );
    return () =>
      window.removeEventListener(
        ENGINEERING_SURVEY_SUBMISSION_CHANGED_EVENT,
        refresh,
      );
  }, []);

  const stats = computeEngineeringSurveyStats(listed);

  return (
    <section
      className="active-tx-situation"
      aria-label="ملخص مهام الرفع المساحي"
    >
      <div className="stat-grid active-tx-situation-grid">
        <SituationCard
          label="إجمالي المهام"
          value={ready ? stats.total : undefined}
          tone="blue"
        />
        <SituationCard
          label="قيد التنفيذ"
          value={ready ? stats.inProgress : undefined}
          tone="warn"
        />
        <SituationCard
          label="مُرسَلة"
          value={ready ? stats.submitted : undefined}
          tone="green"
        />
        <SituationCard
          label="مُعادة"
          value={ready ? stats.returned : undefined}
          tone="red"
        />
      </div>
    </section>
  );
}
