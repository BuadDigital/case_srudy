import {
  assigneeLabel,
  getValuationCoordinators,
} from "./distribution-parties";
import {
  buildCaseStudyPartyAssignees,
  caseStudyTrackBadgeLabel,
  type CaseStudyTrackState,
} from "./case-study-tracks";
import {
  migrateDistribution,
  type WorkflowTask,
} from "./tasks-storage";

export type PropertyDetailPartyRoleKey =
  | "specialist"
  | "inspection"
  | "survey"
  | "appraisal"
  | "government"
  | "coordinator";

export type PropertyDetailPartyCard = {
  roleKey: PropertyDetailPartyRoleKey;
  role: string;
  name: string;
  unassigned: boolean;
  state: CaseStudyTrackState;
  enabled: boolean;
};

export type PropertyDetailPartyStatusRow = {
  label: string;
  badge: string;
  badgeClass: "pd-badge-teal" | "pd-badge-amber" | "pd-badge-gray";
};

function timelineBadgeForParty(
  enabled: boolean,
  state: CaseStudyTrackState,
  roleKey: string,
): { badge: string; badgeClass: PropertyDetailPartyStatusRow["badgeClass"] } {
  if (!enabled) {
    return { badge: "غير معيّن", badgeClass: "pd-badge-gray" };
  }
  if (state === "done") {
    return { badge: "مكتمل", badgeClass: "pd-badge-teal" };
  }
  if (state === "progress") {
    return { badge: "قيد التنفيذ", badgeClass: "pd-badge-amber" };
  }
  if (roleKey === "inspection") {
    return { badge: "لم يبدأ", badgeClass: "pd-badge-amber" };
  }
  return { badge: "غير معيّن", badgeClass: "pd-badge-gray" };
}

/** Six party cards for property detail — matches HTML mockup roles. */
export function buildPropertyDetailPartyCards(input: {
  specialistName: string;
  task: WorkflowTask | null;
  allTasks: WorkflowTask[];
}): PropertyDetailPartyCard[] {
  const { specialistName, task, allTasks } = input;
  const distribution = migrateDistribution(task?.distribution);
  const assignees = task ? buildCaseStudyPartyAssignees(task, allTasks) : [];

  const byTrack = (trackId: string) =>
    assignees.find((p) => p.trackId === trackId);

  const inspection = byTrack("inspection");
  const survey = byTrack("survey");
  const appraisal = byTrack("appraisal");
  const government = byTrack("government");

  const coordinatorName = distribution.valuationDepartment
    ? assigneeLabel(
        getValuationCoordinators(),
        distribution.operationsCoordinatorId,
      )
    : "";

  const cards: PropertyDetailPartyCard[] = [
    {
      roleKey: "specialist",
      role: "أخصائي دراسة الحالة",
      name: specialistName.trim() || "لم يُعيَّن",
      unassigned: !specialistName.trim(),
      state: "progress",
      enabled: true,
    },
    {
      roleKey: "inspection",
      role: "المعاين",
      name:
        inspection?.enabled && inspection.name !== "—"
          ? inspection.name
          : "لم يُعيَّن",
      unassigned: !inspection?.enabled || inspection?.name === "—",
      state: inspection?.state ?? "new",
      enabled: inspection?.enabled ?? false,
    },
    {
      roleKey: "survey",
      role: "المكتب الهندسي",
      name:
        survey?.enabled && survey.name !== "—" ? survey.name : "لم يُعيَّن",
      unassigned: !survey?.enabled || survey?.name === "—",
      state: survey?.state ?? "new",
      enabled: survey?.enabled ?? false,
    },
    {
      roleKey: "appraisal",
      role: "المقيّم العقاري",
      name:
        appraisal?.enabled && appraisal.name !== "—"
          ? appraisal.name
          : "لم يُعيَّن",
      unassigned: !appraisal?.enabled || appraisal?.name === "—",
      state: appraisal?.state ?? "new",
      enabled: appraisal?.enabled ?? false,
    },
    {
      roleKey: "government",
      role: "المراجع الحكومي",
      name:
        government?.enabled && government.name !== "—"
          ? government.name
          : "لم يُعيَّن",
      unassigned: !government?.enabled || government?.name === "—",
      state: government?.state ?? "new",
      enabled: government?.enabled ?? false,
    },
    {
      roleKey: "coordinator",
      role: "المنسق",
      name: coordinatorName.trim() || "لم يُعيَّن",
      unassigned: !coordinatorName.trim(),
      state: coordinatorName.trim() ? "progress" : "new",
      enabled: distribution.valuationDepartment,
    },
  ];

  return cards;
}

/** Timeline sidebar party rows — matches HTML mockup (no specialist). */
export function buildPropertyDetailTimelinePartyRows(input: {
  task: WorkflowTask | null;
  allTasks: WorkflowTask[];
}): PropertyDetailPartyStatusRow[] {
  const { task, allTasks } = input;
  const distribution = migrateDistribution(task?.distribution);
  const assignees = task ? buildCaseStudyPartyAssignees(task, allTasks) : [];
  const byTrack = (trackId: string) =>
    assignees.find((p) => p.trackId === trackId);

  const defs = [
    { key: "inspection", label: "المعاين", trackId: "inspection" },
    { key: "survey", label: "المكتب الهندسي", trackId: "survey" },
    { key: "appraisal", label: "المقيّم", trackId: "appraisal" },
    { key: "government", label: "المراجع الحكومي", trackId: "government" },
    {
      key: "coordinator",
      label: "المنسق",
      trackId: null as string | null,
    },
  ] as const;

  return defs.map((def) => {
    if (def.key === "coordinator") {
      const name = distribution.valuationDepartment
        ? assigneeLabel(
            getValuationCoordinators(),
            distribution.operationsCoordinatorId,
          )
        : "";
      const enabled = distribution.valuationDepartment && Boolean(name.trim());
      const badge = timelineBadgeForParty(enabled, name ? "progress" : "new", def.key);
      return { label: def.label, ...badge };
    }

    const party = def.trackId ? byTrack(def.trackId) : undefined;
    const enabled = party?.enabled ?? false;
    const state = party?.state ?? "new";
    return {
      label: def.label,
      ...timelineBadgeForParty(enabled, state, def.key),
    };
  });
}

export function partyCardStatusLabel(card: PropertyDetailPartyCard): string {
  if (card.unassigned) {
    if (card.role === "المعاين" && card.enabled) return "انتظار التعيين";
    return "لم يُعيَّن";
  }
  if (card.role === "أخصائي دراسة الحالة") return "نشط";
  return caseStudyTrackBadgeLabel(card.state);
}

export function partyCardDotClass(card: PropertyDetailPartyCard): string {
  if (card.unassigned) {
    if (card.role === "المعاين" && card.enabled) return "pd-status-dot--amber";
    return "pd-status-dot--gray";
  }
  if (card.state === "done") return "pd-status-dot--teal";
  if (card.state === "progress") return "pd-status-dot--teal";
  if (card.role === "المعاين") return "pd-status-dot--amber";
  return "pd-status-dot--gray";
}
